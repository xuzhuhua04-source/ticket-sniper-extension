import { classifyFact } from "./classify.js";
import { metricFromFact } from "./metrics.js";
import { riskHintFromFact } from "./hints.js";

export function factToMSU(fact = {}) {
  const metric = metricFromFact(fact);
  const categories = classifyFact(fact);
  const hint = riskHintFromFact(fact);
  return {
    id: `fact:${fact.source || "runtime"}:${fact.type || "fact"}:${Number(fact.timestamp) || 0}`,
    kind: "fact_msu",
    source: fact.source || "runtime",
    type: fact.type || "fact",
    metric,
    categories,
    hint,
    actionDomain: actionDomainFor(metric, categories),
    payload: { source: fact.source, type: fact.type }
  };
}

function actionDomainFor(metric, categories) {
  if (metric === "layout" || categories.includes("layout")) return "layout";
  if (metric === "dom" || categories.includes("structure")) return "dom";
  if (metric === "network") return "network";
  if (metric === "interaction") return "interaction";
  if (["malicious", "protection"].includes(metric) || categories.includes("protection")) return "security";
  if (["js", "microtask", "longtask", "worker", "wasm", "webgpu", "ai"].includes(metric)) return "runtime";
  return "runtime";
}
