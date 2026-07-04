import assert from "node:assert/strict";
import test from "node:test";

await import("../organ-frequency-engine.js");

const { ORGAN_ORDER, OrganFrequencySpectrumEngine } = globalThis.TicketSniperOrganFrequency;

test("frequency engine exposes all nine Organ9 lanes", () => {
  assert.deepEqual(ORGAN_ORDER, [
    "Energy",
    "Flow",
    "Supply",
    "Value",
    "Behavior",
    "Lifecycle",
    "Topology",
    "Dependency",
    "Rhythm"
  ]);
});

test("commercial package suite scores all five products from runtime facts", () => {
  const engine = new OrganFrequencySpectrumEngine({}, { windowMs: 100 });
  engine.ingestMany([
    { timestamp: 1, source: "performance", type: "long-task", value: { duration: 180, severity: "medium" } },
    { timestamp: 2, source: "network", type: "request_burst", value: { status: 429, severity: "high" } },
    { timestamp: 3, source: "network", type: "resource_load", value: { transferSize: 2048, severity: "low" } },
    { timestamp: 4, source: "dom", type: "mutation", value: { added: 12, severity: "low" } },
    { timestamp: 5, source: "runtime", type: "wasm_worker_model_loading", value: { count: 4, severity: "medium" } },
    { timestamp: 6, source: "runtime", type: "js_microtask", value: { count: 22, severity: "medium" } }
  ]);

  const snapshot = engine.snapshot();
  assert.equal(Object.keys(snapshot.spectra).length, 9);
  assert.equal(snapshot.commercialPackages.packages.length, 5);
  assert.ok(snapshot.commercialPackages.summary.activePackages > 0);
  assert.ok(snapshot.commercialPackages.summary.suiteSignature);
  assert.ok(snapshot.spectra.Energy.total > 0);
  assert.ok(snapshot.spectra.Supply.total > 0);
});
