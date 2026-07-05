import { createHash } from "node:crypto";

export const WEB_BLOOMBERG_BUCKETS = Object.freeze([10, 50, 100, 1000]);

export const WEB_BLOOMBERG_SEGMENTS = Object.freeze([
  {
    id: "devops",
    envKey: "DEVOPS",
    name: "DevOps",
    priceLabel: "$99/mo",
    organs: ["behavior", "frequency"],
    description: "Behavior and frequency monitoring for release health, regressions, and live runtime operations."
  },
  {
    id: "security",
    envKey: "SECURITY",
    name: "Security",
    priceLabel: "$999/mo",
    organs: ["behavior", "risk"],
    description: "Behavior-risk intelligence for SOC, compliance, and hostile runtime signal review."
  },
  {
    id: "performance",
    envKey: "PERFORMANCE",
    name: "Performance",
    priceLabel: "$499/mo",
    organs: ["frequency", "dependency"],
    description: "Frequency and dependency analysis for performance storms, resource pressure, and regressions."
  },
  {
    id: "ai-governance",
    envKey: "AI_GOVERNANCE",
    name: "AI Governance",
    priceLabel: "$999/mo",
    organs: ["behavior", "frequency", "risk"],
    description: "AI-like inference, worker, WASM, GPU, and risk-frequency evidence for governance teams."
  },
  {
    id: "analytics",
    envKey: "ANALYTICS",
    name: "Analytics",
    priceLabel: "$199/mo",
    organs: ["behavior", "dependency"],
    description: "Buyer-readable behavior and dependency trends for product analytics and competitive monitoring."
  },
  {
    id: "oem-platform",
    envKey: "OEM_PLATFORM",
    name: "OEM / Platform",
    priceLabel: "$50k-$150k/yr",
    organs: ["behavior", "frequency", "risk", "dependency"],
    description: "All V1 organs packaged for platform embedding, data licensing, and enterprise integration."
  }
]);

const MAX_BATCH_SIZE = 120;
const MAX_WINDOWS = 5000;
const MAX_EVENTS = 1200;
const TIMESTAMP_SKEW_MS = 24 * 60 * 60 * 1000;
const METRIC_KEYS = Object.freeze([
  "behavior",
  "js",
  "ai",
  "worker",
  "wasm",
  "webgpu",
  "malicious",
  "protection",
  "network",
  "layout",
  "dom",
  "microtask",
  "longtask",
  "raf"
]);

export function createWebBloombergStore(options = {}) {
  const maxWindows = clampInteger(options.maxWindows, 10, 20000, MAX_WINDOWS);
  const maxEvents = clampInteger(options.maxEvents, 100, 5000, MAX_EVENTS);
  const windows = [];
  const intelligenceEvents = [];
  const rejectedSamples = [];
  const state = {
    accepted: 0,
    rejected: 0,
    lastIngestAt: "",
    activeSites: new Set()
  };

  function ingest(input, context = {}) {
    const batch = normalizeBehaviorBatch(input);
    const rejected = [];
    const accepted = [];
    for (const candidate of batch) {
      const validation = validateBehaviorWindow(candidate, context);
      if (!validation.ok) {
        rejected.push(validation);
        continue;
      }
      accepted.push(validation.window);
    }
    for (const window of accepted) {
      windows.push(window);
      state.accepted += 1;
      state.activeSites.add(window.site_id);
      state.lastIngestAt = new Date().toISOString();
    }
    for (const item of rejected) {
      state.rejected += 1;
      rejectedSamples.push({ at: new Date().toISOString(), reason: item.error, code: item.code });
    }
    trimArray(windows, maxWindows);
    trimArray(rejectedSamples, 100);
    const terminal = buildTerminalModel({ windows, intelligenceEvents });
    for (const event of terminal.events) intelligenceEvents.push(event);
    trimArray(intelligenceEvents, maxEvents);
    return {
      ok: rejected.length === 0,
      accepted: accepted.length,
      rejected: rejected.length,
      errors: rejected.slice(0, 12).map(item => ({ code: item.code, error: item.error })),
      status: status(),
      terminal
    };
  }

  function status() {
    return {
      ok: true,
      acceptedWindowCount: state.accepted,
      rejectedWindowCount: state.rejected,
      activeSites: [...state.activeSites].sort(),
      activeSiteCount: state.activeSites.size,
      lastIngestAt: state.lastIngestAt,
      windowRetention: maxWindows,
      intelligenceRetention: maxEvents,
      recentRejected: rejectedSamples.slice(-8)
    };
  }

  function terminal(query = {}) {
    return buildTerminalModel({ windows, intelligenceEvents, query });
  }

  function exportState() {
    return {
      ok: true,
      exportedAt: new Date().toISOString(),
      status: status(),
      windows: windows.slice(-maxWindows),
      intelligenceEvents: intelligenceEvents.slice(-maxEvents)
    };
  }

  function clear() {
    windows.length = 0;
    intelligenceEvents.length = 0;
    rejectedSamples.length = 0;
    state.accepted = 0;
    state.rejected = 0;
    state.lastIngestAt = "";
    state.activeSites.clear();
  }

  return { ingest, status, terminal, export: exportState, clear };
}

