import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { buildFactsLayerModel, assertFactsLayerPurity } from "../facts/index.js";
import { buildIntelligenceLayerModel } from "../intelligence/index.js";
import { buildAutomationLayerModel, executeMSU } from "../automation/exec.js";
import { deriveBehaviorWindowsFromFacts } from "../web-bloomberg-engine.mjs";
import { buildStandaloneExportPayload } from "../standalone-server.mjs";

test("Facts layer keeps raw facts and strips derived interpretation fields", () => {
  const model = buildFactsLayerModel([
    {
      channel: "dom/element-change",
      fact: {
        timestamp: 1,
        source: "dom",
        type: "element-change",
        value: {
          added: 1,
          risk_hints: [{ type: "dom-explosion" }],
          action: "fix-dom"
        }
      }
    }
  ]);

  assert.equal(model.totalFacts, 1);
  assert.equal(model.channelCount, 1);
  assert.equal(model.channels["dom/element_change"].length, 1);
  assert.equal(model.domains.find(domain => domain.id === "dom").total, 1);
  assert.equal(assertFactsLayerPurity(model.history[0].fact), true);
  assert.equal(model.history[0].fact.value.risk_hints, undefined);
  assert.equal(model.history[0].fact.originalChannel, "dom/element-change");
});

test("Intelligence layer turns raw facts into metrics, hints, edges, and MSU", () => {
  const facts = [
    { timestamp: 1, source: "layout", type: "layout_shift", value: { severity: "medium" } },
    { timestamp: 2, source: "anti_crawler", type: "crawler_challenge", value: { severity: "high" } }
  ];
  const model = buildIntelligenceLayerModel(facts);
  assert.equal(model.metrics.layout, 1);
  assert.equal(model.metrics.malicious, 1);
  assert.ok(model.edges.length >= 2);
  assert.ok(model.hints.some(hint => hint.type === "anti-crawler"));
  assert.ok(model.msu.some(msu => msu.actionDomain === "security"));
});

test("Network and interaction facts are classified into the runtime domains", () => {
  const facts = [
    { timestamp: 1, source: "network", type: "request", value: { kind: "fetch", status: 200 } },
    { timestamp: 2, source: "interaction", type: "pointer_move", value: { x: 10, y: 20 } }
  ];
  const factsLayer = buildFactsLayerModel(facts);
  const intelligenceLayer = buildIntelligenceLayerModel(facts);
  assert.equal(factsLayer.domains.find(domain => domain.id === "network").total, 1);
  assert.equal(factsLayer.domains.find(domain => domain.id === "interaction").total, 1);
  assert.ok(intelligenceLayer.metrics.network >= 1);
  assert.ok(intelligenceLayer.classifications.some(item => item.categories.includes("network")));
  assert.ok(intelligenceLayer.msu.some(msu => msu.actionDomain === "network"));
});

test("Automation layer dispatches MSU without mutating facts", () => {
  const action = executeMSU({ id: "x", actionDomain: "network", payload: { source: "network" } });
  assert.equal(action.domain, "network");
  assert.equal(action.status, "recommended");
  const model = buildAutomationLayerModel([{ id: "x", actionDomain: "layout" }]);
  assert.equal(model.executionStatus.dryRun, true);
  assert.equal(model.actions[0].domain, "layout");
});

test("Facts modules do not import intelligence or automation", async () => {
  const files = await readdir(new URL("../facts/", import.meta.url));
  for (const file of files.filter(name => name.endsWith(".js"))) {
    const source = await readFile(new URL(`../facts/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from\s+["']\.\.\/intelligence|from\s+["']\.\.\/automation/);
  }
});

test("Bloomberg derivation consumes intelligence layer concepts", async () => {
  const source = await readFile(new URL("../web-bloomberg-engine.mjs", import.meta.url), "utf8");
  assert.match(source, /from "\.\/intelligence\/metrics\.js"/);
  assert.match(source, /from "\.\/intelligence\/edges\.js"/);
  assert.match(source, /from "\.\/intelligence\/hints\.js"/);
  const windows = deriveBehaviorWindowsFromFacts([
    { timestamp: Date.now(), source: "runtime", type: "js_microtask", value: { severity: "low" }, context: { pageUrl: "https://example.com/app" } }
  ], { url: "https://example.com/app" });
  assert.equal(windows.length, 1);
  assert.equal(windows[0].metrics.microtask, 1);
});

test("Standalone export exposes Facts, Intelligence, and Automation layers", () => {
  const payload = buildStandaloneExportPayload({
    latest: {
      diagnostics: {
        runtimeFactHistory: [
          { timestamp: 1, source: "dom", type: "element-change", channel: "dom/element-change", value: { added: 1 }, context: { pageUrl: "https://example.com/" } }
        ],
        runtimeFactChannels: {
          "dom/element-change": [
            { timestamp: 1, source: "dom", type: "element-change", value: { added: 1 }, context: { pageUrl: "https://example.com/" } }
          ]
        }
      }
    },
    history: []
  });
  assert.equal(payload.factsLayer.totalFacts, 1);
  assert.ok(payload.intelligenceLayer.msu.length >= 1);
  assert.ok(payload.automationLayer.actions.length >= 1);
});
