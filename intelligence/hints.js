import { metricFromFact } from "./metrics.js";

export function riskHintFromFact(fact = {}) {
  const metric = metricFromFact(fact);
  const severity = normalizeSeverity(fact.value?.severity || fact.severity || "low");
  const type = hintType(fact, metric);
  if (severity === "high" || ["malicious", "protection", "longtask", "layout", "microtask"].includes(metric)) {
    return { type, severity, summary: `${fact.source || "runtime"}/${fact.type || "fact"}` };
  }
  return null;
}

export function riskHintsFromFacts(facts = []) {
  return (Array.isArray(facts) ? facts : [])
    .map(entry => riskHintFromFact(entry.fact || entry))
    .filter(Boolean);
}

function hintType(fact, metric) {
  const text = `${fact.source || ""}/${fact.type || ""}`.toLowerCase();
  if (/cascade|specificity|selector/.test(text)) return "css-conflict";
  if (/mutation-burst|dom.*burst|explosion/.test(text)) return "dom-explosion";
  if (/layout|shift|reflow/.test(text)) return "layout-instability";
  if (/captcha|crawler|fingerprint|challenge/.test(text)) return "anti-crawler";
  if (/microtask|longtask|promise/.test(text)) return "runtime-overload";
  if (/vdom|react|vue|svelte/.test(text)) return "vdom-diff-risk";
  return metric;
}

function normalizeSeverity(value) {
  const text = String(value || "low").toLowerCase();
  return ["low", "medium", "high", "critical"].includes(text) ? text : "low";
}