export function normalizeBehaviorBatch(input = {}) {
  if (Array.isArray(input)) return input.slice(0, MAX_BATCH_SIZE);
  if (Array.isArray(input.windows)) return input.windows.slice(0, MAX_BATCH_SIZE);
  if (input.window && typeof input.window === "object") return [input.window];
  return [];
}

export function validateBehaviorWindow(candidate = {}, context = {}) {
  if (!candidate || typeof candidate !== "object") return rejection("BEHAVIOR_WINDOW_OBJECT", "Window must be an object.");
  if (Array.isArray(candidate.events) || Array.isArray(candidate.rawEvents) || Array.isArray(candidate.trace)) {
    return rejection("RAW_EVENT_STREAM_REJECTED", "Raw event traces are not accepted; upload compact behavior windows only.");
  }
  const bucketMs = Number(candidate.bucket_ms);
  if (!WEB_BLOOMBERG_BUCKETS.includes(bucketMs)) return rejection("INVALID_BUCKET_MS", "bucket_ms must be one of 10, 50, 100, or 1000.");
  const startTs = Number(candidate.start_ts);
  const endTs = Number(candidate.end_ts);
  if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) {
    return rejection("INVALID_WINDOW_TIME", "Window start_ts/end_ts must be finite and ordered.");
  }
  const now = Date.now();
  if (Math.abs(startTs - now) > TIMESTAMP_SKEW_MS || Math.abs(endTs - now) > TIMESTAMP_SKEW_MS) {
    return rejection("TIMESTAMP_OUT_OF_BOUNDS", "Window timestamp is outside the accepted one-day ingest skew.");
  }
  const metrics = normalizeMetrics(candidate.metrics);
  if (!Object.keys(metrics).length) return rejection("MISSING_METRICS", "Window metrics are required.");
  const siteId = normalizeId(candidate.site_id || context.site_id || hostFromUrl(candidate.targetUrl || context.url || ""));
  const pageId = normalizePageId(candidate.page_id || context.page_id || pathFromUrl(candidate.targetUrl || context.url || ""));
  if (!siteId) return rejection("MISSING_SITE_ID", "site_id is required.");
  const window = {
    window_id: normalizeWindowId(candidate.window_id, { siteId, pageId, startTs, endTs, bucketMs, metrics }),
    site_id: siteId,
    page_id: pageId || "/",
    client_segment: normalizeSegment(candidate.client_segment || context.client_segment),
    start_ts: Math.floor(startTs),
    end_ts: Math.floor(endTs),
    bucket_ms: bucketMs,
    metrics,
    dependency_edges: normalizeDependencyEdges(candidate.dependency_edges),
    risk_hints: normalizeRiskHints(candidate.risk_hints),
    capture_mode: String(candidate.capture_mode || context.captureMode || "browser_local_window").slice(0, 80),
    schema_version: "web-bloomberg-v1"
  };
  return { ok: true, window };
}

