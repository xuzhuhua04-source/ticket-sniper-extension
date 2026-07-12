import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRenderedSnapshot } from "../standalone-analyzer.mjs";

await import("../organ-pipeline.js");

test("rendered diagnostics expose canonical facts and layer coverage", () => {
  const result = analyzeRenderedSnapshot({
    url: "https://example.com/app",
    html: "<!doctype html><title>Example</title><button aria-label='Open'>Open</button>",
    rendered: { title: "Example", buttons: 1, scripts: 0, links: 0 },
    runtimeFacts: [
      {
        timestamp: 100,
        source: "runtime",
        type: "layer_coverage",
        value: {
          severity: "info",
          layers: {
            dom: { status: "full", captureMode: "page_injection", confidence: 0.95, reason: "test" },
            serviceWorkerFetch: { status: "first_party_only", captureMode: "first_party_helper", confidence: 0.6, reason: "browser boundary" }
          }
        },
        metadata: {},
        context: { pageUrl: "https://example.com/app" }
      },
      {
        timestamp: 101,
        source: "a11y",
        type: "cdp_ax_tree",
        value: { severity: "low", nodeCount: 3 },
        metadata: { captureMode: "chrome_devtools_protocol" },
        context: { pageUrl: "https://example.com/app" }
      }
    ]
  });

  assert.equal(result.ok, true);
  const fact = result.diagnostics.runtimeFactHistory.find(item => item.source === "browser");
  assert.equal(fact.channel, "browser/rendered-dom-snapshot");
  assert.equal(typeof fact.organ, "string");
  assert.equal(typeof fact.confidence, "number");
  assert.equal(fact.captureMode, "playwright_rendered_snapshot");
  assert.equal(result.diagnostics.runtimeLayerCoverage.dom.status, "full");
  assert.equal(result.diagnostics.runtimeLayerCoverage.accessibility.status, "full");
  assert.equal(result.diagnostics.runtimeLayerCoverage.serviceWorkerFetch.status, "first_party_only");
});

test("rendered diagnostics preserve live collector runtime-layer facts", () => {
  const result = analyzeRenderedSnapshot({
    url: "https://example.com/app",
    html: "<!doctype html><title>Example</title><main id='app'>Hello</main>",
    rendered: { title: "Example", buttons: 0, scripts: 1, links: 0 },
    runtimeFacts: [
      {
        timestamp: 200,
        source: "dom",
        type: "node_added",
        value: { severity: "low", selector: "#app" },
        runtimeLayer: {
          treeId: "dom",
          type: "DOM.NodeAdded",
          nodeType: "tag",
          target: "dom:app",
          label: "main#app",
          captureMode: "page_injection"
        },
        captureMode: "page_injection",
        context: { pageUrl: "https://example.com/app" }
      }
    ]
  });

  const liveFact = result.diagnostics.runtimeFactHistory.find(item => item.source === "dom" && item.type === "node_added");
  assert.equal(liveFact.runtimeLayer.treeId, "dom");
  assert.equal(liveFact.runtimeLayer.type, "DOM.NodeAdded");
  assert.equal(liveFact.runtimeLayer.target, "dom:app");
  assert.equal(liveFact.captureMode, "page_injection");
});

test("standalone rendered analysis expands observed page structure into atomic facts", () => {
  const repeatedCards = Array.from({ length: 8 }, (_, index) => `
    <article class="card card-${index}" style="position: relative; display: flex; overflow: hidden">
      <h2>Card ${index}</h2>
      <p>Runtime diagnostics should preserve this visible text segment as observed structure.</p>
      <button aria-label="Open card ${index}">Open</button>
      <input name="filter-${index}" aria-expanded="false">
      <img src="/assets/card-${index}.png" alt="Card ${index}">
    </article>
  `).join("");
  const result = analyzeRenderedSnapshot({
    url: "https://example.com/app",
    html: `<!doctype html>
      <title>Atomic Fact Test</title>
      <link rel="stylesheet" href="/app.css">
      <link rel="stylesheet" href="https://cdn.example.com/theme.css">
      <style>@media (min-width: 800px) {.grid { display: grid; }}</style>
      <script src="/app.js"></script>
      <script src="https://cdn.example.com/vendor.js"></script>
      <main class="grid" role="main">${repeatedCards}</main>
      <iframe src="https://widgets.example.com/embed"></iframe>`,
    rendered: { title: "Atomic Fact Test", buttons: 8, scripts: 2, links: 0, iframes: 1 }
  });

  const facts = result.diagnostics.runtimeFactHistory;
  const channels = new Set(facts.map(item => item.channel));
  assert.equal(result.ok, true);
  assert.ok(facts.length >= 90, `expected rich atomic facts, got ${facts.length}`);
  for (const channel of [
    "network/resource_observed",
    "dom/element_change",
    "dom/attribute_change",
    "dom/text_change",
    "cssom/stylesheet_change",
    "cssom/css_rule_change",
    "layout/layout_tree",
    "interaction/click",
    "interaction/input",
    "a11y/a11y_role_change",
    "a11y/a11y_state_change"
  ]) {
    assert.ok(channels.has(channel), `missing ${channel}`);
  }
  assert.ok(facts.some(item => item.metadata?.source === "standalone-static-atomic-projection"));
});

test("Organ9 structure engine emits verifiable canonical SHA-256 signatures", () => {
  const builder = new globalThis.TicketSniperOrganPipeline.OrganGraphBuilder();
  for (const fact of [
    { timestamp: 1, source: "dom", type: "structure-snapshot", value: { severity: "low" } },
    { timestamp: 2, source: "layout", type: "layout_tree", value: { severity: "low" } },
    { timestamp: 3, source: "cssom", type: "cascade_conflict", value: { severity: "medium" } },
    { timestamp: 4, source: "vdom", type: "vdom_diff", value: { severity: "low" } }
  ]) builder.process(fact);

  const engine = builder.snapshot().structureEngine;
  assert.equal(engine.signature.algorithm, "canonical-sha256");
  assert.match(engine.signature.finalSignature, /^sha256-[a-f0-9]{64}$/);
  assert.equal(engine.verification.ok, true);
  assert.equal(engine.verification.finalSignatureConsistent, true);
  assert.equal(engine.sovereignty.sovereignSignature.algorithm, "canonical-sha256");
});
