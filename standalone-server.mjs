import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { analyzeUrl } from "./standalone-analyzer.mjs";
import { SecureBrowserRuntime } from "./secure-browser-runtime.mjs";
import { accountEntitlements, billingStatus, createCheckoutSession, entitlementsFromAuthorizeNetEvent, portalUrl, verifyAuthorizeNetWebhook } from "./companion-app/src/billing.mjs";
import { createWebBloombergStore, deriveBehaviorWindowsFromFacts } from "./web-bloomberg-engine.mjs";
import { buildFactsLayerModel } from "./facts/index.js";
import { buildIntelligenceLayerModel } from "./intelligence/index.js";
import { buildAutomationLayerModel } from "./automation/exec.js";
import "./organ-frequency-engine.js";

const MAX_STANDALONE_HISTORY = 12;
const MAX_LATEST_FACTS = 240;
const MAX_HISTORY_FACTS = 120;
const MAX_CHANNEL_FACTS = 40;
const MAX_STREAM_FACTS = 120;
const MAX_INGEST_FACTS = 1000;

const root = resolve(import.meta.dirname);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8"
};
const standaloneDiagnosticsStore = {
  latest: null,
  history: []
};
const webBloombergStore = createWebBloombergStore();
const accountEntitlementStore = new Map();
const diagnosticsStreamClients = new Set();
const rankingCrawler = createRankingCrawler();

