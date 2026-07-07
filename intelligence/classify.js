export function classifyFact(fact = {}) {
  const text = `${fact.source || ""}/${fact.type || ""} ${JSON.stringify(fact.value || {})}`.toLowerCase();
  const categories = [];
  if (/captcha|challenge|fingerprint|crawler|webdriver|headless|bot|block/.test(text)) categories.push("protection");
  if (/malicious|exploit|injection|suspicious/.test(text)) categories.push("malicious");
  if (/ai|inference|model|embedding|wasm|webassembly|webgpu|gpu/.test(text)) categories.push("ai");
  if (/layout|reflow|shift|paint|style|css|cascade/.test(text)) categories.push("layout");
  if (/dom|mutation|node|shadow|vdom|component/.test(text)) categories.push("structure");
  if (/fetch|xhr|network|websocket|resource|request|response|beacon/.test(text)) categories.push("network");
  if (/click|input|keypress|keydown|keyup|pointer|scroll|wheel|focus|blur|selection|touch|gesture/.test(text)) categories.push("interaction");
  if (/microtask|promise|timer|long.?task|runtime|script|console|error/.test(text)) categories.push("runtime");
  return categories.length ? categories : ["behavior"];
}
