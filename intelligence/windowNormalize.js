import { windowSeverity } from "./windowSeverity.js";

export function normalizeIntelligenceWindow(window = {}) {
  return {
    ...window,
    metrics: normalizeMetrics(window.metrics || {}),
    dependency_edges: compactEdges(window.dependency_edges || []),
    risk_hints: compactHints(window.risk_hints || []),
    severity: windowSeverity(window)
  };
}

export function compactEdges(edges = []) {
  return edges.slice(0, 120).map(edge => ({
    from: normalizeId(edge.from || "browser"),
    to: normalizeId(edge.to || "runtime"),
    type: normalizeId(edge.type || "behavior"),
    weight: Math.min(10000, Math.max(0, Number(edge.weight) || 1))
  })).filter(edge => edge.from && edge.to);
}

export function compactHints(hints = []) {
  return hints.slice(0, 80).map(hint => ({
    type: normalizeId(hint.type || hint || "risk"),
    severity: normalizeSeverity(hint.severity || "medium"),
    summary: String(hint.summary || hint.message || hint || "").slice(0, 220)
  })).filter(hint => hint.type);
}

function normalizeMetrics(metrics) {
  const normalized = {};
  for (const [key, value] of Object.entries(metrics || {})) {
    const safeKey = normalizeId(key).replace(/[./-]/g, "_");
    const number = Number(value);
    if (!safeKey || !Number.isFinite(number) || number < 0) continue;
    normalized[safeKey] = Math.min(1000000, Math.round(number * 1000) / 1000);
  }
  return normalized;
}

function normalizeId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9._/-]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function normalizeSeverity(value) {
  const text = String(value || "low").toLowerCase();
  return ["low", "medium", "high", "critical"].includes(text) ? text : "low";
}
