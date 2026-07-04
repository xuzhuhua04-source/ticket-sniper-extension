import test from "node:test";
import assert from "node:assert/strict";
import { buildCorsOrigin, startStandaloneServer } from "../standalone-server.mjs";

test("control APIs do not reflect arbitrary cross-origin callers", () => {
  const origin = buildCorsOrigin({
    headers: {
      origin: "https://attacker.example",
      host: "127.0.0.1:4394"
    }
  }, "/api/runtime-browser/analyze");

  assert.equal(origin, "");
});

test("local control APIs allow same-port local app origins", () => {
  const origin = buildCorsOrigin({
    headers: {
      origin: "http://127.0.0.1:4394",
      host: "127.0.0.1:4394"
    }
  }, "/api/runtime-browser/analyze");

  assert.equal(origin, "http://127.0.0.1:4394");
});

test("first-party runtime ingest can accept customer website origins", () => {
  const origin = buildCorsOrigin({
    headers: {
      origin: "https://customer.example",
      host: "127.0.0.1:4394"
    }
  }, "/api/runtime-diagnostics/ingest");

  assert.equal(origin, "https://customer.example");
});

test("standalone server emits commercial security headers", async () => {
  const app = await startStandaloneServer({ port: 4790 });
  try {
    const response = await fetch(`${app.url}/`);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.match(response.headers.get("permissions-policy") || "", /microphone=\(\)/);
    assert.match(response.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
    assert.match(response.headers.get("content-security-policy") || "", /connect-src 'self'/);
  } finally {
    await new Promise(resolve => app.server.close(resolve));
  }
});

test("ranking crawler exposes controllable local collection status", async () => {
  const app = await startStandaloneServer({ port: 4794 });
  try {
    const initial = await fetch(`${app.url}/api/rankings/crawler/status`).then(response => response.json());
    assert.equal(initial.ok, true);
    assert.equal(initial.crawler.running, false);

    const started = await fetch(`${app.url}/api/rankings/crawler/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: ["https://example.com/"], intervalMs: 60000, batchSize: 2 })
    }).then(response => response.json());
    assert.equal(started.ok, true);
    assert.equal(started.crawler.running, true);
    assert.equal(started.crawler.queueSize, 1);
    assert.equal(started.crawler.batchSize, 2);

    const stopped = await fetch(`${app.url}/api/rankings/crawler/stop`, { method: "POST" }).then(response => response.json());
    assert.equal(stopped.ok, true);
    assert.equal(stopped.crawler.running, false);
  } finally {
    await new Promise(resolve => app.server.close(resolve));
  }
});