export async function startStandaloneServer(options = {}) {
  const port = Math.max(1024, Number(options.port ?? process.env.PORT) || 4391);
  const host = options.host || process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  const localAppOrigins = [
    `http://${displayHost}:${port}`,
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`
  ];
  const visaSecureBrowser = new SecureBrowserRuntime({
    profileLabel: "visa-secure-browser",
    profileDir: resolve(import.meta.dirname, ".ticket-sniper-visa-secure-browser"),
    localAppOrigins
  });
  const runtimeDiagnosticsBrowser = new SecureBrowserRuntime({
    profileLabel: "runtime-diagnostics-browser",
    profileDir: resolve(import.meta.dirname, ".ticket-sniper-runtime-diagnostics-browser"),
    localAppOrigins
  });
  const visaMonitor = createVisaMonitorSession(visaSecureBrowser);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
      setHeaders(request, response, url.pathname);
      if (request.method === "OPTIONS") return response.writeHead(204).end();
      if (url.pathname === "/favicon.ico") return response.writeHead(204, { "Cache-Control": "no-store" }).end();
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json(response, 200, buildOperationalStatus({ runtimeDiagnosticsBrowser, visaSecureBrowser, visaMonitor, host, port }));
      }
      if (url.pathname === "/api/runtime-diagnostics/status" && request.method === "GET") {
        return json(response, 200, buildRuntimeDiagnosticsStatus({ runtimeDiagnosticsBrowser, host, port }));
      }
      if (url.pathname === "/api/analyze-url" && request.method === "GET") {
        const result = await analyzeUrl(url.searchParams.get("url") || "");
        return json(response, 200, result);
      }
      if (url.pathname === "/api/secure-browser/open" && request.method === "POST") {
        const body = await readJsonBody(request);
        const result = await visaSecureBrowser.open(body.url || "");
        return json(response, 200, result);
      }
      if (url.pathname === "/api/secure-browser/status" && request.method === "GET") {
        return json(response, 200, sanitizeBrowserStatus(visaSecureBrowser.status()));
      }
      if (url.pathname === "/api/secure-browser/analyze" && request.method === "GET") {
        const result = await visaSecureBrowser.analyze(url.searchParams.get("url") || "");
        return json(response, 200, result);
      }
      if (url.pathname === "/api/visa-monitor/start" && request.method === "POST") {
        const body = await readJsonBody(request);
        const result = await visaMonitor.start(body);
        return json(response, 200, result);
      }
      if (url.pathname === "/api/visa-monitor/stop" && request.method === "POST") {
        const result = visaMonitor.stop();
        return json(response, 200, result);
      }
      if (url.pathname === "/api/visa-monitor/status" && request.method === "GET") {
        return json(response, 200, visaMonitor.status());
      }
      if (url.pathname === "/api/runtime-browser/analyze" && request.method === "GET") {
        const result = await analyzeRuntimeTarget(runtimeDiagnosticsBrowser, url.searchParams.get("url") || "", { localAppOrigins });
        attachWebBloombergModel(result);
        rememberStandaloneDiagnostics(result);
        return json(response, 200, result);
      }
      if (url.pathname === "/api/behavior-stream" && request.method === "POST") {
        verifyBehaviorStreamKey(request);
        const body = await readJsonBody(request);
        const result = webBloombergStore.ingest(body, {
          url: body.url || body.targetUrl || "",
          site_id: body.site_id || "",
          page_id: body.page_id || "",
          client_segment: body.client_segment || "direct-api"
        });
        broadcastDiagnostics({ ok: true, kind: "web-bloomberg-update", terminal: result.terminal, status: result.status });
        return json(response, result.rejected ? 207 : 200, result);
      }
      if (url.pathname === "/api/behavior-stream/status" && request.method === "GET") {
        return json(response, 200, webBloombergStore.status());
      }
      if (url.pathname === "/api/web-bloomberg/terminal" && request.method === "GET") {
        return json(response, 200, webBloombergStore.terminal({
          site_id: url.searchParams.get("site_id") || "",
          page_id: url.searchParams.get("page_id") || "",
          window: url.searchParams.get("window") || ""
        }));
      }
      if (url.pathname === "/api/web-bloomberg/export" && request.method === "GET") {
        return json(response, 200, webBloombergStore.export());
      }
      if (url.pathname === "/api/runtime-diagnostics/export" && request.method === "GET") {
        return json(response, 200, buildStandaloneExportPayload());
      }
      if (url.pathname === "/api/runtime-diagnostics/stream" && request.method === "GET") {
        return openDiagnosticsStream(request, response);
      }
      if (url.pathname === "/api/runtime-diagnostics/ingest" && request.method === "POST") {
        const body = await readJsonBody(request);
        const result = ingestBatchedDiagnostics(body);
        attachWebBloombergModel(result);
        rememberStandaloneDiagnostics(result);
        return json(response, 200, { ok: true, acceptedAt: result.analyzedAt, factCount: result.diagnostics.runtimeFactHistory.length });
      }
      if (url.pathname === "/api/runtime-diagnostics/clear" && request.method === "POST") {
        const cleared = {
          hadLatest: Boolean(standaloneDiagnosticsStore.latest),
          historyCount: standaloneDiagnosticsStore.history.length
        };
        standaloneDiagnosticsStore.latest = null;
        standaloneDiagnosticsStore.history = [];
        webBloombergStore.clear();
        broadcastDiagnostics({ ok: true, kind: "runtime-diagnostics-cleared", clearedAt: new Date().toISOString() });
        return json(response, 200, { ok: true, clearedAt: new Date().toISOString(), cleared });
      }
      if (url.pathname === "/api/rankings/crawler/status" && request.method === "GET") {
        return json(response, 200, rankingCrawler.status());
      }
      if (url.pathname === "/api/rankings/crawler/start" && request.method === "POST") {
        const body = await readJsonBody(request);
        return json(response, 200, rankingCrawler.start(body));
      }
      if (url.pathname === "/api/rankings/crawler/stop" && request.method === "POST") {
        return json(response, 200, rankingCrawler.stop());
      }
      if (url.pathname === "/api/rankings/crawler/run-once" && request.method === "POST") {
        const body = await readJsonBody(request).catch(() => ({}));
        return json(response, 200, await rankingCrawler.runOnce(body));
      }
      if (url.pathname === "/api/rankings/crawler/results" && request.method === "GET") {
        return json(response, 200, rankingCrawler.results());
      }
      if (url.pathname === "/api/billing/status" && request.method === "GET") {
        const account = accountFromRequest(request);
        return json(response, 200, { ok: true, billing: billingStatus(process.env, account), entitlements: accountEntitlements(account) });
      }
      if (url.pathname === "/api/billing/checkout" && request.method === "POST") {
        const body = await readJsonBody(request);
        const account = accountFromRequest(request, body);
        const session = await createCheckoutSession(body, account);
        return json(response, 200, { ok: true, ...session });
      }
      if (url.pathname === "/api/billing/portal" && request.method === "POST") {
        return json(response, 200, { ok: true, url: portalUrl() });
      }
      if (url.pathname === "/api/billing/webhook" && request.method === "POST") {
        const rawBody = await readRawBody(request);
        const event = verifyAuthorizeNetWebhook(rawBody, request.headers["x-anet-signature"] || "");
        const patch = entitlementsFromAuthorizeNetEvent(event);
        if (patch.email) {
          const current = accountEntitlementStore.get(patch.email) || { email: patch.email };
          accountEntitlementStore.set(patch.email, mergeEntitlementPatch(current, patch));
        }
        return json(response, 200, { ok: true, received: true, type: event.type || "unknown" });
      }
      if (url.pathname === "/api/account/entitlements" && request.method === "GET") {
        const account = accountFromRequest(request);
        return json(response, 200, { ok: true, entitlements: accountEntitlements(account), account: publicAccount(account) });
      }
      if (url.pathname === "/api/secure-browser/close" && request.method === "POST") {
        const result = await visaSecureBrowser.close();
        return json(response, 200, result);
      }
      if (url.pathname === "/api/runtime-browser/close" && request.method === "POST") {
        const result = await runtimeDiagnosticsBrowser.close();
        return json(response, 200, result);
      }
      await serveStatic(url.pathname, response);
    } catch (error) {
      json(response, error.status || 500, {
        ok: false,
        error: sanitizeOperationalText(error.message || String(error)),
        code: error.code || "RUNTIME_DIAGNOSTICS_ERROR"
      });
    }
  });
  server.on("close", () => {
    visaMonitor.stop();
    visaSecureBrowser.close().catch(() => {});
    runtimeDiagnosticsBrowser.close().catch(() => {});
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolveListen);
  });
  console.log(`Organ9 Runtime Diagnostics: http://${displayHost}:${port} listening on ${host}`);
  return { server, host, port, url: `http://${displayHost}:${port}` };
}

export function buildStandaloneExportPayload(store = standaloneDiagnosticsStore) {
  const latest = store.latest || null;
  const history = Array.isArray(store.history) ? store.history : [];
  const latestDiagnostics = latest?.diagnostics || {};
  const channels = latestDiagnostics.runtimeFactChannels || {};
  const factHistory = latestDiagnostics.runtimeFactHistory || [];
  const factsLayer = buildFactsLayerModel(factHistory.map(fact => ({
    channel: fact.channel || `${fact.source || "runtime"}/${fact.type || "fact"}`,
    fact
  })));
  const intelligenceLayer = buildIntelligenceLayerModel(factHistory, latestDiagnostics.webBloombergTerminal?.windows || []);
  const automationLayer = buildAutomationLayerModel(intelligenceLayer.msu || []);
  const packageSuite = latestDiagnostics.organFrequencySpectrumLatest?.commercialPackages ||
    latestDiagnostics.organFrequencySpectrumState?.commercialPackages ||
    {};
  return {
    ok: true,
    exportedAt: new Date().toISOString(),
    kind: "standalone-runtime-diagnostics",
    summary: {
      empty: !latest && history.length === 0,
      latestFactCount: factHistory.length,
      latestChannelCount: Object.keys(channels).length,
      historyCount: history.length,
      packageCount: packageSuite.packages?.length || 0,
      activePackages: packageSuite.summary?.activePackages || 0,
      fallbackUsed: Boolean(latest?.fallback?.used),
      webBloomberg: webBloombergStore.status()
    },
    exportPolicy: {
      latestFactLimit: MAX_LATEST_FACTS,
      historyLimit: MAX_STANDALONE_HISTORY,
      historyFactLimit: MAX_HISTORY_FACTS,
      channelFactLimit: MAX_CHANNEL_FACTS
    },
    factsLayer,
    intelligenceLayer,
    automationLayer,
    latest,
    history,
    webBloomberg: webBloombergStore.export()
  };
}

export function buildOperationalStatus({ runtimeDiagnosticsBrowser, visaSecureBrowser, visaMonitor, host = "127.0.0.1", port = 0 } = {}) {
  const billing = billingStatus();
  const runtime = buildRuntimeDiagnosticsStatus({ runtimeDiagnosticsBrowser, host, port });
  const visa = visaMonitor?.status?.() || { ok: true, running: false };
  const visaBrowser = safeBrowserStatus(visaSecureBrowser, "visa-secure-browser");
  const warnings = [
    billing.configured ? "" : "Authorize.Net Accept Hosted checkout is not configured; package selection runs in sandbox preview mode.",
    runtime.latest ? "" : "No runtime diagnostics sample has been collected yet.",
    runtime.browser?.lastError ? `Runtime browser warning: ${runtime.browser.lastError}` : "",
    visa.lastError ? `Visa monitor warning: ${sanitizeOperationalText(visa.lastError)}` : ""
  ].filter(Boolean);
  return {
    ok: true,
    service: "organ9-runtime-diagnostics",
    version: "3.3.0",
    checkedAt: new Date().toISOString(),
    url: `http://${host}:${port}`,
    mode: "standalone-commercial-ui",
    health: warnings.length ? "degraded" : "healthy",
    warnings,
    runtimeDiagnostics: runtime,
    webBloomberg: webBloombergStore.status(),
    billing: {
      provider: billing.provider,
      configured: billing.configured,
      planCount: billing.plans.length,
      moduleCount: billing.modules.length,
      addonCount: billing.addons.length,
      packageCount: billing.modules.length,
      sellableItemCount: billing.plans.length + billing.modules.length + billing.addons.length,
      configuredPackages: [...billing.plans, ...billing.modules, ...billing.addons].filter(plan => plan.available).length
    },
    visaMonitor: {
      running: Boolean(visa.running),
      lastError: sanitizeOperationalText(visa.lastError || ""),
      secureBrowserOpen: Boolean(visaBrowser.open)
    }
  };
}

export function buildRuntimeDiagnosticsStatus({ runtimeDiagnosticsBrowser, host = "127.0.0.1", port = 0 } = {}) {
  const browser = safeBrowserStatus(runtimeDiagnosticsBrowser, "runtime-diagnostics-browser");
  const latest = standaloneDiagnosticsStore.latest;
  const latestDiagnostics = latest?.diagnostics || {};
  const spectrum = latestDiagnostics.organFrequencySpectrumLatest || latestDiagnostics.organFrequencySpectrumState || {};
  const packageSuite = spectrum.commercialPackages || {};
  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    url: `http://${host}:${port}`,
    streamClients: diagnosticsStreamClients.size,
    historyCount: standaloneDiagnosticsStore.history.length,
    browser,
    latest: latest ? {
      analyzedAt: latest.analyzedAt,
      requestedUrl: latest.requestedUrl,
      finalUrl: latest.finalUrl,
      fallbackUsed: Boolean(latest.fallback?.used),
      factCount: latestDiagnostics.runtimeFactHistory?.length || 0,
      channelCount: Object.keys(latestDiagnostics.runtimeFactChannels || {}).length,
      packageCount: packageSuite.packages?.length || 0,
      activePackages: packageSuite.summary?.activePackages || 0,
      spectraCount: Object.keys(latestDiagnostics.organFrequencySpectrumState?.spectra || spectrum.spectra || {}).length
    } : null,
    storagePolicy: {
      latestFactLimit: MAX_LATEST_FACTS,
      historyLimit: MAX_STANDALONE_HISTORY,
      historyFactLimit: MAX_HISTORY_FACTS,
      channelFactLimit: MAX_CHANNEL_FACTS
    }
  };
}

