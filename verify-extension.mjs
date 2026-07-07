import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import playwright from "../vintage-house-browser/node_modules/playwright-core/index.js";
const { chromium } = playwright;

const extensionPath = resolve(import.meta.dirname);
const profile = mkdtempSync(join(tmpdir(), "visa-slot-alert-"));
const output = resolve(extensionPath, "verification");
mkdirSync(output, { recursive: true });

const context = await chromium.launchPersistentContext(profile, {
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});

try {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 20000 });
  const extensionId = new URL(worker.url()).host;
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForTimeout(350);
  await page.screenshot({ path: resolve(output, "popup.png") });
  const ui = await page.evaluate(() => ({
    width: document.querySelector("main")?.getBoundingClientRect().width,
    title: document.querySelector("h1")?.textContent,
    cutoff: document.getElementById("cutoff-date")?.type,
    crawlerCard: Boolean(document.getElementById("crawler-status")),
    crawlerSeverity: document.getElementById("crawler-severity")?.textContent,
    runtimeCard: Boolean(document.getElementById("runtime-status")),
    runtimeSeverity: document.getElementById("runtime-severity")?.textContent,
    runtimeOpen: Boolean(document.getElementById("runtime-open"))
  }));
  const visaContentScripts = manifest.content_scripts?.[0]?.js || [];
  const runtimeContentScripts = manifest.content_scripts?.[1]?.js || [];
  const visaScannerScoped = visaContentScripts.includes("date-parser.js") && visaContentScripts.includes("content.js") && !visaContentScripts.includes("crawler-signals.js");
  const runtimeLoadedForAllWeb = manifest.content_scripts?.[1]?.matches?.includes("http://*/*") &&
    manifest.content_scripts?.[1]?.matches?.includes("https://*/*") &&
    runtimeContentScripts.indexOf("crawler-signals.js") > -1 &&
    runtimeContentScripts.indexOf("crawler-signals.js") < runtimeContentScripts.indexOf("runtime-layer/runtime-collector.js") &&
    runtimeContentScripts.indexOf("runtime-layer/runtime-collector.js") < runtimeContentScripts.indexOf("diagnostics-layer/diagnostics-collector.js") &&
    runtimeContentScripts.indexOf("diagnostics-layer/diagnostics-collector.js") < runtimeContentScripts.indexOf("runtime-collector.js");
  const hookExposed = manifest.web_accessible_resources?.some(entry => entry.resources?.includes("page-runtime-hooks.js") && entry.matches?.includes("https://*/*") && entry.matches?.includes("http://*/*"));
  const allWebHostPermissions = manifest.host_permissions?.includes("http://*/*") && manifest.host_permissions?.includes("https://*/*");
  if (manifest.name !== "Official U.S. Visa Earlier Appointment Alert" || manifest.version !== "3.2.0" || !visaScannerScoped || !runtimeLoadedForAllWeb || !hookExposed || !allWebHostPermissions || errors.length || ui.width > 400 || ui.cutoff !== "date" || !ui.crawlerCard || ui.runtimeCard || ui.runtimeOpen) throw new Error(JSON.stringify({ manifest, errors, ui, visaContentScripts, runtimeContentScripts }));
  await worker.evaluate(() => chrome.storage.sync.set({ runtimeDiagnosticsSettings: { enabled: true, notifyHighSeverity: true } }));
  await context.route("https://www.roblox.com/**", route => {
    if (route.request().url().endsWith("/probe")) {
      return route.fulfill({ status: 200, headers: { "x-test-runtime": "ok" }, body: JSON.stringify({ ok: true }) });
    }
    return route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><html><head><title>Mock site</title></head><body><div id='cf-challenge' class='cf-challenge'>Checking your browser before accessing this site</div><form><button id='go' type='button'>Continue</button></form><script>document.getElementById('go').addEventListener('click', async () => { const challenge = document.createElement('div'); challenge.id = 'turnstile-captcha'; challenge.className = 'cf-captcha cloudflare'; challenge.textContent = 'Cloudflare Turnstile challenge captcha'; document.body.appendChild(challenge); localStorage.setItem('ticket-sniper-test', 'redacted-value'); history.pushState({}, '', '/app/schedule'); console.warn('ticket sniper runtime verifier'); await fetch('/probe'); setTimeout(() => console.warn('ticket sniper delayed verifier'), 700); });</script></body></html>"
    });
  });
  const portal = await context.newPage();
  const portalErrors = [];
  portal.on("pageerror", error => portalErrors.push(error.message));
  await portal.goto("https://www.roblox.com/discover");
  await portal.waitForFunction(() => window.__ticketSniperRuntimeHooksInstalled === true, { timeout: 10000 });
  await portal.evaluate(() => {
    window.__ticketSniperSeenFacts = [];
    window.addEventListener("message", event => {
      if (event.data?.channel === "TICKET_SNIPER_PAGE_FACT") window.__ticketSniperSeenFacts.push(`${event.data.fact.source}/${event.data.fact.type}`);
    });
  });
  await portal.click("#go");
  await portal.waitForTimeout(1000);
  const hookInstalled = await portal.evaluate(() => Boolean(window.__ticketSniperRuntimeHooksInstalled));
  const hookPatchState = await portal.evaluate(() => ({
    consoleWarn: String(console.warn).includes("patchedConsole"),
    pushState: String(history.pushState).includes("patchedPushState"),
    storageSetItem: String(Storage.prototype.setItem).includes("patchedSetItem"),
    fetch: String(fetch).includes("patchedFetch")
  }));
  const seenPageFacts = await portal.evaluate(() => window.__ticketSniperSeenFacts || []);
  let runtimeProbe;
  let channels;
  let pipelineState;
  let hasNetwork = false;
  let hasStorage = false;
  let hasNavigation = false;
  let hasConsole = false;
  let hasProtection = false;
  let hasPipeline = false;
  let historyCounts = {};
  for (let attempt = 0; attempt < 16; attempt += 1) {
    runtimeProbe = await worker.evaluate(() => chrome.storage.local.get(["runtimeFactChannels", "diagnosticFactChannels", "runtimeFactStatus", "diagnosticFactStatus", "runtimeRelayError", "runtimeRelaySeen", "structuralPipelineState", "structuralPipelineLatest", "normalizedFactHistory", "structuralEventHistory", "featureVectorHistory", "scoreResultHistory", "updateClassificationHistory", "organPipelineState", "organPipelineLatest", "organAssignmentHistory", "organRenderBlockHistory", "organPipelineErrorHistory"]));
    channels = { ...(runtimeProbe.runtimeFactChannels || {}), ...(runtimeProbe.diagnosticFactChannels || {}) };
    pipelineState = runtimeProbe.structuralPipelineState || {};
    hasNetwork = Boolean(channels["network/request"]?.length || channels["network/response"]?.length);
    hasStorage = Boolean(channels["storage/storage-change"]?.length || channels["storage/storage-snapshot"]?.length);
    hasNavigation = Boolean(channels["runtime/navigation"]?.length);
    hasConsole = Boolean(channels["runtime/console"]?.length);
    hasProtection = Boolean(channels["anti_crawler/challenge"]?.length || channels["anti_crawler/fingerprint"]?.length || channels["crawler/crawler-pattern"]?.length);
    historyCounts = {
      normalized: runtimeProbe.normalizedFactHistory?.length || 0,
      events: runtimeProbe.structuralEventHistory?.length || 0,
      features: runtimeProbe.featureVectorHistory?.length || 0,
      scores: runtimeProbe.scoreResultHistory?.length || 0,
      classifications: runtimeProbe.updateClassificationHistory?.length || 0
    };
    hasPipeline = Boolean(
      pipelineState.version === "fact-normalizer-pipeline-v1" &&
      pipelineState.summary?.nodeCount > 0 &&
      runtimeProbe.structuralPipelineLatest?.normalizedKey &&
      runtimeProbe.structuralPipelineLatest?.classification &&
      runtimeProbe.structuralPipelineLatest?.score !== null &&
      historyCounts.normalized &&
      historyCounts.events &&
      historyCounts.features &&
      historyCounts.scores &&
      historyCounts.classifications
    );
    const organState = runtimeProbe.organPipelineState || {};
    const organSummary = organState.summary || {};
    const hasOrganPipeline = Boolean(
      organState.version === "organ-structural-rendering-v2" &&
      organSummary.organCount === 9 &&
      organSummary.nodeCount > 0 &&
      runtimeProbe.organPipelineLatest?.normalizedFactType &&
      runtimeProbe.organAssignmentHistory?.length &&
      Object.keys(organState.renderBlocks || {}).length === 9 &&
      !runtimeProbe.organRenderBlockHistory?.some(block => block.components?.some(component => ["score", "rating", "interpretation", "recommendation"].includes(component.type)))
    );
    runtimeProbe.hasOrganPipeline = hasOrganPipeline;
    if (hasNetwork && hasStorage && hasNavigation && hasConsole && hasProtection && hasPipeline && hasOrganPipeline) break;
    await portal.waitForTimeout(500);
  }
  if (portalErrors.length || !hasNetwork || !hasStorage || !hasNavigation || !hasConsole || !hasProtection || !hasPipeline || !runtimeProbe.hasOrganPipeline) throw new Error(JSON.stringify({ hookInstalled, hookPatchState, seenPageFacts, relaySeen: runtimeProbe.runtimeRelaySeen, relayError: runtimeProbe.runtimeRelayError, portalErrors, channelNames: Object.keys(channels), runtimeStatus: runtimeProbe.runtimeFactStatus, diagnosticStatus: runtimeProbe.diagnosticFactStatus, pipelineLatest: runtimeProbe.structuralPipelineLatest, pipelineState, organPipelineLatest: runtimeProbe.organPipelineLatest, organPipelineState: runtimeProbe.organPipelineState, historyCounts }, null, 2));
  await portal.close();
  const diagnostics = await context.newPage();
  const diagnosticsErrors = [];
  diagnostics.on("pageerror", error => diagnosticsErrors.push(error.message));
  await diagnostics.goto(`chrome-extension://${extensionId}/runtime-diagnostics.html`);
  await diagnostics.waitForTimeout(500);
  const diagnosticsUi = await diagnostics.evaluate(() => ({
    title: document.querySelector("h1")?.textContent,
    totalFacts: Number(document.getElementById("total-facts")?.textContent || 0),
    profileCards: document.querySelectorAll(".profile-card").length,
    rows: document.querySelectorAll("#fact-table tr").length,
    pipelineCards: document.querySelectorAll("#pipeline-profile .profile-card").length,
    pipelineCount: document.getElementById("pipeline-count")?.textContent,
    organCards: document.querySelectorAll("#organ-panels .organ-card").length,
    organComponents: document.querySelectorAll("#organ-panels .organ-component").length,
    organCount: document.getElementById("organ-count")?.textContent,
    openInput: Boolean(document.getElementById("portal-url")),
    toggle: document.getElementById("toggle-diagnostics")?.textContent,
    exportAll: document.getElementById("export-all-json")?.textContent
  }));
  if (diagnosticsErrors.length || diagnosticsUi.title !== "SIG9" || !diagnosticsUi.totalFacts || !diagnosticsUi.profileCards || diagnosticsUi.pipelineCards < 3 || diagnosticsUi.organCards !== 9 || diagnosticsUi.organComponents < 36 || !diagnosticsUi.rows || !diagnosticsUi.openInput || diagnosticsUi.toggle !== "Live on" || diagnosticsUi.exportAll !== "Export all") throw new Error(JSON.stringify({ diagnosticsErrors, diagnosticsUi }, null, 2));
  await diagnostics.evaluate(() => {
    const originalCreateObjectUrl = URL.createObjectURL.bind(URL);
    window.__ticketSniperLastExportJson = null;
    URL.createObjectURL = blob => {
      if (blob?.type === "application/json") {
        blob.text().then(text => { window.__ticketSniperLastExportJson = text; }).catch(() => {});
      }
      return originalCreateObjectUrl(blob);
    };
  });
  await diagnostics.evaluate(() => document.getElementById("export-all-json")?.click());
  await diagnostics.waitForFunction(() => Boolean(window.__ticketSniperLastExportJson), { timeout: 10000 });
  const exportPayload = JSON.parse(await diagnostics.evaluate(() => window.__ticketSniperLastExportJson));
  const exportStatus = await diagnostics.locator("#export-status").textContent();
  const exportUi = {
    filename: "ticket-sniper-extension-all-captured.json",
    status: exportStatus,
    kind: exportPayload.kind,
    hasStorage: Boolean(exportPayload.storage?.local && exportPayload.storage?.sync),
    hasSnapshot: Boolean(exportPayload.diagnosticsSnapshot?.totalFacts),
    hasStructuralPipeline: Boolean(exportPayload.diagnosticsSnapshot?.structuralPipeline?.latest?.normalizedKey && exportPayload.storage?.local?.structuralPipelineState?.summary?.nodeCount),
    hasOrganPipeline: Boolean(exportPayload.diagnosticsSnapshot?.organPipeline?.state?.summary?.organCount === 9 && exportPayload.storage?.local?.organPipelineState?.summary?.nodeCount),
    hasTabs: Array.isArray(exportPayload.openInspectableTabs),
    version: exportPayload.extension?.version
  };
  if (!exportUi.filename.startsWith("ticket-sniper-extension-all-") || !/\.json$/.test(exportUi.filename) || exportUi.status !== "Full extension JSON exported with sensitive fields redacted." || exportUi.kind !== "ticket-sniper-extension-full-export" || !exportUi.hasStorage || !exportUi.hasSnapshot || !exportUi.hasStructuralPipeline || !exportUi.hasOrganPipeline || !exportUi.hasTabs || exportUi.version !== manifest.version) throw new Error(JSON.stringify({ exportUi }, null, 2));
  await diagnostics.close();
  console.log(JSON.stringify({ extensionId, name: manifest.name, version: manifest.version, ui, diagnosticsUi, exportUi, runtimeProbe: { hasNetwork, hasStorage, hasNavigation, hasConsole, hasProtection, hasPipeline, hasOrganPipeline: runtimeProbe.hasOrganPipeline }, errors }, null, 2));
} finally {
  await context.close();
  rmSync(profile, { recursive: true, force: true });
}
