import test from "node:test";
import assert from "node:assert/strict";

import { createWebBloombergStore, deriveBehaviorWindowsFromFacts, validateBehaviorWindow, WEB_BLOOMBERG_BUCKETS } from "../web-bloomberg-engine.mjs";

test("Web Bloomberg V1 supports the required local bucket schedule", () => {
  assert.deepEqual(WEB_BLOOMBERG_BUCKETS, [10, 50, 100, 1000]);
});

test("BehaviorWindow validation accepts compact windows and rejects raw traces", () => {
  const start = Date.now() - 1000;
  const valid = validateBehaviorWindow({
    window_id: "window-001",
    site_id: "example.com",
    page_id: "/",
    client_segment: "test",
    start_ts: start,
    end_ts: start + 1000,
    bucket_ms: 1000,
    metrics: { js: 4, worker: 2 },
    dependency_edges: [{ from: "browser", to: "worker", type: "runtime", weight: 2 }],
    risk_hints: [{ type: "worker", severity: "medium", summary: "worker pressure" }]
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.window.metrics.js, 4);

  const raw = validateBehaviorWindow({
    site_id: "example.com",
    start_ts: start,
    end_ts: start + 1000,
    bucket_ms: 1000,
    metrics: { js: 1 },
    events: [{ ts: start, type: "raw" }]
  });
  assert.equal(raw.ok, false);
  assert.equal(raw.code, "RAW_EVENT_STREAM_REJECTED");
});

test("Web Bloomberg store produces storms, deviations, risk, dependencies, and bounded windows", () => {
  const store = createWebBloombergStore({ maxWindows: 12, maxEvents: 30 });
  const base = Date.now() - 15000;
  const windows = Array.from({ length: 18 }, (_, index) => ({
    window_id: `w-${index}`,
    site_id: "example.com",
    page_id: "/app",
    client_segment: "test",
    start_ts: base + index * 1000,
    end_ts: base + index * 1000 + 1000,
    bucket_ms: 1000,
    metrics: index === 17 ? { js: 95, worker: 45, malicious: 3 } : { js: 2, worker: 1 },
    dependency_edges: [{ from: "browser", to: "worker", type: "runtime-frequency", weight: 1 }],
    risk_hints: index === 17 ? [{ type: "malicious", severity: "high", summary: "protection spike" }] : []
  }));
  const result = store.ingest({ windows });
  assert.equal(result.accepted, 18);
  assert.equal(store.status().acceptedWindowCount, 18);
  assert.equal(store.export().windows.length, 12);
  const terminal = store.terminal({ site_id: "example.com", page_id: "/app", window: 20000 });
  assert.equal(terminal.ok, true);
  assert.ok(terminal.storms.length >= 1);
  assert.ok(terminal.risk.score > 0);
  assert.ok(terminal.dependencies.edgeCount >= 1);
});

test("runtime facts can be compacted into upload-safe behavior windows", () => {
  const facts = [
    { timestamp: Date.now(), source: "runtime", type: "script-error", value: { severity: "high" }, context: { pageUrl: "https://example.com/app" } },
    { timestamp: Date.now(), source: "multicontext", type: "worker-message", value: {}, context: { pageUrl: "https://example.com/app" } }
  ];
  const windows = deriveBehaviorWindowsFromFacts(facts, { url: "https://example.com/app" });
  assert.equal(windows.length, 1);
  assert.equal(windows[0].site_id, "example.com");
  assert.equal(windows[0].bucket_ms, 1000);
  assert.ok(windows[0].metrics.js >= 1);
  assert.ok(windows[0].metrics.worker >= 1);
});
