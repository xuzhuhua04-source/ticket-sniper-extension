import { classifyFact } from "./classify.js";

export const INTELLIGENCE_METRICS = Object.freeze([
  "behavior",
  "dom",
  "layout",
  "js",
  "network",
  "malicious",
  "protection",
  "device",
  "browser_internal",
  "security",
  "web_runtime",
  "ai_runtime",
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
  if (/device_|cpu|battery|thermal|memory_pressure|io_/.test(text)) return "device";
  if (/browser_|renderer_|compositor_|gpu_process|network_dns|network_tls|network_h2|network_h3|network_cache|io_cookie|io_storage|io_indexeddb/.test(text)) return "browser_internal";
  if (/security_|sandbox|permission|isolation|certificate|mixed_content|cors|exploit/.test(text)) return "security";
  if (/^ai\/|\/ai_|ai_action|ai_dom|ai_request|ai_interaction|ai_state/.test(text)) return "ai_runtime";
  if (/^web\/|\/web_/.test(text)) return "web_runtime";
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
  if (/network|fetch|xhr|resource|websocket|request|response|beacon/.test(text)) return "network";
  if (/click|input|keypress|keydown|keyup|pointer|scroll|wheel|focus|blur|selection|touch|gesture/.test(text)) return "interaction";
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