export function buildTerminalModel({ windows = [], intelligenceEvents = [], query = {} } = {}) {
  const siteId = normalizeId(query.site_id || "");
  const pageId = normalizePageId(query.page_id || "");
  const horizonMs = clampInteger(query.window, 1000, 60 * 60 * 1000, 300000);
  const now = Date.now();
  const filtered = windows
    .filter(window => !siteId || window.site_id === siteId)
    .filter(window => !pageId || window.page_id === pageId)
    .filter(window => window.end_ts >= now - horizonMs)
    .slice(-1000);
  const oneSecond = aggregateByTumblingWindow(filtered, 1000);
  const fiveSecond = aggregateSliding(filtered, 5000);
  const baseline = buildBaseline(filtered);
  const storms = detectStorms(oneSecond, baseline);
  const deviations = detectDeviations(oneSecond, baseline);
  const risk = buildRiskDashboard(filtered, storms, deviations);
  const dependencies = buildDependencyModel(filtered);
  const frequency = buildFrequencyGraph(oneSecond, fiveSecond);
  const events = [
    ...storms.map(storm => ({ kind: "storm", severity: storm.severity, at: storm.end_ts, summary: storm.summary, site_id: storm.site_id, page_id: storm.page_id })),
    ...deviations.filter(item => item.score >= 0.55).map(item => ({ kind: "deviation", severity: item.score > 0.82 ? "high" : "medium", at: item.end_ts, summary: item.summary, site_id: item.site_id, page_id: item.page_id }))
  ];
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    query: { site_id: siteId, page_id: pageId, window: horizonMs },
    coverage: {
      localCapture: true,
      uploadPolicy: "compact_window_records_only",
      rawEventsUploaded: false,
      buckets: WEB_BLOOMBERG_BUCKETS
    },
    frequency,
    storms,
    deviations,
    risk,
    dependencies,
    windows: filtered.slice(-80),
    events,
    summary: {
      windowCount: filtered.length,
      oneSecondBuckets: oneSecond.length,
      fiveSecondWindowCount: fiveSecond.length,
      stormCount: storms.length,
      deviationCount: deviations.length,
      riskScore: risk.score,
      riskLabel: risk.label
    },
    segments: WEB_BLOOMBERG_SEGMENTS
  };
}

export function deriveBehaviorWindowsFromFacts(facts = [], context = {}) {
  const grouped = new Map();
  for (const fact of Array.isArray(facts) ? facts : []) {
    const timestamp = Number(fact.timestamp || fact.context?.timestamp || 0) || Date.now();
    const bucketStart = Math.floor(timestamp / 1000) * 1000;
    const siteId = normalizeId(context.site_id || hostFromUrl(fact.context?.pageUrl || context.url || ""));
    const pageId = normalizePageId(context.page_id || pathFromUrl(fact.context?.pageUrl || context.url || ""));
    const key = `${siteId}|${pageId}|${bucketStart}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        window_id: "",
        site_id: siteId,
        page_id: pageId || "/",
        client_segment: "runtime-diagnostics",
        start_ts: bucketStart,
        end_ts: bucketStart + 1000,
        bucket_ms: 1000,
        metrics: {},
        dependency_edges: [],
        risk_hints: []
      });
    }
    const window = grouped.get(key);
    const metric = metricFromRuntimeFact(fact);
    window.metrics[metric] = (window.metrics[metric] || 0) + 1;
    window.metrics.behavior = (window.metrics.behavior || 0) + 1;
    const edge = dependencyEdgeFromFact(fact);
    if (edge) window.dependency_edges.push(edge);
    const hint = riskHintFromFact(fact);
    if (hint) window.risk_hints.push(hint);
  }
  return [...grouped.values()].map(window => ({
    ...window,
    window_id: normalizeWindowId("", window),
    dependency_edges: window.dependency_edges.slice(0, 40),
    risk_hints: window.risk_hints.slice(0, 20)
  }));
}

function aggregateByTumblingWindow(windows, intervalMs) {
  const buckets = new Map();
  for (const window of windows) {
    const keyStart = Math.floor(window.start_ts / intervalMs) * intervalMs;
    const key = `${window.site_id}|${window.page_id}|${keyStart}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        site_id: window.site_id,
        page_id: window.page_id,
        start_ts: keyStart,
        end_ts: keyStart + intervalMs,
        metrics: {}
      });
    }
    mergeMetrics(buckets.get(key).metrics, window.metrics);
  }
  return [...buckets.values()].sort((a, b) => a.start_ts - b.start_ts);
}

