import { classifyFact } from "./classify.js";

export const INTELLIGENCE_METRICS = Object.freeze([
  "behavior",
  "dom",
  "layout",
  "js",
  "network",
  "malicious",
  "protection",
  "ai",
  "worker",
  "wasm",
  "webgpu",
  "microtask",
  "longtask",
  "raf"
]);

export function metricFromFact(fact = {}) {
  const text = `${fact.source || ""}/${fact.type || ""}`.toLowerCase();
  if (/ai|inference|model|embedding/.test(text)) return "ai";
  if (/wasm|webassembly/.test(text)) return "wasm";
  if (/webgpu|gpu/.test(text)) return "webgpu";
  if (/worker|service-worker|messagechannel|post-message|multicontext/.test(text)) return "worker";
  if (/promise|microtask/.test(text)) return "microtask";
  if (/longtask|long-task/.test(text)) return "longtask";
  if (/raf|frame|animation/.test(text)) return "raf";
  if (/script|javascript|runtime|timer|error|console/.test(text)) return "js";
  if (/malicious|fingerprint|captcha|challenge|crawler|webdriver|headless/.test(text)) return "malicious";
  if (/protect|auth|login|paywall/.test(text)) return "protection";
  if (/network|fetch|xhr|resource|websocket|request|response/.test(text)) return "network";
  if (/layout|style|css|paint|shift|reflow/.test(text)) return "layout";
  if (/dom|mutation|shadow|vdom|node/.test(text)) return "dom";
  return classifyFact(fact)[0] || "behavior";
}

export function metricsFromFacts(facts = []) {
  const metrics = {};
  for (const entry of Array.isArray(facts) ? facts : []) {
    const fact = entry.fact || entry;
    const metric = metricFromFact(fact);
    metrics[metric] = (metrics[metric] || 0) + 1;
    metrics.behavior = (metrics.behavior || 0) + 1;
  }
  return metrics;
}
