import test from "node:test";
import assert from "node:assert/strict";
import { buildOperationalStatus, buildRuntimeDiagnosticsStatus, sanitizeBrowserStatus } from "../standalone-server.mjs";

test("operational status exposes commercial runtime health", () => {
  const status = buildOperationalStatus({
    runtimeDiagnosticsBrowser: { status: () => ({ open: false, lastError: "" }) },
    visaSecureBrowser: { status: () => ({ open: false }) },
    visaMonitor: { status: () => ({ ok: true, running: false, lastError: "" }) },
    host: "127.0.0.1",
    port: 4391
  });

  assert.equal(status.ok, true);
  assert.equal(status.service, "sig9-runtime-diagnostics");
  assert.equal(status.billing.packageCount, 6);
  assert.equal(status.runtimeDiagnostics.storagePolicy.historyLimit, 12);
  assert.ok(["healthy", "degraded"].includes(status.health));
  assert.ok(status.url.endsWith(":4391"));
});

test("runtime diagnostics status is safe before first sample", () => {
  const status = buildRuntimeDiagnosticsStatus({
    runtimeDiagnosticsBrowser: { status: () => ({ open: true, currentUrl: "about:blank" }) },
    host: "127.0.0.1",
    port: 4392
  });

  assert.equal(status.ok, true);
  assert.equal(status.latest, null);
  assert.equal(status.historyCount, 0);
  assert.equal(status.storagePolicy.latestFactLimit, 1000);
  assert.equal(status.storagePolicy.channelFactLimit, 300);
});

test("runtime diagnostics health survives a closed browser context", () => {
  const status = buildRuntimeDiagnosticsStatus({
    runtimeDiagnosticsBrowser: { status: () => { throw new Error("Target page, context or browser has been closed"); } },
    host: "127.0.0.1",
    port: 4392
  });

  assert.equal(status.ok, true);
  assert.equal(status.browser.state, "secure_browser_closed");
  assert.equal(status.browser.pageCount, 0);
  assert.match(status.browser.lastError, /relaunch automatically/);
});

test("operational health still responds when secure browser status throws", () => {
  const status = buildOperationalStatus({
    runtimeDiagnosticsBrowser: { status: () => { throw new Error("browser has been closed"); } },
    visaSecureBrowser: { status: () => { throw new Error("context closed"); } },
    visaMonitor: { status: () => ({ ok: true, running: false, lastError: "" }) },
    host: "127.0.0.1",
    port: 4391
  });

  assert.equal(status.ok, true);
  assert.equal(status.runtimeDiagnostics.browser.state, "secure_browser_closed");
  assert.match(status.runtimeDiagnostics.browser.lastError, /relaunch automatically/);
});

test("browser status redacts operational URLs and sensitive text", () => {
  const status = sanitizeBrowserStatus({
    ok: true,
    state: "secure_browser_open",
    pageUrl: "https://example.com/account?session=abc&token=secret",
    pageCount: 2,
    lastOpenedAt: 123,
    lastError: "Failed https://example.com/private?authorization=Bearer email=user@example.com",
    hasResult: true
  });

  assert.equal(status.pageUrl, "https://example.com/account");
  assert.equal(status.pageCount, 2);
  assert.equal(status.lastError.includes("token=secret"), false);
  assert.equal(status.lastError.includes("user@example.com"), false);
  assert.equal(status.hasResult, true);
});