function aggregateSliding(windows, intervalMs) {
  return windows.slice(-120).map(window => {
    const start = window.end_ts - intervalMs;
    const metrics = {};
    for (const candidate of windows) {
      if (candidate.end_ts < start || candidate.end_ts > window.end_ts) continue;
      mergeMetrics(metrics, candidate.metrics);
    }
    return { site_id: window.site_id, page_id: window.page_id, start_ts: start, end_ts: window.end_ts, metrics };
  });
}

function buildFrequencyGraph(oneSecond, fiveSecond) {
  const latest = oneSecond.at(-1) || { metrics: {} };
  const total = metricTotal(latest.metrics);
  return {
    latestTotal: total,
    latestMetrics: latest.metrics,
    oneSecond: oneSecond.slice(-60).map(point => ({ start_ts: point.start_ts, end_ts: point.end_ts, total: metricTotal(point.metrics), metrics: point.metrics })),
    fiveSecond: fiveSecond.slice(-60).map(point => ({ start_ts: point.start_ts, end_ts: point.end_ts, total: metricTotal(point.metrics), metrics: point.metrics }))
  };
}

function buildBaseline(windows) {
  const totals = windows.map(window => metricTotal(window.metrics));
  const average = totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : 0;
  const variance = totals.length ? totals.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / totals.length : 0;
  const stdev = Math.sqrt(variance);
  const max = totals.length ? Math.max(...totals) : 0;
  return { average, stdev, max, sampleCount: totals.length };
}

function detectStorms(oneSecond, baseline) {
  const threshold = Math.max(20, baseline.average + Math.max(8, baseline.stdev * 3));
  return oneSecond
    .filter(point => metricTotal(point.metrics) >= threshold)
    .slice(-40)
    .map(point => {
      const total = metricTotal(point.metrics);
      const dominant = dominantMetric(point.metrics);
      return {
        site_id: point.site_id,
        page_id: point.page_id,
        start_ts: point.start_ts,
        end_ts: point.end_ts,
        total,
        dominantMetric: dominant.key,
        severity: total > threshold * 1.8 ? "high" : "medium",
        summary: `${dominant.label} storm: ${total} behavior events in 1s.`
      };
    });
}

function detectDeviations(oneSecond, baseline) {
  return oneSecond.slice(-60).map(point => {
    const total = metricTotal(point.metrics);
    const divisor = Math.max(5, baseline.stdev * 4, baseline.average + 1);
    const score = clamp01(Math.abs(total - baseline.average) / divisor);
    return {
      site_id: point.site_id,
      page_id: point.page_id,
      start_ts: point.start_ts,
      end_ts: point.end_ts,
      total,
      baseline: round2(baseline.average),
      score: round3(score),
      summary: `Deviation ${Math.round(score * 100)}% from rolling baseline.`
    };
  });
}