export function sanitizeBrowserStatus(status = {}) {
  return {
    ok: status.ok !== false,
    state: sanitizeOperationalText(status.state || ""),
    pageUrl: sanitizeOperationalUrl(status.pageUrl || status.currentUrl || ""),
    pageCount: Number(status.pageCount) || 0,
    lastOpenedAt: status.lastOpenedAt || null,
    lastError: sanitizeOperationalText(status.lastError || ""),
    hasResult: Boolean(status.hasResult)
  };
}

function safeBrowserStatus(runtime, label = "runtime-browser") {
  try {
    return sanitizeBrowserStatus(runtime?.status?.() || {});
  } catch (error) {
    return sanitizeBrowserStatus({
      ok: true,
      state: "secure_browser_closed",
      pageUrl: "",
      pageCount: 0,
      lastError: `${label} was closed; it will relaunch automatically on the next analysis. ${error.message || String(error)}`,
      hasResult: false
    });
  }
}

function sanitizeOperationalText(value) {
  return String(value || "")
    .replace(/https?:\/\/[^\s)]+/gi, match => sanitizeOperationalUrl(match))
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(token|secret|password|authorization|credential|cookie|session)=([^\s&]+)/gi, "$1=[redacted]")
    .slice(0, 220);
}

function sanitizeOperationalUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

export async function analyzeRuntimeTarget(runtimeDiagnosticsBrowser, rawUrl, options = {}) {
  validateRuntimeTargetUrl(rawUrl, options);
  try {
    const rendered = await runtimeDiagnosticsBrowser.analyze(rawUrl);
    if (hasRuntimeFacts(rendered)) return rendered;
    const fallback = await analyzeUrl(rawUrl);
    return markStructuralFallback(fallback, new Error("Rendered browser inspection returned no runtime facts after sampling."));
  } catch (renderedError) {
    const fallback = await analyzeUrl(rawUrl).catch(fallbackError => {
      const error = httpError(
        renderedError.status || fallbackError.status || 500,
        `Rendered inspection failed (${sanitizeOperationalText(renderedError.message || String(renderedError))}). Structural fallback also failed (${sanitizeOperationalText(fallbackError.message || String(fallbackError))}).`,
        "RUNTIME_RENDERED_AND_FALLBACK_FAILED"
      );
      error.renderedError = renderedError;
      error.fallbackError = fallbackError;
      throw error;
    });
    return markStructuralFallback(fallback, renderedError);
  }
}

function hasRuntimeFacts(result = {}) {
  return Boolean(result?.diagnostics?.runtimeFactHistory?.length) ||
    Object.values(result?.diagnostics?.runtimeFactChannels || {}).some(items => Array.isArray(items) && items.length);
}

