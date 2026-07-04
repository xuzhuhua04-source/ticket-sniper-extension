(() => {
  const ORGAN_ORDER = Object.freeze(["Energy", "Flow", "Supply", "Value", "Behavior", "Lifecycle", "Topology", "Dependency", "Rhythm"]);
  const COMMERCIAL_PACKAGES = Object.freeze({
    structureMonitor: {
      code: "A",
      name: "Structure Monitor",
      industry: "Security / Government / Finance / Enterprise SOC",
      pricing: "Enterprise",
      coreValue: "Real-time structural visibility and behavioral frequency fingerprinting",
      capabilities: [
        "Structural topology", "Behavior flow", "Dependency chains", "Shadow DOM topology", "VDOM topology",
        "Accessibility topology", "Layout topology", "iframe / Worker / Service Worker topology",
        "Malicious frequency fingerprints"
      ]
    },
    performanceSpectrum: {
      code: "B",
      name: "Performance Spectrum",
      industry: "E-commerce / SaaS / Gaming / Large Websites",
      pricing: "Upper-mid",
      coreValue: "Real-time performance frequency graph",
      capabilities: [
        "Frame frequency", "Layout frequency", "Paint frequency", "Longtask frequency", "JS execution frequency",
        "Network frequency", "Style storms", "Layout storms", "Performance rhythm graph", "Performance risk waves"
      ]
    },
    updateRadar: {
      code: "C",
      name: "Update Radar",
      industry: "Investment / Competitive Intelligence / SEO / Market Analysis",
      pricing: "Mid-tier",
      coreValue: "Real-time update frequency tracking",
      capabilities: [
        "DOM update frequency", "VDOM update frequency", "CSSOM update frequency", "Resource update frequency",
        "Update cadence", "Update intensity", "Update type classification", "Update waveforms", "Structural change detection"
      ]
    },
    riskScoreEngine: {
      code: "D",
      name: "Risk Score Engine",
      industry: "Banking / Finance / Government / Enterprise Security",
      pricing: "Enterprise",
      coreValue: "Real-time risk scoring based on frequency deviation",
      capabilities: [
        "Behavioral frequency anomalies", "Resource frequency anomalies", "JS execution anomalies", "Network anomalies",
        "GPU jitter anomalies", "Risk waveforms", "Risk scoring", "Risk trend graph"
      ]
    },
    aiActivityDetector: {
      code: "E",
      name: "AI Activity Detector",
      industry: "Legal / Media / Security / Enterprise Compliance",
      pricing: "Enterprise",
      coreValue: "Detect AI inference patterns inside the browser",
      capabilities: [
        "WASM high-frequency detection", "Worker high-frequency detection", "Microtask storms", "GPU frame jitter",
        "Longtask plateaus", "Local inference detection", "Local embedding detection", "Local encryption detection",
        "Local compression detection", "Local model loading detection"
      ]
    }
  });
  const DEFAULT_WINDOW_MS = 100;
  const DEFAULT_MAX_WINDOWS = 900;
  const DEFAULT_MAX_NODES = 700;
  const DEFAULT_MAX_EDGES = 1400;

  class OrganFrequencySpectrumEngine {
    constructor(snapshot = {}, options = {}) {
      this.windowMs = clampWindowMs(options.windowMs || snapshot.windowMs || DEFAULT_WINDOW_MS);
      this.maxWindows = clampNumber(options.maxWindows || snapshot.maxWindows || DEFAULT_MAX_WINDOWS, 60, 3600);
      this.maxNodes = clampNumber(options.maxNodes || snapshot.maxNodes || DEFAULT_MAX_NODES, 80, 3000);
      this.maxEdges = clampNumber(options.maxEdges || snapshot.maxEdges || DEFAULT_MAX_EDGES, 120, 6000);
      this.nodes = deserializeMap(snapshot.nodes, node => ({
        id: String(node.id || ""),
        organ: normalizeOrgan(node.organ),
        source: String(node.source || ""),
        type: String(node.type || ""),
        nodeId: String(node.nodeId || ""),
        total: Number(node.total) || 0,
        energy: Number(node.energy) || 0,
        firstSeen: Number(node.firstSeen) || Date.now(),
        lastSeen: Number(node.lastSeen) || Date.now(),
        windows: cleanWindows(node.windows)
      }));
      this.edges = deserializeMap(snapshot.edges, edge => ({
        id: String(edge.id || ""),
        organ: normalizeOrgan(edge.organ),
        from: String(edge.from || ""),
        to: String(edge.to || ""),
        type: "frequency",
        frequency: Number(edge.frequency) || 0,
        delta: Number(edge.delta) || 0,
        energy: Number(edge.energy) || 0,
        lastWindow: String(edge.lastWindow || "")
      }));
      this.lastWindowByOrgan = new Map(Object.entries(snapshot.lastWindowByOrgan || {}));
    }

    ingest(rawFact, envelope = {}) {
      const fact = normalizeFact(rawFact, envelope);
      if (!fact.type) return null;
      const windowId = this.windowFor(fact.timestamp);
      const node = this.upsertNode(fact, windowId);
      const edge = this.updateFrequencyEdge(node, fact, windowId);
      this.prune(fact.timestamp);
      return { fact, node, edge, snapshot: this.snapshot() };
    }

    ingestMany(facts = [], envelope = {}) {
      const results = [];
      for (const item of facts) {
        const fact = item?.fact || item;
        const result = this.ingest(fact, envelope);
        if (result) results.push(result);
      }
      return { results, snapshot: this.snapshot() };
    }

    snapshot() {
      const nodes = [...this.nodes.values()];
      const edges = [...this.edges.values()];
      const spectra = buildSpectra(nodes, edges, this.windowMs);
      const closure = buildSpectrumClosure(nodes, edges);
      return {
        version: "organ9-frequency-spectrum-v2",
        windowMs: this.windowMs,
        maxWindows: this.maxWindows,
        maxNodes: this.maxNodes,
        maxEdges: this.maxEdges,
        generatedAt: Date.now(),
        nodes,
        edges,
        lastWindowByOrgan: Object.fromEntries(this.lastWindowByOrgan),
        spectra,
        closure,
        products: buildProductMetrics(nodes, edges, spectra, closure),
        commercialPackages: buildCommercialPackageSuite(nodes, edges, spectra, closure)
      };
    }

    windowFor(timestamp) {
      return String(Math.floor((Number(timestamp) || Date.now()) / this.windowMs));
    }

    upsertNode(fact, windowId) {
      const id = stableId([fact.organ, fact.source, fact.type, fact.nodeId, fact.resource, fact.selector].join("|"));
      const now = fact.timestamp;
      let node = this.nodes.get(id);
      if (!node) {
        node = {
          id,
          organ: fact.organ,
          source: fact.source,
          type: fact.type,
          nodeId: fact.nodeId,
          total: 0,
          energy: 0,
          firstSeen: now,
          lastSeen: now,
          windows: {}
        };
        this.nodes.set(id, node);
      }
      const bucket = node.windows[windowId] || { count: 0, energy: 0, severity: { info: 0, low: 0, medium: 0, high: 0 } };
      bucket.count += 1;
      bucket.energy += fact.energy;
      bucket.severity[fact.severity] = (bucket.severity[fact.severity] || 0) + 1;
      node.windows[windowId] = bucket;
      node.total += 1;
      node.energy += fact.energy;
      node.lastSeen = now;
      return node;
    }

    updateFrequencyEdge(node, fact, windowId) {
      const previousWindow = this.lastWindowByOrgan.get(fact.organ) || "";
      this.lastWindowByOrgan.set(fact.organ, windowId);
      const edgeId = stableId([fact.organ, node.id, windowId].join("|"));
      const previousFrequency = previousWindow && node.windows[previousWindow] ? Number(node.windows[previousWindow].count) || 0 : 0;
      const currentFrequency = Number(node.windows[windowId]?.count) || 0;
      const edge = {
        id: edgeId,
        organ: fact.organ,
        from: node.id,
        to: `${fact.organ}:${windowId}`,
        type: "frequency",
        frequency: currentFrequency,
        delta: currentFrequency - previousFrequency,
        energy: Number(node.windows[windowId]?.energy) || 0,
        lastWindow: windowId
      };
      this.edges.set(edgeId, edge);
      return edge;
    }

    prune(now = Date.now()) {
      const minWindow = Math.floor(now / this.windowMs) - this.maxWindows;
      for (const node of this.nodes.values()) {
        for (const windowId of Object.keys(node.windows)) {
          if (Number(windowId) < minWindow) delete node.windows[windowId];
        }
      }
      const nodeValues = [...this.nodes.values()].sort((left, right) => right.lastSeen - left.lastSeen);
      for (const node of nodeValues.slice(this.maxNodes)) this.nodes.delete(node.id);
      const validNodeIds = new Set(this.nodes.keys());
      const edgeValues = [...this.edges.values()]
        .filter(edge => validNodeIds.has(edge.from))
        .sort((left, right) => Number(right.lastWindow) - Number(left.lastWindow));
      this.edges = new Map(edgeValues.slice(0, this.maxEdges).map(edge => [edge.id, edge]));
    }
  }

  function normalizeFact(rawFact = {}, envelope = {}) {
    const source = String(rawFact.source || envelope.source || "").toLowerCase();
    const type = String(rawFact.type || "").toLowerCase();
    const value = rawFact.value || {};
    const metadata = rawFact.metadata || {};
    const organ = normalizeOrgan(rawFact.organ || inferOrgan(source, type));
    return {
      organ,
      source,
      type: type || "fact",
      nodeId: String(rawFact.nodeId || value.nodeId || metadata.nodeId || value.selector || metadata.selector || rawFact.id || ""),
      resource: String(value.resource || value.url || metadata.resource || metadata.url || ""),
      selector: String(value.selector || metadata.selector || ""),
      severity: normalizeSeverity(value.severity || rawFact.severity || metadata.severity),
      energy: computeEnergy(value, metadata),
      timestamp: Number(rawFact.timestamp) || Date.now()
    };
  }

  function inferOrgan(source, type) {
    if (source === "dom") return /mutation|attribute|text|child/.test(type) ? "Topology" : "Behavior";
    if (source === "layout") return /shift/.test(type) ? "Value" : /dependency|edge/.test(type) ? "Topology" : /paint|composite|frame/.test(type) ? "Energy" : "Rhythm";
    if (source === "vdom") return /break/.test(type) ? "Value" : /topology|diff/.test(type) ? "Topology" : "Rhythm";
    if (source === "cssom") return /conflict|cascade|specificity|selector/.test(type) ? "Value" : "Rhythm";
    if (source === "a11y") return /break|missing|conflict/.test(type) ? "Value" : /topology|edge/.test(type) ? "Topology" : "Behavior";
    if (source === "shadow") return /root|mapping|slot/.test(type) ? "Topology" : "Behavior";
    if (source === "multicontext") return /iframe|worker|service|channel|message/.test(type) ? "Dependency" : "Flow";
    if (source === "network" || /fetch|xhr|ws|websocket|request|response/.test(type)) return /resource|asset|cdn|supply|load/.test(type) ? "Supply" : "Flow";
    if (source === "runtime") return /error|rejection|lifecycle|navigation/.test(type) ? "Lifecycle" : /long.?task|cpu|memory|gc|script|wasm|gpu|render_block/.test(type) ? "Energy" : /microtask|event_loop|block|idle|render/.test(type) ? "Rhythm" : "Dependency";
    if (source === "performance") return /long.?task|frame_drop|cpu|memory|paint|render|resource/.test(type) ? "Energy" : "Rhythm";
    if (/resource|cdn|asset|supply|fetch_retry/.test(type)) return "Supply";
    if (source === "storage") return "Lifecycle";
    if (source === "anti_crawler") return "Value";
    return "Behavior";
  }

  function buildSpectra(nodes, edges, windowMs) {
    return Object.fromEntries(ORGAN_ORDER.map(organ => {
      const organNodes = nodes.filter(node => node.organ === organ);
      const organEdges = edges.filter(edge => edge.organ === organ);
      const windows = {};
      for (const node of organNodes) {
        for (const [windowId, bucket] of Object.entries(node.windows || {})) {
          const target = windows[windowId] || { count: 0, energy: 0 };
          target.count += Number(bucket.count) || 0;
          target.energy += Number(bucket.energy) || 0;
          windows[windowId] = target;
        }
      }
      const ordered = Object.entries(windows).sort(([left], [right]) => Number(left) - Number(right));
      const latest = ordered.at(-1)?.[1] || { count: 0, energy: 0 };
      const previous = ordered.at(-2)?.[1] || { count: 0, energy: 0 };
      return [organ, {
        organ,
        windowMs,
        nodeCount: organNodes.length,
        edgeCount: organEdges.length,
        frequency: latest.count,
        delta: latest.count - previous.count,
        energy: round(latest.energy),
        total: organNodes.reduce((sum, node) => sum + node.total, 0),
        volatility: round(computeVolatility(ordered.map(([, bucket]) => bucket.count))),
        windows: ordered.slice(-36).map(([id, bucket]) => ({ id, count: bucket.count, energy: round(bucket.energy) }))
      }];
    }));
  }

  function buildSpectrumClosure(nodes, edges) {
    const organTotals = Object.fromEntries(ORGAN_ORDER.map(organ => [organ, nodes.filter(node => node.organ === organ).reduce((sum, node) => sum + node.total, 0)]));
    const total = Object.values(organTotals).reduce((sum, value) => sum + value, 0);
    const activeOrgans = Object.values(organTotals).filter(Boolean).length;
    const edgeEnergy = edges.reduce((sum, edge) => sum + Math.abs(edge.delta) + edge.energy, 0);
    return {
      totalFacts: total,
      activeOrgans,
      edgeCount: edges.length,
      coherence: round(activeOrgans / ORGAN_ORDER.length),
      energy: round(edgeEnergy),
      signature: stableId(JSON.stringify({ organTotals, edgeCount: edges.length, edgeEnergy: Math.round(edgeEnergy * 1000) }))
    };
  }

  function buildProductMetrics(nodes, edges, spectra = buildSpectra(nodes, edges, DEFAULT_WINDOW_MS), closure = buildSpectrumClosure(nodes, edges)) {
    const commercialPackages = buildCommercialPackageSuite(nodes, edges, spectra, closure);
    const riskSignals = (spectra.Value?.frequency || 0) + (spectra.Flow?.delta > 0 ? spectra.Flow.delta : 0) + (spectra.Lifecycle?.frequency || 0) + (spectra.Energy?.delta > 0 ? spectra.Energy.delta : 0);
    const aiSignals = nodes.filter(node => /bot|ai|automation|webdriver|headless|challenge|fingerprint|captcha/i.test(`${node.source} ${node.type} ${node.nodeId}`)).length;
    return {
      websiteBehaviorMonitoring: { useful: true, activeOrgans: closure.activeOrgans, structuralFacts: closure.totalFacts },
      performanceFrequencySpectrum: { useful: true, rhythmFrequency: spectra.Rhythm?.frequency || 0, rhythmEnergy: spectra.Rhythm?.energy || 0, energyFrequency: spectra.Energy?.frequency || 0, supplyFrequency: spectra.Supply?.frequency || 0 },
      updateFrequencyTracking: { useful: true, topologyDelta: spectra.Topology?.delta || 0, lifecycleDelta: spectra.Lifecycle?.delta || 0 },
      websiteRiskScore: { useful: true, score: round(Math.min(1, riskSignals / 80)) },
      aiActivityDetection: { useful: true, score: round(Math.min(1, aiSignals / 8)), evidenceCount: aiSignals },
      commercialPackages
    };
  }

  function buildCommercialPackageSuite(nodes = [], edges = [], spectra = buildSpectra(nodes, edges, DEFAULT_WINDOW_MS), closure = buildSpectrumClosure(nodes, edges)) {
    const nodeText = nodes.map(node => `${node.organ} ${node.source} ${node.type} ${node.nodeId} ${node.resource} ${node.selector}`.toLowerCase());
    const edgeEnergy = edges.reduce((sum, edge) => sum + Math.abs(Number(edge.delta) || 0) + (Number(edge.energy) || 0), 0);
    const evidenceFor = patterns => nodeText
      .map((text, index) => patterns.some(pattern => pattern.test(text)) ? describeNodeEvidence(nodes[index]) : "")
      .filter(Boolean)
      .slice(0, 8);
    const organScore = organ => {
      const spectrum = spectra?.[organ] || {};
      const frequency = Number(spectrum.frequency) || 0;
      const delta = Math.max(0, Number(spectrum.delta) || 0);
      const energy = Number(spectrum.energy) || 0;
      const total = Number(spectrum.total) || 0;
      return Math.min(1, (frequency / 25) + (delta / 20) + (energy / 120) + (total / 220));
    };
    const capabilityScore = evidence => Math.min(1, evidence.length / 6);
    const structureEvidence = evidenceFor([/dom|shadow|vdom|a11y|layout|iframe|worker|service|dependency|topology|mutation|behavior/]);
    const performanceEvidence = evidenceFor([/energy|frame|layout|paint|long.?task|js|script|style|network|resource|rhythm|storm|reflow|cpu|memory|gc/]);
    const updateEvidence = evidenceFor([/dom|vdom|cssom|resource|update|mutation|commit|stylesheet|lifecycle|navigation|change/]);
    const riskEvidence = evidenceFor([/error|block|failed|rejection|403|429|503|jitter|gpu|anomal|risk|captcha|challenge|fingerprint|headless|webdriver/]);
    const aiEvidence = evidenceFor([/ai|wasm|worker|microtask|gpu|webgpu|webgl|inference|embedding|model|encrypt|compress|llm|token|tensor|onnx/]);
    const highEnergyScore = Math.min(1, edgeEnergy / 200);
    const packages = finalizePackages([
      packageResult("structureMonitor", Math.max(organScore("Topology"), organScore("Dependency"), organScore("Behavior"), capabilityScore(structureEvidence)), structureEvidence, [
        topologyLine(spectra, "Topology"), topologyLine(spectra, "Dependency"), topologyLine(spectra, "Behavior")
      ]),
      packageResult("performanceSpectrum", Math.max(organScore("Energy"), organScore("Rhythm"), organScore("Supply"), highEnergyScore, capabilityScore(performanceEvidence)), performanceEvidence, [
        topologyLine(spectra, "Energy"), topologyLine(spectra, "Rhythm"), topologyLine(spectra, "Supply"), `Edge energy ${round(edgeEnergy)}`
      ]),
      packageResult("updateRadar", Math.max(organScore("Topology"), organScore("Lifecycle"), capabilityScore(updateEvidence)), updateEvidence, [
        topologyLine(spectra, "Topology"), topologyLine(spectra, "Lifecycle")
      ]),
      packageResult("riskScoreEngine", Math.max(organScore("Value"), organScore("Flow"), organScore("Lifecycle"), organScore("Energy"), capabilityScore(riskEvidence)), riskEvidence, [
        topologyLine(spectra, "Value"), topologyLine(spectra, "Flow"), topologyLine(spectra, "Lifecycle"), topologyLine(spectra, "Energy")
      ]),
      packageResult("aiActivityDetector", Math.max(capabilityScore(aiEvidence), organScore("Rhythm") * 0.25), aiEvidence, [
        "Evidence is pattern-based; it flags browser-side activity shapes, not private model contents."
      ])
    ]);
    return {
      version: "organ9-commercial-package-suite-v1",
      generatedAt: Date.now(),
      summary: {
        packageCount: Object.keys(COMMERCIAL_PACKAGES).length,
        activePackages: packages.filter(item => item.status !== "quiet").length,
        totalFacts: closure.totalFacts || 0,
        activeOrgans: closure.activeOrgans || 0,
        suiteSignature: stableId(JSON.stringify({
          closure: closure.signature,
          totals: ORGAN_ORDER.map(organ => [organ, spectra?.[organ]?.total || 0]),
          edgeEnergy: Math.round(edgeEnergy * 1000)
        }))
      },
      packages
    };
  }

  function finalizePackages(packages) {
    return packages.map(item => ({
      ...item,
      status: item.score >= 0.66 ? "active" : item.score >= 0.25 ? "watch" : "quiet"
    }));
  }

  function packageResult(key, rawScore, evidence, metrics) {
    const definition = COMMERCIAL_PACKAGES[key];
    const score = round(Math.max(0, Math.min(1, rawScore || 0)));
    return {
      id: key,
      code: definition.code,
      name: definition.name,
      industry: definition.industry,
      pricing: definition.pricing,
      coreValue: definition.coreValue,
      capabilities: definition.capabilities,
      score,
      evidenceCount: evidence.length,
      evidence,
      metrics: metrics.filter(Boolean).slice(0, 5),
      explanation: explainPackage(definition.name, score, evidence.length)
    };
  }

  function explainPackage(name, score, evidenceCount) {
    if (score >= 0.66) return `${name} is strongly represented in the current runtime sample with ${evidenceCount} direct evidence signals.`;
    if (score >= 0.25) return `${name} has partial runtime evidence and should be watched as more samples arrive.`;
    return `${name} is available, but this target has not produced enough matching evidence yet.`;
  }

  function topologyLine(spectra, organ) {
    const value = spectra?.[organ] || {};
    return `${organ}: frequency ${Number(value.frequency) || 0}, delta ${Number(value.delta) || 0}, energy ${round(value.energy || 0)}`;
  }

  function describeNodeEvidence(node = {}) {
    return `${node.organ || "Behavior"}:${node.source || "runtime"}/${node.type || "fact"}`.slice(0, 96);
  }

  function computeEnergy(value = {}, metadata = {}) {
    const candidates = [
      value.duration, value.durationMs, value.transferSize, value.encodedBodySize, value.decodedBodySize,
      value.count, value.added, value.removed, value.changed, metadata.duration, metadata.count
    ].map(Number).filter(Number.isFinite);
    if (!candidates.length) return 1;
    return Math.max(0.1, Math.min(1000, candidates.reduce((sum, value) => sum + Math.abs(value), 0) / 100));
  }

  function cleanWindows(windows = {}) {
    const output = {};
    for (const [id, bucket] of Object.entries(windows).slice(-DEFAULT_MAX_WINDOWS)) {
      output[id] = {
        count: Number(bucket.count) || 0,
        energy: Number(bucket.energy) || 0,
        severity: { info: 0, low: 0, medium: 0, high: 0, ...(bucket.severity || {}) }
      };
    }
    return output;
  }

  function deserializeMap(items, mapItem) {
    const map = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      const mapped = mapItem(item || {});
      if (mapped.id) map.set(mapped.id, mapped);
    }
    return map;
  }

  function normalizeOrgan(value) {
    const found = ORGAN_ORDER.find(organ => organ.toLowerCase() === String(value || "").toLowerCase());
    return found || "Behavior";
  }

  function normalizeSeverity(value) {
    const severity = String(value || "low").toLowerCase();
    return ["info", "low", "medium", "high"].includes(severity) ? severity : "low";
  }

  function computeVolatility(values) {
    if (values.length < 2) return 0;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / values.length;
    return Math.sqrt(variance) / Math.max(1, avg);
  }

  function stableId(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function clampWindowMs(value) {
    return clampNumber(value, 50, 60_000);
  }

  function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, Math.round(number)));
  }

  function round(value) {
    return Math.round((Number(value) || 0) * 1000) / 1000;
  }

  const api = { ORGAN_ORDER, COMMERCIAL_PACKAGES, OrganFrequencySpectrumEngine, buildSpectra, buildSpectrumClosure, buildProductMetrics, buildCommercialPackageSuite };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof globalThis !== "undefined") globalThis.TicketSniperOrganFrequency = api;
})();
