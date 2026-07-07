import { metricsFromFacts } from "./metrics.js";
import { dependencyEdgesFromFacts } from "./edges.js";
import { riskHintsFromFacts } from "./hints.js";
import { classifyFact } from "./classify.js";
import { factToMSU } from "./factToMSU.js";
import { windowToMSU } from "./windowToMSU.js";
import { normalizeIntelligenceWindow } from "./windowNormalize.js";

export const INTELLIGENCE_LAYER_VERSION = "stl-web-intelligence-v1";

export function buildIntelligenceLayerModel(facts = [], windows = []) {
  const rawFacts = (Array.isArray(facts) ? facts : []).map(entry => entry.fact || entry).filter(Boolean);
  const normalizedWindows = (Array.isArray(windows) ? windows : []).map(normalizeIntelligenceWindow);
  return {
    version: INTELLIGENCE_LAYER_VERSION,
    metrics: metricsFromFacts(rawFacts),
    edges: dependencyEdgesFromFacts(rawFacts).slice(0, 120),
    hints: riskHintsFromFacts(rawFacts).slice(0, 80),
    classifications: rawFacts.slice(0, 200).map(fact => ({
      source: fact.source || "runtime",
      type: fact.type || "fact",
      categories: classifyFact(fact)
    })),
    windows: normalizedWindows.slice(-80),
    msu: [
      ...rawFacts.slice(0, 120).map(factToMSU),
      ...normalizedWindows.slice(-40).map(windowToMSU)
    ],
    status: {
      state: rawFacts.length || normalizedWindows.length ? "intelligence_ready" : "intelligence_waiting"
    }
  };
}
