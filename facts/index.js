export const FACTS_LAYER_VERSION = "stl-web-facts-v1";

export const FACT_DOMAINS = Object.freeze([
  "dom",
  "layout",
  "cssom",
  "shadow",
  "vdom",
  "a11y",
  "runtime",
  "network",
  "anti_crawler",
  "storage",
  "bloomberg_buckets"
]);

const SOURCE_ALIASES = Object.freeze({
  accessibility: "a11y",
  browser: "dom",
  performance: "runtime",
  multicontext: "runtime",
  crawler: "anti_crawler",
  web_bloomberg: "bloomberg_buckets"
});

const DERIVED_FACT_KEYS = Object.freeze([
  "metrics",
  "dependency_edges",
  "risk_hints",
  "severityScore",
  "classification",
  "normalizedWindow",
  "msu",
  "action",
  "automation"
]);

export function buildFactsLayerModel(facts = []) {
  const channels = {};
  const domains = Object.fromEntries(FACT_DOMAINS.map(domain => [domain, {
    id: domain,
    total: 0,
    channels: {},
    latestAt: 0
  }]));
  const history = [];

  for (const entry of Array.isArray(facts) ? facts : []) {
    const fact = entry.fact || entry;
    if (!fact || typeof fact !== "object") continue;
    const raw = sanitizeRawFact(fact);
    const domain = factDomain(raw);
    const channel = raw.channel || `${raw.source}/${raw.type}`;
    const record = {
      channel,
      domain,
      timestamp: raw.timestamp,
      fact: raw
    };
    history.push(record);
    channels[channel] = channels[channel] || [];
    channels[channel].push(raw);
    if (!domains[domain]) {
      domains[domain] = { id: domain, total: 0, channels: {}, latestAt: 0 };
    }
    domains[domain].total += 1;
    domains[domain].channels[channel] = (domains[domain].channels[channel] || 0) + 1;
    domains[domain].latestAt = Math.max(domains[domain].latestAt, raw.timestamp || 0);
  }

  history.sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
  return {
    version: FACTS_LAYER_VERSION,
    totalFacts: history.length,
    channelCount: Object.keys(channels).length,
    channels,
    history,
    domains: Object.values(domains),
    status: {
      state: history.length ? "facts_active" : "facts_waiting",
      latestAt: history[0]?.timestamp || 0
    }
  };
}

export function sanitizeRawFact(fact = {}) {
  const value = stripDerivedFields(fact.value || {});
  const metadata = stripDerivedFields(fact.metadata || {});
  return {
    timestamp: Number(fact.timestamp) || Date.now(),
    source: normalizeSource(fact.source || "runtime"),
    type: normalizeType(fact.type || "fact"),
    channel: String(fact.channel || `${fact.source || "runtime"}/${fact.type || "fact"}`).slice(0, 160),
    value,
    metadata,
    context: stripDerivedFields(fact.context || {}),
    runtimeLayer: stripDerivedFields(fact.runtimeLayer || {})
  };
}

export function factDomain(fact = {}) {
  const source = normalizeSource(fact.source || "");
  if (SOURCE_ALIASES[source]) return SOURCE_ALIASES[source];
  return FACT_DOMAINS.includes(source) ? source : "runtime";
}

export function assertFactsLayerPurity(fact = {}) {
  const text = JSON.stringify(fact);
  return !DERIVED_FACT_KEYS.some(key => text.includes(`"${key}"`));
}

function stripDerivedFields(value) {
  if (Array.isArray(value)) return value.slice(0, 80).map(stripDerivedFields);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !DERIVED_FACT_KEYS.includes(key))
    .map(([key, raw]) => [key, stripDerivedFields(raw)]));
}

function normalizeSource(value) {
  return String(value || "runtime").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 60) || "runtime";
}

function normalizeType(value) {
  return String(value || "fact").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 80) || "fact";
}
