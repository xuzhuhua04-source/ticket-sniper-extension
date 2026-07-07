import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const runtimeCollector = await readFile(new URL("../runtime-collector.js", import.meta.url), "utf8");
const runtimeLayer = await readFile(new URL("../runtime-layer/runtime-collector.js", import.meta.url), "utf8");
const diagnosticsLayer = await readFile(new URL("../diagnostics-layer/diagnostics-collector.js", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));

test("required runtime-layer and diagnostics-layer module files exist", async () => {
  const runtimeFiles = new Set(await readdir(new URL("../runtime-layer/", import.meta.url)));
  const diagnosticsFiles = new Set(await readdir(new URL("../diagnostics-layer/", import.meta.url)));

  for (const file of [
    "runtime-collector.js",
    "dom.js",
    "cssom.js",
    "layout.js",
    "shadow.js",
    "a11y.js",
    "js-runtime.js",
    "worker.js",
    "vdom.js"
  ]) assert.equal(runtimeFiles.has(file), true, `missing runtime-layer/${file}`);

  for (const file of [
    "diagnostics-collector.js",
    "anti-crawler.js",
    "protection-surface.js",
    "behavior.js",
    "performance.js",
    "storage.js",
    "network.js",
    "vdom-scan.js",
    "layout-scan.js",
    "cssom-scan.js",
    "a11y-scan.js",
    "bloomberg.js"
  ]) assert.equal(diagnosticsFiles.has(file), true, `missing diagnostics-layer/${file}`);
});

test("runtime collector has separate runtime and diagnostics emit/start paths", () => {
  assert.match(runtimeCollector, /startRuntimeLayer\(\)/);
  assert.match(runtimeCollector, /startDiagnosticsLayer\(\)/);
  assert.match(runtimeCollector, /emitRuntimeFact\(source, type/);
  assert.match(runtimeCollector, /emitDiagnosticFact\(source, type/);
  assert.match(runtimeCollector, /type: "RUNTIME_FACT_DETECTED"/);
  assert.match(runtimeCollector, /type: "DIAGNOSTIC_FACT_DETECTED"/);
  assert.match(runtimeCollector, /isRuntimeStructuralFact\(source, type\)/);
});

test("extension loads layer registries before the runtime collector", () => {
  const scripts = manifest.content_scripts?.find(entry => entry.matches?.includes("http://*/*"))?.js || [];
  assert.ok(scripts.indexOf("runtime-layer/runtime-collector.js") > -1);
  assert.ok(scripts.indexOf("diagnostics-layer/diagnostics-collector.js") > -1);
  assert.ok(scripts.indexOf("runtime-collector.js") > -1);
  assert.ok(scripts.indexOf("runtime-layer/runtime-collector.js") < scripts.indexOf("runtime-collector.js"));
  assert.ok(scripts.indexOf("diagnostics-layer/diagnostics-collector.js") < scripts.indexOf("runtime-collector.js"));
  assert.match(runtimeLayer, /globalThis\.TicketSniperRuntimeLayer/);
  assert.match(diagnosticsLayer, /globalThis\.TicketSniperDiagnosticsLayer/);
  assert.match(runtimeCollector, /globalThis\.TicketSniperRuntimeLayer/);
});

test("runtime structural allow-list and diagnostics registry classify old facts apart", () => {
  for (const structural of [
    "dom/element_change",
    "dom/attribute_change",
    "dom/text_change",
    "cssom/css_rule_insert",
    "cssom/css_rule_delete",
    "layout/layout_shift",
    "runtime/js_microtask",
    "runtime/js_promise_chain",
    "multicontext/worker_created",
    "vdom/vdom_diff"
  ]) assert.match(runtimeLayer, new RegExp(structural.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const diagnostic of [
    "dom/mutation_burst",
    "runtime/diagnostics_tick",
    "runtime/health_heartbeat",
    "storage/storage_snapshot",
    "network/resource_observed",
    "anti_crawler/challenge",
    "web_bloomberg/behavior_window",
    "layout/layout_tree",
    "cssom/stylesheet_change",
    "a11y/a11y_topology",
    "vdom/vdom_topology"
  ]) assert.match(diagnosticsLayer, new RegExp(diagnostic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("runtimeLayerDirectMap no longer includes diagnostics-only fact families", () => {
  const directMapStart = runtimeCollector.indexOf("function runtimeLayerDirectMap()");
  const directMapEnd = runtimeCollector.indexOf("function runtimeLayerFallback", directMapStart);
  const directMapSource = runtimeCollector.slice(directMapStart, directMapEnd);
  for (const diagnostic of [
    "mutation_burst",
    "diagnostics_tick",
    "health_heartbeat",
    "storage_snapshot",
    "resource_observed",
    "anti_crawler",
    "web_bloomberg",
    "layout_tree",
    "stylesheet_change",
    "a11y_topology",
    "vdom_topology"
  ]) assert.doesNotMatch(directMapSource, new RegExp(diagnostic));
});
