import test from "node:test";
import assert from "node:assert/strict";

import { buildCorsOrigin, startStandaloneServer } from "../standalone-server.mjs";

test("behavior stream CORS permits first-party customer ingest origins", () => {
  const origin = buildCorsOrigin({
    headers: {
      origin: "https://customer.example",
      host: "127.0.0.1:4394"
    }
  }, "/api/behavior-stream");

  assert.equal(origin, "https://customer.example");
});

test("behavior stream API accepts compact windows and terminal endpoint returns all panels", async () => {
  const app = await startStandaloneServer({ port: 4795 });
  try {
    const start = Date.now() - 1000;
    const ingest = await fetch(`${app.url}/api/behavior-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        windows: [{
          window_id: "api-window-1",
          site_id: "example.com",
          page_id: "/",
          client_segment: "api-test",
          start_ts: start,
          end_ts: start + 1000,
          bucket_ms: 1000,
          metrics: { js: 8, worker: 2, behavior: 10 },
          dependency_edges: [{ from: "browser", to: "worker", type: "runtime-frequency", weight: 2 }],
          risk_hints: []
        }]
      })
    }).then(response => response.json());
    assert.equal(ingest.accepted, 1);
    assert.equal(ingest.rejected, 0);

    const status = await fetch(`${app.url}/api/behavior-stream/status`).then(response => response.json());
    assert.equal(status.acceptedWindowCount >= 1, true);
    assert.equal(status.activeSites.includes("example.com"), true);

    const terminal = await fetch(`${app.url}/api/sig9/terminal?site_id=example.com`).then(response => response.json());
    assert.equal(terminal.ok, true);
    assert.ok(terminal.frequency);
    assert.ok(Array.isArray(terminal.storms));
    assert.ok(Array.isArray(terminal.deviations));
    assert.ok(terminal.risk);
    assert.ok(terminal.dependencies);
    assert.ok(Array.isArray(terminal.windows));

    const legacyTerminal = await fetch(`${app.url}/api/web-bloomberg/terminal?site_id=example.com`).then(response => response.json());
    assert.equal(legacyTerminal.ok, true);
  } finally {
    await new Promise(resolve => app.server.close(resolve));
  }
});

test("behavior stream API rejects raw event uploads", async () => {
  const app = await startStandaloneServer({ port: 4796 });
  try {
    const start = Date.now() - 1000;
    const response = await fetch(`${app.url}/api/behavior-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        windows: [{
          site_id: "example.com",
          page_id: "/",
          start_ts: start,
          end_ts: start + 1000,
          bucket_ms: 1000,
          metrics: { js: 1 },
          events: [{ ts: start, type: "raw" }]
        }]
      })
    });
    const payload = await response.json();
    assert.equal(response.status, 207);
    assert.equal(payload.accepted, 0);
    assert.equal(payload.errors[0].code, "RAW_EVENT_STREAM_REJECTED");
  } finally {
    await new Promise(resolve => app.server.close(resolve));
  }
});

test("behavior stream API honors SIG9 ingest key header", async () => {
  const previous = process.env.SIG9_BEHAVIOR_INGEST_KEY;
  process.env.SIG9_BEHAVIOR_INGEST_KEY = "test-ingest-secret";
  const app = await startStandaloneServer({ port: 4797 });
  try {
    const start = Date.now() - 1000;
    const body = JSON.stringify({
      windows: [{
        window_id: "secured-window-1",
        site_id: "secured.example",
        page_id: "/",
        client_segment: "secured-test",
        start_ts: start,
        end_ts: start + 1000,
        bucket_ms: 1000,
        metrics: { js: 2 }
      }]
    });
    const rejected = await fetch(`${app.url}/api/behavior-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const rejectedPayload = await rejected.json();
    assert.equal(rejected.status, 401);
    assert.equal(rejectedPayload.code, "SIG9_BEHAVIOR_INGEST_KEY_INVALID");

    const accepted = await fetch(`${app.url}/api/behavior-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-SIG9-Ingest-Key": "test-ingest-secret" },
      body
    }).then(response => response.json());
    assert.equal(accepted.accepted, 1);
    assert.equal(accepted.rejected, 0);
  } finally {
    await new Promise(resolve => app.server.close(resolve));
    if (previous === undefined) delete process.env.SIG9_BEHAVIOR_INGEST_KEY;
    else process.env.SIG9_BEHAVIOR_INGEST_KEY = previous;
  }
});