function markStructuralFallback(result, renderedError) {
  const renderedReason = sanitizeOperationalText(renderedError?.message || renderedError || "");
  const message = `Rendered browser inspection was unavailable, so Runtime Diagnostics used structural URL analysis instead. Rendered issue: ${renderedReason}`;
  const status = {
    ...(result.status || result.diagnostics?.runtimeFactStatus || {}),
    state: "structural_fallback_analyzed",
    message,
    severity: result.status?.severity === "high" ? "high" : "medium",
    channel: "runtime/structural-fallback"
  };
  const fallbackFact = {
    timestamp: Date.now(),
    source: "runtime",
    type: "structural-fallback",
    value: {
      severity: "medium",
      message,
      renderedError: renderedReason
    },
    metadata: { fallback: "standalone-url-analysis" },
    context: {
      pageUrl: sanitizeIngestedUrl(result.finalUrl || result.requestedUrl || ""),
      collectorVersion: "standalone-server-v1"
    }
  };
  const diagnostics = result.diagnostics || {};
  const channels = {
    ...(diagnostics.runtimeFactChannels || {}),
    "runtime/structural-fallback": [fallbackFact]
  };
  return {
    ...result,
    status,
    fallback: {
      used: true,
      reason: renderedReason,
      mode: "structural-url-analysis"
    },
    diagnostics: {
      ...diagnostics,
      runtimeFactStatus: status,
      runtimeFactChannels: channels,
      runtimeFactHistory: [fallbackFact, ...(diagnostics.runtimeFactHistory || [])].slice(0, 160)
    }
  };
}

function attachWebBloombergModel(result = {}) {
  const diagnostics = result.diagnostics || {};
  const facts = diagnostics.runtimeFactHistory || [];
  const directWindows = facts
    .filter(fact => fact.source === "web_bloomberg" && fact.type === "behavior-window")
    .map(fact => fact.value?.window || fact.value || fact.payload?.value?.window)
    .filter(Boolean);
  const derivedWindows = directWindows.length ? [] : deriveBehaviorWindowsFromFacts(facts, {
    url: result.finalUrl || result.requestedUrl || ""
  });
  const ingestResult = webBloombergStore.ingest({
    url: result.finalUrl || result.requestedUrl || "",
    windows: [...directWindows, ...derivedWindows]
  }, { url: result.finalUrl || result.requestedUrl || "", client_segment: "runtime-diagnostics" });
  result.webBloomberg = {
    status: ingestResult.status,
    terminal: ingestResult.terminal,
    accepted: ingestResult.accepted,
    rejected: ingestResult.rejected,
    errors: ingestResult.errors
  };
  result.diagnostics = {
    ...diagnostics,
    webBloombergTerminal: ingestResult.terminal,
    webBloombergStatus: ingestResult.status
  };
  return result;
}

export function validateRuntimeTargetUrl(rawUrl, options = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw httpError(400, "Enter a valid HTTP or HTTPS URL.", "RUNTIME_TARGET_INVALID_URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw httpError(400, "Only HTTP and HTTPS websites can be analyzed.", "RUNTIME_TARGET_UNSUPPORTED_PROTOCOL");
  }
  if (isLocalRuntimeAppUrl(url, options.localAppOrigins || [])) {
    throw httpError(400, "Runtime Diagnostics will not analyze its own local application page. Enter an external website URL.", "RUNTIME_TARGET_SELF_APP");
  }
  return url;
}

function isLocalRuntimeAppUrl(url, localAppOrigins = []) {
  const ownOrigins = new Set(localAppOrigins.map(origin => {
    try { return new URL(origin).origin; } catch { return ""; }
  }).filter(Boolean));
  if (!ownOrigins.has(url.origin)) return false;
  return [
    "/",
    "/runtime-diagnostics.html",
    "/visa-monitor.html",
    "/options.html"
  ].includes(url.pathname);
}

function rememberStandaloneDiagnostics(result) {
  const latest = compactDiagnosticsResult(result, { factLimit: MAX_LATEST_FACTS, channelFactLimit: MAX_CHANNEL_FACTS });
  const historyItem = compactDiagnosticsResult(result, { factLimit: MAX_HISTORY_FACTS, channelFactLimit: MAX_CHANNEL_FACTS });
  standaloneDiagnosticsStore.latest = latest;
  standaloneDiagnosticsStore.history = [historyItem, ...standaloneDiagnosticsStore.history].slice(0, MAX_STANDALONE_HISTORY);
  broadcastDiagnostics({
    ok: true,
    kind: "runtime-diagnostics-update",
    result: compactDiagnosticsResult(result, { factLimit: MAX_STREAM_FACTS, channelFactLimit: MAX_CHANNEL_FACTS })
  });
}

function openDiagnosticsStream(request, response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });
  response.flushHeaders?.();
  response.write(`event: ready\ndata: ${JSON.stringify({ ok: true, latest: standaloneDiagnosticsStore.latest })}\n\n`);
  const heartbeat = setInterval(() => {
    try { response.write(`event: heartbeat\ndata: ${JSON.stringify({ ok: true, at: new Date().toISOString() })}\n\n`); }
    catch { clearInterval(heartbeat); diagnosticsStreamClients.delete(response); }
  }, 15000);
  diagnosticsStreamClients.add(response);
  request.on("close", () => {
    clearInterval(heartbeat);
    diagnosticsStreamClients.delete(response);
  });
}

