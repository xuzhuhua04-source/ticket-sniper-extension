import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { analyzeRuntimeTarget, validateRuntimeTargetUrl } from "../standalone-server.mjs";

test("runtime browser analysis falls back to structural URL analysis", async () => {
  const server = createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`
      <!doctype html>
      <html>
        <head><title>Fallback Test</title><script src="/app.js"></script></head>
        <body><h1>Runtime Fallback</h1><form><input type="password"></form></body>
      </html>
    `);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const result = await analyzeRuntimeTarget({
      analyze: async () => {
        throw Object.assign(new Error("Target page, context or browser has been closed"), { status: 500 });
      }
    }, `http://127.0.0.1:${port}/`);

    assert.equal(result.ok, true);
    assert.equal(result.fallback.used, true);
    assert.equal(result.status.state, "structural_fallback_analyzed");
    assert.equal(result.diagnostics.runtimeFactChannels["runtime/structural-fallback"].length, 1);
    assert.ok(result.diagnostics.runtimeFactHistory.some(fact => fact.type === "structural-fallback"));
    assert.equal(result.diagnostics.organFrequencySpectrumLatest.commercialPackages.packages.length, 5);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("runtime browser analysis rejects the local app before opening the browser bridge", async () => {
  let called = false;
  await assert.rejects(
    () => analyzeRuntimeTarget({
      analyze: async () => {
        called = true;
        return {};
      }
    }, "http://127.0.0.1:4394/runtime-diagnostics.html?token=secret", {
      localAppOrigins: ["http://127.0.0.1:4394", "http://localhost:4394"]
    }),
    error => {
      assert.equal(error.status, 400);
      assert.equal(error.code, "RUNTIME_TARGET_SELF_APP");
      assert.equal(error.message.includes("own local application"), true);
      return true;
    }
  );
  assert.equal(called, false);
});

test("runtime target validation rejects unsupported protocols and accepts external HTTP targets", () => {
  assert.throws(
    () => validateRuntimeTargetUrl("file:///C:/private.html", { localAppOrigins: ["http://127.0.0.1:4394"] }),
    error => error.code === "RUNTIME_TARGET_UNSUPPORTED_PROTOCOL"
  );
  const url = validateRuntimeTargetUrl("https://example.com/path?session=abc", { localAppOrigins: ["http://127.0.0.1:4394"] });
  assert.equal(url.origin, "https://example.com");
  assert.equal(url.pathname, "/path");
});