function buildRiskDashboard(windows, storms, deviations) {
  const latest = windows.slice(-60);
  const metrics = {};
  for (const window of latest) mergeMetrics(metrics, window.metrics);
  const total = Math.max(1, metricTotal(metrics));
  const maliciousPressure = ((metrics.malicious || 0) + (metrics.protection || 0)) / total;
  const aiPressure = ((metrics.ai || 0) + (metrics.wasm || 0) + (metrics.webgpu || 0)) / total;
  const hintPressure = latest.reduce((sum, window) => sum + (window.risk_hints?.length || 0), 0) / Math.max(1, latest.length);
  const deviationPressure = deviations.slice(-12).reduce((max, item) => Math.max(max, item.score), 0);
  const stormPressure = Math.min(1, storms.length / 5);
  const score = clamp01(stormPressure * 0.28 + deviationPressure * 0.34 + maliciousPressure * 0.26 + aiPressure * 0.08 + Math.min(1, hintPressure / 4) * 0.04);
  return {
    score: round3(score),
    label: score >= 0.75 ? "High" : score >= 0.45 ? "Elevated" : score >= 0.2 ? "Watch" : "Calm",
    drivers: [
      { id: "storms", label: "Storm pressure", value: round3(stormPressure) },
      { id: "deviation", label: "Deviation pressure", value: round3(deviationPressure) },
      { id: "malicious", label: "Malicious/protection pressure", value: round3(maliciousPressure) },
      { id: "ai", label: "AI-like runtime pressure", value: round3(aiPressure) }
    ],
    latestMetrics: metrics
  };
}

function buildDependencyModel(windows) {
  const map = new Map();
  for (const edge of windows.flatMap(window => window.dependency_edges || [])) {
    const key = `${edge.from}->${edge.to}:${edge.type}`;
    const current = map.get(key) || { ...edge, count: 0, weight: 0 };
    current.count += 1;
    current.weight += Number(edge.weight) || 1;
    map.set(key, current);
  }
  const edges = [...map.values()].sort((a, b) => b.weight - a.weight).slice(0, 80);
  return {
    edgeCount: edges.length,
    edges,
    chains: edges.slice(0, 12).map(edge => `${edge.from} -> ${edge.to} (${edge.type}, ${round2(edge.weight)})`)
  };
}

function normalizeMetrics(metrics = {}) {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return {};
  const normalized = {};
  for (const [key, value] of Object.entries(metrics)) {
    const safeKey = normalizeMetricKey(key);
    const number = Number(value);
    if (!safeKey || !Number.isFinite(number) || number < 0) continue;
    normalized[safeKey] = Math.min(1_000_000, Math.round(number * 1000) / 1000);
  }
  return normalized;
}

function normalizeMetricKey(key) {
  const value = String(key || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 40);
  if (!value) return "";
  const alias = {
    javascript: "js",
    worker_messages: "worker",
    workers: "worker",
    gpu: "webgpu",
    protection_signals: "protection",
    dom_mutation: "dom",
    request: "network",
    requests: "network",
    animation_frame: "raf"
  };
  return alias[value] || value;
}

function normalizeDependencyEdges(edges) {
  if (!Array.isArray(edges)) return [];
  return edges.slice(0, 120).map(edge => ({
    from: normalizeId(edge?.from || "browser"),
    to: normalizeId(edge?.to || "runtime"),
    type: normalizeId(edge?.type || "behavior"),
    weight: Math.min(10000, Math.max(0, Number(edge?.weight) || 1))
  })).filter(edge => edge.from && edge.to);
}

function normalizeRiskHints(hints) {
  if (!Array.isArray(hints)) return [];
  return hints.slice(0, 80).map(hint => ({
    type: normalizeId(hint?.type || hint || "risk"),
    severity: normalizeSeverity(hint?.severity || "medium"),
    summary: String(hint?.summary || hint?.message || hint || "").slice(0, 220)
  })).filter(hint => hint.type);
}