function broadcastDiagnostics(payload) {
  const message = `event: diagnostics\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of [...diagnosticsStreamClients]) {
    try { client.write(message); } catch { diagnosticsStreamClients.delete(client); }
  }
}

export function compactDiagnosticsResult(result = {}, options = {}) {
  const factLimit = Math.max(0, Number(options.factLimit) || MAX_HISTORY_FACTS);
  const channelFactLimit = Math.max(0, Number(options.channelFactLimit) || MAX_CHANNEL_FACTS);
  const diagnostics = result.diagnostics || {};
  const channels = compactRuntimeFactChannels(diagnostics.runtimeFactChannels || {}, channelFactLimit);
  const factHistory = (diagnostics.runtimeFactHistory || [])
    .slice(0, factLimit)
    .map(sanitizeIngestedFact)
    .filter(Boolean);
  return {
    ok: result.ok !== false,
    analyzedAt: result.analyzedAt || new Date().toISOString(),
    requestedUrl: sanitizeIngestedUrl(result.requestedUrl || ""),
    finalUrl: sanitizeIngestedUrl(result.finalUrl || result.requestedUrl || ""),
    status: sanitizeRuntimeStatus(result.status || diagnostics.runtimeFactStatus || {}),
    fallback: result.fallback ? {
      used: Boolean(result.fallback.used),
      reason: sanitizeOperationalText(result.fallback.reason || ""),
      mode: sanitizeOperationalText(result.fallback.mode || "")
    } : undefined,
    diagnostics: {
      runtimeFactChannels: channels,
      runtimeFactHistory: factHistory,
      runtimeFactStatus: sanitizeRuntimeStatus(diagnostics.runtimeFactStatus || result.status || {}),
      runtimeLayerCoverage: sanitizeRuntimeLikeValue(diagnostics.runtimeLayerCoverage || {}),
      crawlerSignalHistory: (diagnostics.crawlerSignalHistory || []).slice(0, 20).map(sanitizeRuntimeLikeValue),
      crawlerSignalStatus: sanitizeRuntimeStatus(diagnostics.crawlerSignalStatus || {}),
      organFrequencySpectrumState: sanitizeRuntimeLikeValue(diagnostics.organFrequencySpectrumState || {}),
      organFrequencySpectrumLatest: sanitizeRuntimeLikeValue(diagnostics.organFrequencySpectrumLatest || {})
    },
    compacted: true,
    limits: {
      factLimit,
      channelFactLimit
    }
  };
}

function compactRuntimeFactChannels(channels, limit) {
  const entries = Object.entries(channels)
    .slice(0, 80)
    .map(([channel, facts]) => [
      String(channel).slice(0, 160),
      (Array.isArray(facts) ? facts : []).slice(0, limit).map(sanitizeIngestedFact).filter(Boolean)
    ]);
  return Object.fromEntries(entries);
}

function sanitizeRuntimeStatus(status = {}) {
  if (!status || typeof status !== "object") return {};
  return sanitizeRuntimeLikeValue({
    state: status.state || "",
    message: status.message || "",
    checkedAt: status.checkedAt || status.timestamp || "",
    host: status.host || "",
    path: status.path || "",
    severity: status.severity || "low",
    channel: status.channel || "",
    fact: status.fact || null
  });
}

function ingestBatchedDiagnostics(body = {}) {
  const facts = Array.isArray(body.facts) ? body.facts.slice(0, MAX_INGEST_FACTS).map(sanitizeIngestedFact).filter(Boolean) : [];
  const analyzedAt = new Date().toISOString();
  const requestedUrl = sanitizeIngestedUrl(body.url || body.requestedUrl || "");
  const finalUrl = sanitizeIngestedUrl(body.finalUrl || requestedUrl);
  const runtimeFactChannels = {};
  for (const fact of facts) {
    const channel = `${fact.source}/${fact.type}`;
    runtimeFactChannels[channel] = [fact, ...(runtimeFactChannels[channel] || [])].slice(0, 120);
  }
  const spectrum = buildServerSpectrum(facts);
  const status = {
    state: facts.length ? "batched_runtime_ingested" : "batched_runtime_empty",
    message: facts.length ? `Accepted ${facts.length} batched runtime facts.` : "No facts were accepted.",
    checkedAt: analyzedAt,
    host: hostFromUrl(finalUrl),
    severity: facts.some(fact => fact.value?.severity === "high") ? "high" : facts.some(fact => fact.value?.severity === "medium") ? "medium" : "low",
    channel: facts[0] ? `${facts[0].source}/${facts[0].type}` : "batch/none",
    fact: facts[0] || null
  };
  return {
    ok: true,
    analyzedAt,
    requestedUrl,
    finalUrl,
    status,
    diagnostics: {
      runtimeFactChannels,
      runtimeFactHistory: facts,
      runtimeFactStatus: status,
      organFrequencySpectrumState: spectrum,
      organFrequencySpectrumLatest: {
        checkedAt: analyzedAt,
        windowMs: spectrum.windowMs,
        closure: spectrum.closure,
        products: spectrum.products,
        commercialPackages: spectrum.commercialPackages
      }
    }
  };
}

function buildServerSpectrum(facts) {
  const engine = new globalThis.TicketSniperOrganFrequency.OrganFrequencySpectrumEngine({}, { windowMs: 100 });
  engine.ingestMany(facts, { source: "standalone-ingest" });
  return engine.snapshot();
}

function sanitizeIngestedFact(fact = {}) {
  if (!fact || typeof fact !== "object") return null;
  return {
    timestamp: Number(fact.timestamp) || Date.now(),
    source: String(fact.source || "runtime").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "runtime",
    type: String(fact.type || "fact").replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || "fact",
    channel: String(fact.channel || `${fact.source || "runtime"}/${fact.type || "fact"}`).slice(0, 160),
    runtimeLayer: sanitizeRuntimeLikeValue(fact.runtimeLayer || {}),
    organ: String(fact.organ || "").slice(0, 60),
    severity: String(fact.severity || fact.value?.severity || "low").slice(0, 20),
    confidence: Number.isFinite(Number(fact.confidence)) ? Math.max(0, Math.min(1, Number(fact.confidence))) : undefined,
    captureMode: String(fact.captureMode || "").slice(0, 80),
    payload: sanitizeRuntimeLikeValue(fact.payload || {}),
    value: sanitizeRuntimeLikeValue(fact.value || {}),
    metadata: sanitizeRuntimeLikeValue(fact.metadata || {}),
    context: sanitizeRuntimeLikeValue(fact.context || {})
  };
}

function sanitizeRuntimeLikeValue(value) {
  if (Array.isArray(value)) return value.slice(0, 40).map(sanitizeRuntimeLikeValue);
  if (!value || typeof value !== "object") return typeof value === "string" ? sanitizeOperationalText(value).slice(0, 300) : value;
  return Object.fromEntries(Object.entries(value).slice(0, 60).map(([key, raw]) => {
    if (/cookie|token|password|secret|authorization|credential|session|email|phone|passport/i.test(key)) return [key, "[redacted]"];
    return [key, sanitizeRuntimeLikeValue(raw)];
  }));
}

function sanitizeIngestedUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

function hostFromUrl(value) {
  try { return new URL(value).hostname; } catch { return ""; }
}

function createVisaMonitorSession(browser) {
  const state = {
    running: false,
    timer: null,
    intervalMs: 5000,
    inFlight: false,
    targetUrl: "",
    consulate: "",
    cutoffDate: "",
    lastResult: null,
    lastError: "",
    lastCheckedAt: 0,
    baselineSignature: "",
    events: []
  };

  async function start(options = {}) {
    state.targetUrl = normalizeOfficialVisaUrl(options.url || "");
    state.consulate = String(options.consulate || "").trim();
    state.cutoffDate = String(options.cutoffDate || "").trim();
    state.intervalMs = clampIntervalMs(options.intervalMs || Number(options.intervalSeconds) * 1000 || 5000);
    state.running = true;
    state.lastError = "";
    scheduleNext(0);
    return status();
  }

  function stop() {
    state.running = false;
    clearTimeout(state.timer);
    state.timer = null;
    state.inFlight = false;
    return status();
  }

  function status() {
    return {
      ok: true,
      running: state.running,
      intervalMs: state.intervalMs,
      targetUrl: state.targetUrl,
      consulate: state.consulate,
      cutoffDate: state.cutoffDate,
      lastResult: state.lastResult,
      lastError: state.lastError,
      lastCheckedAt: state.lastCheckedAt,
      events: state.events.slice(0, 25),
      secureBrowser: browser.status()
    };
  }

  function scheduleNext(delay = state.intervalMs) {
    clearTimeout(state.timer);
    if (!state.running) return;
    state.timer = setTimeout(() => runOnce().catch(() => {}), Math.max(0, delay));
  }

  async function runOnce() {
    if (!state.running || state.inFlight) return scheduleNext(state.intervalMs);
    state.inFlight = true;
    try {
      const result = await browser.analyze("");
      if (!isOfficialVisaResult(result)) throw httpError(400, "The secure browser is not on an official visa scheduling or official visa login page.");
      state.lastResult = result;
      state.lastCheckedAt = Date.now();
      state.lastError = "";
      evaluateVisaMonitorEvents(result);
    } catch (error) {
      state.lastError = error.message || String(error);
    } finally {
      state.inFlight = false;
      scheduleNext(state.intervalMs);
    }
  }

  function evaluateVisaMonitorEvents(result) {
    if (!matchesConsulateFilter(result, state.consulate)) return;
    const earlier = findEarlierAppointmentDate(result, state.cutoffDate);
    if (earlier) {
      pushEvent({
        kind: "earlier-date",
        severity: "high",
        title: "Earlier visa appointment found",
        message: `${earlier.key} is earlier than ${state.cutoffDate}. Source: ${earlier.source}.`,
        key: `earlier:${monitorTargetKey(result, state.consulate)}:${earlier.key}`
      });
    }
    const signature = buildStructuralSignature(result);
    if (!signature) return;
    if (!state.baselineSignature) {
      state.baselineSignature = signature;
      return;
    }
    if (state.baselineSignature !== signature) {
      state.baselineSignature = signature;
      pushEvent({
        kind: "structural-change",
        severity: "medium",
        title: "Visa page structure changed",
        message: "A structural change was detected in the authenticated visa page.",
        key: `structure:${monitorTargetKey(result, state.consulate)}:${signature}`
      });
    }
  }

  function pushEvent(event) {
    const next = { ...event, timestamp: Date.now() };
    if (state.events.some(item => item.key === next.key)) return;
    state.events = [next, ...state.events].slice(0, 80);
  }

  return { start, stop, status };
}

function createRankingCrawler() {
  const state = {
    running: false,
    timer: null,
    queue: [],
    cursor: 0,
    intervalMs: 90000,
    batchSize: 3,
    inFlight: false,
    startedAt: "",
    lastRunAt: "",
    lastError: "",
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    results: []
  };

  function start(options = {}) {
    const urls = normalizeCrawlerUrls(options.urls || []);
    if (urls.length) state.queue = urls;
    if (!state.queue.length) throw httpError(400, "Ranking crawler needs at least one HTTP or HTTPS URL.");
    state.intervalMs = clampCrawlerInterval(options.intervalMs || options.interval || state.intervalMs);
    state.batchSize = clampCrawlerBatchSize(options.batchSize || state.batchSize);
    state.running = true;
    state.startedAt = state.startedAt || new Date().toISOString();
    state.lastError = "";
    schedule(state.intervalMs);
    return status();
  }

  function stop() {
    state.running = false;
    clearTimeout(state.timer);
    state.timer = null;
    return status();
  }

  async function runOnce(options = {}) {
    const urls = normalizeCrawlerUrls(options.urls || []);
    if (urls.length) state.queue = urls;
    if (!state.queue.length) throw httpError(400, "Ranking crawler needs at least one HTTP or HTTPS URL.");
    const batchSize = clampCrawlerBatchSize(options.batchSize || state.batchSize);
    return await runBatch(batchSize, { manual: true });
  }

  function results() {
    return {
      ok: true,
      crawler: status().crawler,
      results: state.results.slice(0, 500)
    };
  }

  function status() {
    return {
      ok: true,
      crawler: {
        running: state.running,
        queueSize: state.queue.length,
        cursor: state.cursor,
        intervalMs: state.intervalMs,
        batchSize: state.batchSize,
        inFlight: state.inFlight,
        startedAt: state.startedAt,
        lastRunAt: state.lastRunAt,
        lastError: state.lastError,
        runCount: state.runCount,
        successCount: state.successCount,
        failureCount: state.failureCount,
        resultCount: state.results.length,
        nextUrl: state.queue.length ? state.queue[state.cursor % state.queue.length] : ""
      }
    };
  }

  function schedule(delay = state.intervalMs) {
    clearTimeout(state.timer);
    if (!state.running) return;
    state.timer = setTimeout(() => {
      runBatch(state.batchSize).catch(error => {
        state.lastError = sanitizeOperationalText(error.message || String(error));
      }).finally(() => schedule(state.intervalMs));
    }, Math.max(0, delay));
  }

  async function runBatch(batchSize, options = {}) {
    if (state.inFlight) return { ok: true, skipped: true, reason: "crawler already running", crawler: status().crawler, results: [] };
    state.inFlight = true;
    state.runCount += 1;
    state.lastRunAt = new Date().toISOString();
    const batch = nextCrawlerBatch(batchSize);
    const results = [];
    try {
      for (const url of batch) {
        try {
          const result = await analyzeUrl(url);
          const sample = buildCrawlerRankingSample(result, options.manual ? "manual-crawler-sample" : "scheduled-crawler-sample");
          state.successCount += 1;
          state.results = [sample, ...state.results.filter(item => item.id !== sample.id)].slice(0, 1000);
          results.push(sample);
        } catch (error) {
          state.failureCount += 1;
          state.lastError = sanitizeOperationalText(error.message || String(error));
          results.push({
            id: hashString(url),
            url,
            host: hostFromUrl(url),
            ok: false,
            sourceLabel: "Crawler error",
            error: state.lastError,
            analyzedAt: new Date().toISOString()
          });
        }
      }
      return { ok: true, crawler: status().crawler, results };
    } finally {
      state.inFlight = false;
    }
  }

  function nextCrawlerBatch(batchSize) {
    const batch = [];
    for (let index = 0; index < Math.min(batchSize, state.queue.length); index += 1) {
      batch.push(state.queue[state.cursor % state.queue.length]);
      state.cursor = (state.cursor + 1) % state.queue.length;
    }
    return batch;
  }

  return { start, stop, runOnce, results, status };
}

function buildCrawlerRankingSample(result, sourceLabel) {
  const diagnostics = result.diagnostics || {};
  const spectrum = diagnostics.organFrequencySpectrumLatest || diagnostics.organFrequencySpectrumState || {};
  const packages = spectrum.commercialPackages?.packages || [];
  const scores = Object.fromEntries(packages.map(item => [normalizeCrawlerPackageId(item.id || item.name), clamp01(Number(item.score) || 0)]));
  const host = hostFromUrl(result.finalUrl || result.requestedUrl || "") || result.status?.host || "unknown";
  const facts = diagnostics.runtimeFactHistory || [];
  const high = facts.filter(fact => fact.value?.severity === "high").length;
  const medium = facts.filter(fact => fact.value?.severity === "medium").length;
  const channels = Object.keys(diagnostics.runtimeFactChannels || {}).length;
  return {
    id: normalizeCrawlerRankingId(host),
    ok: true,
    host,
    url: result.finalUrl || result.requestedUrl || "",
    category: "Crawler-collected runtime sample",
    sourceLabel,
    sourceKind: "local-scheduled-crawler",
    sampleCount: 1,
    confidence: Math.min(.96, .45 + Math.min(1, facts.length / 120) * .45),
    packageScores: scores,
    evidence: Object.fromEntries(packages.map(item => [normalizeCrawlerPackageId(item.id || item.name), item.evidence || []])),
    normal: {
      health: high ? "Needs attention" : medium ? "Watch closely" : facts.length ? "Stable enough" : "No facts",
      healthDetail: `${facts.length} crawler facts across ${channels} channels.`,
      change: result.status?.channel || "Crawler sample",
      changeDetail: result.status?.message || "Scheduled crawler sample collected.",
      pressure: facts.filter(fact => /performance|network|resource|layout/.test(`${fact.source}/${fact.type}`)).length > 8 ? "Moderate" : "Low",
      pressureDetail: "Pressure is estimated from fetched markup, resource maps, protection signals, and rendered facts when available.",
      action: high ? "Review paid evidence" : "Compare ranking",
      actionDetail: "Crawler sample can be merged into the local ranking ledger."
    },
    factCount: facts.length,
    channelCount: channels,
    lastAnalyzedAt: result.analyzedAt || new Date().toISOString()
  };
}

function normalizeCrawlerUrls(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map(value => {
      try {
        const url = new URL(String(value || "").trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return "";
        return url.href;
      } catch {
        return "";
      }
    })
    .filter(Boolean))].slice(0, 500);
}

function clampCrawlerInterval(value) {
  return Math.min(24 * 60 * 60 * 1000, Math.max(15000, Number(value) || 90000));
}

function clampCrawlerBatchSize(value) {
  return Math.min(10, Math.max(1, Number(value) || 3));
}

function normalizeCrawlerRankingId(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "-") || "unknown-site";
}

function normalizeCrawlerPackageId(value) {
  const text = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const aliases = {
    "structure-monitor": "structure-monitor",
    "performance-spectrum": "performance-spectrum",
    "update-radar": "update-radar",
    "risk-score-engine": "risk-score-engine",
    "ai-activity-detector": "ai-activity-detector"
  };
  return aliases[text] || text;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clampIntervalMs(value) {
  const ms = Number(value) || 5000;
  return Math.min(300000, Math.max(1000, ms));
}

function normalizeOfficialVisaUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let url;
  try { url = new URL(raw); } catch { throw httpError(400, "Enter a valid HTTP or HTTPS visa URL."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw httpError(400, "Only HTTP and HTTPS URLs can be monitored.");
  if (!isOfficialVisaUrl(url.href)) throw httpError(400, "Visa Monitor only accepts official visa scheduling or official visa login URLs.");
  return url.href;
}

function isOfficialVisaResult(result) {
  return isOfficialVisaUrl(result?.finalUrl) || isOfficialVisaUrl(result?.requestedUrl);
}

function isOfficialVisaUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ["usvisascheduling.com", "atlasauth.b2clogin.com", "ais.usvisa-info.com", "ustraveldocs.com", "cgifederal.secure.force.com"]
      .some(official => host === official || host.endsWith(`.${official}`));
  } catch {
    return false;
  }
}

function flattenFacts(result) {
  return Object.values(result?.diagnostics?.runtimeFactChannels || {}).flat();
}

function findRenderedSnapshot(result) {
  return flattenFacts(result).find(fact => fact.source === "browser" && fact.type === "rendered-dom-snapshot")?.value || {};
}

function matchesConsulateFilter(result, requestedConsulate) {
  const requested = normalizeText(requestedConsulate);
  if (!requested) return true;
  const renderedConsulate = findRenderedSnapshot(result).consulate || "";
  return !renderedConsulate || normalizeText(renderedConsulate).includes(requested);
}

function findEarlierAppointmentDate(result, cutoffDate) {
  const cutoff = parseDateOnly(cutoffDate);
  if (!cutoff) return null;
  const candidates = collectDateCandidates(result)
    .map(candidate => ({ ...candidate, date: parseLooseDate(candidate.text) }))
    .filter(candidate => candidate.date && candidate.date.getTime() < cutoff.getTime())
    .sort((left, right) => left.date - right.date);
  const earliest = candidates[0];
  return earliest ? { ...earliest, key: dayKey(earliest.date) } : null;
}

function collectDateCandidates(result) {
  const candidates = [];
  for (const fact of flattenFacts(result)) {
    if (fact.type === "calendar-structure") {
      for (const text of fact.value?.dateCandidates || []) candidates.push({ text, source: "calendar markup" });
    }
    if (fact.source === "browser" && fact.type === "rendered-dom-snapshot") {
      for (const item of fact.value?.availableDates || []) {
        if (item?.text) candidates.push({ text: item.text, source: "rendered calendar" });
        if (item?.label) candidates.push({ text: item.label, source: "rendered calendar label" });
      }
    }
  }
  const seen = new Set();
  return candidates.filter(candidate => {
    const key = String(candidate.text || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseLooseDate(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const iso = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(text);
  if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const us = /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(text);
  if (us) return validDate(Number(us[3]), Number(us[1]), Number(us[2]));
  const header = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\s+(\d{1,2})/i.exec(text);
  if (header) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    return validDate(Number(header[2]), months.indexOf(header[1].slice(0, 3).toLowerCase()) + 1, Number(header[3]));
  }
  const month = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,\s*)?(\d{4})?/i.exec(text);
  if (month) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const year = Number(month[3]) || new Date().getFullYear();
    return validDate(year, months.indexOf(month[1].slice(0, 3).toLowerCase()) + 1, Number(month[2]));
  }
  return null;
}

function validDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildStructuralSignature(result) {
  const rendered = findRenderedSnapshot(result);
  const status = result.diagnostics?.runtimeFactStatus || {};
  const channels = Object.entries(result.diagnostics?.runtimeFactChannels || {})
    .map(([channel, items]) => `${channel}:${items.length}`)
    .sort()
    .join("|");
  return hashString([
    status.host,
    status.path,
    rendered.signature || "",
    rendered.calendarCells || 0,
    rendered.selectableCalendarCells || 0,
    rendered.consulate || "",
    rendered.locationId || "",
    channels
  ].join("::"));
}

function monitorTargetKey(result, consulate) {
  let key = "unknown";
  try {
    const url = new URL(result.finalUrl || result.requestedUrl || "");
    key = `${url.hostname}${url.pathname}`;
  } catch {}
  return hashString(`${key}:${normalizeText(consulate) || normalizeText(findRenderedSnapshot(result).consulate)}`);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(text); } catch { throw httpError(400, "Request body must be valid JSON."); }
}

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function accountFromRequest(request = {}, body = {}) {
  const email = sanitizeAccountEmail(body.email || request.headers["x-organ9-account-email"] || "");
  const stored = email ? accountEntitlementStore.get(email) : null;
  return {
    ...(stored || {}),
    email,
    plan: stored?.plan || normalizeLocalHeader(request.headers["x-organ9-plan"]) || body.plan || "",
    modules: stored?.modules || parseCsvHeader(request.headers["x-organ9-modules"]),
    addons: stored?.addons || parseCsvHeader(request.headers["x-organ9-addons"]),
    status: stored?.status || normalizeLocalHeader(request.headers["x-organ9-status"]) || (email ? "demo" : "signed_out"),
    source: stored?.source || "server"
  };
}

function mergeEntitlementPatch(current, patch) {
  return {
    ...current,
    ...patch,
    modules: [...new Set([...(current.modules || []), ...(patch.modules || [])])],
    addons: [...new Set([...(current.addons || []), ...(patch.addons || [])])],
    updatedAt: new Date().toISOString()
  };
}

function publicAccount(account = {}) {
  return {
    email: account.email || "",
    status: account.status || "",
    source: account.source || ""
  };
}

function parseCsvHeader(value) {
  return String(value || "").split(",").map(item => item.trim()).filter(Boolean);
}

function normalizeLocalHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/_/g, "-");
}

function sanitizeAccountEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : "";
}

async function serveStatic(pathname, response) {
  const relative = pathname === "/" ? "runtime-diagnostics.html" : pathname.replace(/^\//, "");
  let file = resolve(root, relative);
  if (!file.startsWith(root + sep) && file !== root) throw httpError(403, "Forbidden.");
  const info = await stat(file).catch(() => null);
  if (!info) throw httpError(404, "Not found.");
  if (info.isDirectory()) file = resolve(file, "runtime-diagnostics.html");
  const body = await readFile(file);
  response.writeHead(200, {
    "Content-Type": mime[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  response.end(body);
}

export function buildCorsOrigin(request = {}, pathname = "") {
  const origin = request.headers?.origin || "";
  if (!origin) return "";
  if (pathname === "/api/runtime-diagnostics/ingest" || pathname === "/api/behavior-stream") return origin;
  try {
    const originUrl = new URL(origin);
    const hostUrl = new URL(`http://${request.headers?.host || ""}`);
    const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
    if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") return "";
    if (!localHosts.has(originUrl.hostname)) return "";
    if (!localHosts.has(hostUrl.hostname)) return "";
    return originUrl.port === hostUrl.port ? origin : "";
  } catch {
    return "";
  }
}

function setHeaders(request, response, pathname = "") {
  const allowedOrigin = buildCorsOrigin(request, pathname);
  if (allowedOrigin) response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Web-Bloomberg-Ingest-Key");
  if (allowedOrigin) response.setHeader("Access-Control-Allow-Private-Network", "true");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self' http://127.0.0.1:* http://localhost:*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accept.authorize.net https://test.authorize.net"
  ].join("; "));
}

function verifyBehaviorStreamKey(request = {}) {
  const configured = String(process.env.WEB_BLOOMBERG_INGEST_KEY || "").trim();
  if (!configured) return true;
  const provided = String(request.headers?.["x-web-bloomberg-ingest-key"] || "").trim();
  if (provided && provided === configured) return true;
  throw httpError(401, "Behavior stream ingest key is invalid.", "WEB_BLOOMBERG_INGEST_KEY_INVALID");
}

function json(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

function httpError(status, message, code = "") {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  startStandaloneServer().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
