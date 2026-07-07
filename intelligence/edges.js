import { metricFromFact } from "./metrics.js";

export function dependencyEdgeFromFact(fact = {}) {
  const metric = metricFromFact(fact);
  if (metric === "behavior") return null;
  return { from: "browser", to: metric, type: "runtime-frequency", weight: 1 };
}

export function dependencyEdgesFromFacts(facts = []) {
  return (Array.isArray(facts) ? facts : [])
    .map(entry => dependencyEdgeFromFact(entry.fact || entry))
    .filter(Boolean);
}
