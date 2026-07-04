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
