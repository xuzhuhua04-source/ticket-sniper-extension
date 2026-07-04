(() => {
  const VALID_CATEGORIES = new Set(["dom", "layout", "vdom", "cssom", "a11y", "shadow", "multicontext", "network", "crawler", "anti_crawler", "runtime", "storage", "performance"]);
  const VALID_SEVERITIES = new Set(["info", "low", "medium", "high"]);
  const DEFAULT_BUCKET_SIZE_MS = 60_000;

  class FactContextInjector {
    inject(rawFact, envelope = {}) {
      const context = rawFact?.context && typeof rawFact.context === "object" ? rawFact.context : {};
      const pageUrl = context.pageUrl || envelope.pageUrl || sanitizeUrl(envelope.tabUrl || "");
      return {
        ...rawFact,
        context: sanitizeObject({
          sessionId: context.sessionId || envelope.sessionId || "",
          pageUrl,
          referrer: context.referrer || "",
          userAgent: context.userAgent || "",
          device: context.device || {},
          network: context.network || {},
          collectorVersion: context.collectorVersion || envelope.collectorVersion || "3.2.0",
          tabId: envelope.tabId || context.tabId || null,
          host: envelope.host || safeHost(envelope.tabUrl || pageUrl)
        })
      };
    }
  }

  class FactBatcher {
    createBatch(rawFact, envelope = {}) {
      const timestamp = Number(rawFact?.timestamp) || Date.now();
      const id = envelope.batchId || rawFact?.batch?.id || rawFact?.metadata?.batchId || `${safeHost(envelope.tabUrl || rawFact?.context?.pageUrl || "")}:${Math.floor(timestamp / 1000)}`;
      const seq = Number(rawFact?.batch?.seq ?? rawFact?.metadata?.seq ?? envelope.seq ?? 0);
      const hash = rawFact?.batch?.hash || rawFact?.metadata?.hash || stableHash(JSON.stringify({
        source: rawFact?.source,
        type: rawFact?.type,
        value: rawFact?.value,
        metadata: rawFact?.metadata,
        id,
        seq
      }));
      return { id: String(id), seq, hash };
    }
  }

  class FactNormalizer {
    constructor() {
      this.contextInjector = new FactContextInjector();
      this.batcher = new FactBatcher();
    }

    normalize(rawFact, envelope = {}) {
      const withContext = this.contextInjector.inject(rawFact || {}, envelope);
      const timestamp = Number(withContext.timestamp) || Date.now();
      const category = normalizeCategory(withContext.source);
      const signal = normalizeSignal(withContext.type);
      const value = flattenValue(withContext.value || {}, withContext.metadata || {});
      const severity = normalizeSeverity(value.severity || withContext.severity);
      const batch = this.batcher.createBatch(withContext, envelope);
      const key = structuralFactKey({ category, signal, value, context: withContext.context });
      return {
        timestamp,
        category,
        signal,
        severity,
        key,
        value,
        context: withContext.context,
        batch,
        raw: sanitizeObject(withContext)
      };
    }
  }

  class FrequencyGraphUpdate {
    constructor(options = {}) {
      this.bucketSizeMs = options.bucketSizeMs || DEFAULT_BUCKET_SIZE_MS;
      this.graph = options.graph ? deserializeGraph(options.graph) : { nodes: new Map(), edges: new Map() };
      this.batchKeys = new Map();
      for (const [batchId, keys] of Object.entries(options.batchKeys || {})) this.batchKeys.set(batchId, new Set(keys));
    }

    update(fact) {
      const bucketId = this.getBucketId(fact.timestamp);
      this.updateNode(fact, bucketId);
      this.updateBatchCooccurrence(fact);
    }

    getGraph() {
      return this.graph;
    }

    serialize() {
      return {
        bucketSizeMs: this.bucketSizeMs,
        nodes: [...this.graph.nodes.values()],
        edges: [...this.graph.edges.values()],
        batchKeys: Object.fromEntries([...this.batchKeys.entries()].slice(-80).map(([id, keys]) => [id, [...keys].slice(-80)]))
      };
    }

    getBucketId(timestamp) {
      return Math.floor(timestamp / this.bucketSizeMs).toString();
    }

    updateNode(fact, bucketId) {
      let node = this.graph.nodes.get(fact.key);
      if (!node) {
        node = {
          key: fact.key,
          category: fact.category,
          signal: fact.signal,
          totalCount: 0,
          severityCounts: { info: 0, low: 0, medium: 0, high: 0 },
          buckets: {}
        };
        this.graph.nodes.set(fact.key, node);
      }
      node.totalCount += 1;
      node.severityCounts[fact.severity] = (node.severityCounts[fact.severity] || 0) + 1;
      node.buckets[bucketId] = (node.buckets[bucketId] || 0) + 1;
    }

    updateBatchCooccurrence(fact) {
      const batchId = fact.batch?.id;
      if (!batchId) return;
      let keys = this.batchKeys.get(batchId);
      if (!keys) {
        keys = new Set();
        this.batchKeys.set(batchId, keys);
      }
      for (const existingKey of keys) {
        if (existingKey === fact.key) continue;
        this.updateEdge(existingKey, fact.key);
        this.updateEdge(fact.key, existingKey);
      }
      keys.add(fact.key);
      if (this.batchKeys.size > 100) this.batchKeys.delete(this.batchKeys.keys().next().value);
    }

    updateEdge(from, to) {
      const edgeKey = `${from}|${to}`;
      let edge = this.graph.edges.get(edgeKey);
      if (!edge) {
        edge = { from, to, totalCooccurrence: 0 };
        this.graph.edges.set(edgeKey, edge);
      }
      edge.totalCooccurrence += 1;
    }
  }

  class StructuralEventGenerator {
    constructor(options = {}) {
      this.bucketSizeMs = options.bucketSizeMs || DEFAULT_BUCKET_SIZE_MS;
      this.spikeK = options.spikeStddevMultiplier ?? 3;
      this.minSpike = options.minSpikeCount ?? 5;
      this.minPattern = options.minPatternRepetition ?? 3;
    }

    generate(fact, graph) {
      const events = [];
      const node = graph.nodes.get(fact.key);
      if (!node) return events;
      const bucketId = this.getBucketId(fact.timestamp);
      const current = node.buckets[bucketId] || 0;
      const history = getHistory(node, bucketId);
      const avg = mean(history);
      const std = stddev(history, avg);
      if (current >= this.minSpike && current > avg + this.spikeK * std) events.push(this.buildEvent("spike", fact, current - avg, bucketId));
      if (history.length && current < avg - this.spikeK * std) events.push(this.buildEvent("drop", fact, avg - current, bucketId));
      if (node.totalCount >= this.minPattern) events.push(this.buildEvent("pattern", fact, node.totalCount, bucketId));
      if (node.totalCount === 1 && ["anti_crawler", "crawler", "network"].includes(fact.category)) events.push(this.buildEvent("anomaly", fact, 1, bucketId));
      if (fact.severity === "high" && node.totalCount >= 2) events.push(this.buildEvent("anomaly", fact, node.totalCount, bucketId));
      if (!events.length) events.push(this.buildEvent("observation", fact, current, bucketId));
      return events;
    }

    getBucketId(timestamp) {
      return Math.floor(timestamp / this.bucketSizeMs).toString();
    }

    buildEvent(eventType, fact, delta, window) {
      return {
        timestamp: fact.timestamp,
        eventType,
        category: fact.category,
        signal: fact.signal,
        severity: fact.severity,
        key: fact.key,
        delta: Number(delta) || 0,
        window,
        context: fact.context,
        rawFact: fact
      };
    }
  }

  class FeatureExtractor {
    extract(event, graph) {
      const node = graph.nodes.get(event.key);
      if (!node) return null;
      const history = getHistory(node, event.window);
      const meanBucketCount = mean(history);
      const stdBucketCount = stddev(history, meanBucketCount);
      return {
        timestamp: event.timestamp,
        category: event.category,
        signal: event.signal,
        key: event.key,
        features: {
          totalCount: node.totalCount,
          severityInfoCount: node.severityCounts.info || 0,
          severityLowCount: node.severityCounts.low || 0,
          severityMediumCount: node.severityCounts.medium || 0,
          severityHighCount: node.severityCounts.high || 0,
          currentBucketCount: node.buckets[event.window] || 0,
          meanBucketCount,
          stdBucketCount,
          delta: event.delta,
          cooccurrenceDegree: getCooccurrenceDegree(event.key, graph)
        },
        context: event.context,
        event
      };
    }
  }

  class ScoringEngine {
    constructor(options = {}) {
      this.F = options.frequencyScale ?? 50;
      this.C = options.cooccurrenceScale ?? 10;
      this.a = options.weightFrequency ?? 0.2;
      this.b = options.weightSeverity ?? 0.3;
      this.c = options.weightSpike ?? 0.3;
      this.d = options.weightCooccurrence ?? 0.2;
      this.sevW = options.severityWeights || { low: 0.3, medium: 0.7, high: 1 };
    }

    score(features) {
      const f = features.features;
      const frequencyScore = 1 - Math.exp(-f.totalCount / this.F);
      const severityScore = 1 - Math.exp(-((this.sevW.low * f.severityLowCount) + (this.sevW.medium * f.severityMediumCount) + (this.sevW.high * f.severityHighCount)) / 10);
      const spikeScore = f.stdBucketCount > 0 ? clamp(f.delta / (f.stdBucketCount + 1e-6), 0, 1) : 0;
      const cooccurrenceScore = 1 - Math.exp(-f.cooccurrenceDegree / this.C);
      const score = clamp((this.a * frequencyScore) + (this.b * severityScore) + (this.c * spikeScore) + (this.d * cooccurrenceScore), 0, 1);
      return {
        timestamp: features.timestamp,
        category: features.category,
        signal: features.signal,
        key: features.key,
        score,
        components: { frequencyScore, severityScore, spikeScore, cooccurrenceScore },
        context: features.context,
        features
      };
    }
  }

  class UpdateClassificationEngine {
    constructor(options = {}) {
      this.tMinor = options.minorThreshold ?? 0.25;
      this.tLogic = options.logicThreshold ?? 0.5;
      this.tMajor = options.majorThreshold ?? 0.75;
    }

    classify(scoreResult) {
      return {
        timestamp: scoreResult.timestamp,
        classification: this.getClass(scoreResult.score),
        score: scoreResult.score,
        category: scoreResult.category,
        signal: scoreResult.signal,
        key: scoreResult.key,
        context: scoreResult.context,
        scoreResult
      };
    }

    getClass(score) {
      if (score < this.tMinor) return "MINOR_UPDATE";
      if (score < this.tLogic) return "LOGIC_UPDATE";
      if (score < this.tMajor) return "MAJOR_UPDATE";
      return "SYSTEM_WIDE_UPDATE";
    }
  }

  class StructuralFactPipeline {
    constructor(snapshot = {}) {
      this.normalizer = new FactNormalizer();
      this.graphUpdate = new FrequencyGraphUpdate({ bucketSizeMs: snapshot.bucketSizeMs || DEFAULT_BUCKET_SIZE_MS, graph: snapshot.frequencyGraph, batchKeys: snapshot.batchKeys });
      this.eventGenerator = new StructuralEventGenerator({ bucketSizeMs: snapshot.bucketSizeMs || DEFAULT_BUCKET_SIZE_MS });
      this.featureExtractor = new FeatureExtractor();
      this.scoringEngine = new ScoringEngine();
      this.classifier = new UpdateClassificationEngine();
    }

    process(rawFact, envelope = {}) {
      const normalized = this.normalizer.normalize(rawFact, envelope);
      this.graphUpdate.update(normalized);
      const graph = this.graphUpdate.getGraph();
      const events = this.eventGenerator.generate(normalized, graph);
      const features = events.map(event => this.featureExtractor.extract(event, graph)).filter(Boolean);
      const scores = features.map(feature => this.scoringEngine.score(feature));
      const classifications = scores.map(score => this.classifier.classify(score));
      return {
        normalized,
        graph,
        events,
        features,
        scores,
        classifications,
        snapshot: this.snapshot()
      };
    }

    snapshot() {
      const graph = this.graphUpdate.serialize();
      return {
        version: "fact-normalizer-pipeline-v1",
        bucketSizeMs: graph.bucketSizeMs,
        frequencyGraph: {
          nodes: graph.nodes.slice(-250),
          edges: graph.edges.slice(-500)
        },
        batchKeys: graph.batchKeys,
        summary: summarizeGraph(graph)
      };
    }
  }

  function normalizeCategory(source) {
    const value = String(source || "unknown").replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    return VALID_CATEGORIES.has(value) ? value : "unknown";
  }

  function normalizeSignal(type) {
    return String(type || "fact").replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || "fact";
  }

  function normalizeSeverity(severity) {
    const value = String(severity || "low").toLowerCase();
    if (!VALID_SEVERITIES.has(value)) return "low";
    return value;
  }

  function flattenValue(value, metadata) {
    return flattenObject({ ...sanitizeObject(value), ...prefixObject(sanitizeObject(metadata), "metadata") });
  }

  function flattenObject(value, prefix = "", output = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return output;
    for (const [key, raw] of Object.entries(value).slice(0, 80)) {
      const cleanKey = String(key).replace(/[^a-z0-9_-]/gi, "_").slice(0, 50) || "value";
      const path = prefix ? `${prefix}.${cleanKey}` : cleanKey;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) flattenObject(raw, path, output);
      else output[path] = sanitizePrimitive(raw);
    }
    return output;
  }

  function prefixObject(value, prefix) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).map(([key, raw]) => [`${prefix}_${key}`, raw]));
  }

  function structuralFactKey({ category, signal, value, context }) {
    const resource = value.resource || value.url || value.metadata_resource || value.metadata_url || "";
    const selector = value.selector || value.metadata_selector || "";
    const path = value.path || value.metadata_path || context?.pageUrl || "";
    const provider = value.provider || value.metadata_provider || "";
    return [
      category,
      signal,
      `res:${canonicalKeyPart(resource)}`,
      `sel:${canonicalKeyPart(selector)}`,
      `path:${canonicalKeyPart(path)}`,
      `prov:${canonicalKeyPart(provider)}`
    ].join("|");
  }

  function canonicalKeyPart(value) {
    if (!value) return "";
    return String(value).toLowerCase().replace(/^https?:\/\//, "").replace(/[?#].*$/, "").replace(/\s+/g, " ").slice(0, 180);
  }

  function deserializeGraph(snapshot) {
    const nodes = new Map();
    const edges = new Map();
    for (const node of snapshot?.nodes || []) nodes.set(node.key, {
      key: node.key,
      category: node.category,
      signal: node.signal,
      totalCount: Number(node.totalCount) || 0,
      severityCounts: { info: 0, low: 0, medium: 0, high: 0, ...(node.severityCounts || {}) },
      buckets: node.buckets || {}
    });
    for (const edge of snapshot?.edges || []) edges.set(`${edge.from}|${edge.to}`, { from: edge.from, to: edge.to, totalCooccurrence: Number(edge.totalCooccurrence) || 0 });
    return { nodes, edges };
  }

  function summarizeGraph(graph) {
    const topNodes = [...graph.nodes].sort((left, right) => right.totalCount - left.totalCount).slice(0, 12).map(node => ({
      key: node.key,
      category: node.category,
      signal: node.signal,
      totalCount: node.totalCount,
      severityCounts: node.severityCounts
    }));
    return { nodeCount: graph.nodes.length, edgeCount: graph.edges.length, topNodes };
  }

  function getHistory(node, excludeBucket) {
    return Object.entries(node.buckets || {}).filter(([id]) => id !== excludeBucket).map(([, count]) => Number(count) || 0);
  }

  function getCooccurrenceDegree(key, graph) {
    let degree = 0;
    for (const edge of graph.edges.values()) if (edge.from === key || edge.to === key) degree += 1;
    return degree;
  }

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function stddev(values, avg) {
    if (!values.length) return 0;
    return Math.sqrt(values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / values.length);
  }

  function sanitizeObject(value) {
    if (Array.isArray(value)) return value.slice(0, 40).map(sanitizeObject);
    if (!value || typeof value !== "object") return sanitizePrimitive(value);
    return Object.fromEntries(Object.entries(value).slice(0, 80).map(([key, raw]) => {
      if (/token|secret|password|authorization|credential|cookie|session/i.test(key)) return [key, "[redacted]"];
      return [key, sanitizeObject(raw)];
    }));
  }

  function sanitizePrimitive(value) {
    if (typeof value === "string") return value.slice(0, 400);
    if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
    if (value === undefined) return null;
    return String(value).slice(0, 200);
  }

  function sanitizeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return `${url.origin}${url.pathname}`;
    } catch {
      return String(value).slice(0, 220);
    }
  }

  function safeHost(value) {
    try {
      return new URL(value).hostname;
    } catch {
      return "";
    }
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  globalThis.TicketSniperFactPipeline = {
    FactContextInjector,
    FactBatcher,
    FactNormalizer,
    FrequencyGraphUpdate,
    StructuralEventGenerator,
    FeatureExtractor,
    ScoringEngine,
    UpdateClassificationEngine,
    StructuralFactPipeline
  };
})();