function metricFromRuntimeFact(fact = {}) {
  const text = `${fact.source || ""}/${fact.type || ""}`.toLowerCase();
  if (/ai|inference|model|embedding/.test(text)) return "ai";
  if (/wasm|webassembly/.test(text)) return "wasm";
  if (/webgpu|gpu/.test(text)) return "webgpu";
  if (/worker|service-worker|messagechannel|post-message/.test(text)) return "worker";
  if (/promise|microtask/.test(text)) return "microtask";
  if (/longtask/.test(text)) return "longtask";
  if (/raf|frame|animation/.test(text)) return "raf";
  if (/script|javascript|runtime|timer|error|console/.test(text)) return "js";
  if (/malicious|fingerprint|captcha|challenge|crawler|webdriver|headless/.test(text)) return "malicious";
  if (/protect|auth|login|paywall/.test(text)) return "protection";
  if (/network|fetch|xhr|resource|websocket/.test(text)) return "network";
  if (/layout|style|css|paint|shift/.test(text)) return "layout";
  if (/dom|mutation|shadow|vdom/.test(text)) return "dom";
  return "behavior";
}

function dependencyEdgeFromFact(fact = {}) {
  const metric = metricFromRuntimeFact(fact);
  if (metric === "behavior") return null;
  return { from: "browser", to: metric, type: "runtime-frequency", weight: 1 };
}

function riskHintFromFact(fact = {}) {
  const metric = metricFromRuntimeFact(fact);
  const severity = normalizeSeverity(fact.value?.severity || fact.severity || "low");
  if (severity === "high" || metric === "malicious" || metric === "protection") {
    return { type: metric, severity, summary: `${fact.source || "runtime"}/${fact.type || "fact"}` };
  }
  return null;
}

function mergeMetrics(target, source) {
  for (const key of Object.keys(source || {})) target[key] = (target[key] || 0) + (Number(source[key]) || 0);
  return target;
}

function metricTotal(metrics = {}) {
  return Object.entries(metrics)
    .filter(([key]) => key !== "behavior" || Object.keys(metrics).length === 1)
    .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
}

function dominantMetric(metrics = {}) {
  let key = "behavior";
  let value = -1;
  for (const [candidate, amount] of Object.entries(metrics)) {
    if (candidate === "behavior" && Object.keys(metrics).length > 1) continue;
    if (Number(amount) > value) {
      key = candidate;
      value = Number(amount);
    }
  }
  return { key, label: key.replace(/_/g, " ").toUpperCase() };
}

function normalizeWindowId(value, fallback = {}) {
  const text = String(value || "").trim();
  if (/^[a-z0-9:_-]{8,96}$/i.test(text)) return text.slice(0, 96);
  return createHash("sha256").update(stableJson(fallback)).digest("hex").slice(0, 24);
}

function normalizeId(value) {
  return String(value || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[^a-z0-9._/-]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function normalizePageId(value) {
  const text = String(value || "/").trim();
  try {
    const url = new URL(text);
    return normalizePath(url.pathname);
  } catch {
    return normalizePath(text);
  }
}

function normalizePath(value) {
  const text = String(value || "/").replace(/[#?].*$/, "");
  return (`/${text.replace(/^\/+/, "")}`).replace(/\/{2,}/g, "/").slice(0, 180);
}

function normalizeSegment(value) {
  return normalizeId(value || "default") || "default";
}

function normalizeSeverity(value) {
  return ["low", "medium", "high", "critical"].includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "low";
}

function hostFromUrl(value) {
  try { return new URL(value).hostname; } catch { return ""; }
}

function pathFromUrl(value) {
  try { return new URL(value).pathname || "/"; } catch { return "/"; }
}

function rejection(code, error) {
  return { ok: false, code, error };
}

function trimArray(values, max) {
  if (values.length > max) values.splice(0, values.length - max);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function clampInteger(value, min, max, fallback) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function round3(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}
