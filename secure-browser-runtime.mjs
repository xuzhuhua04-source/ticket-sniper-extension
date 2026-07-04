import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import { analyzeRenderedSnapshot } from "./standalone-analyzer.mjs";

const DEFAULT_PROFILE_DIR = resolve(import.meta.dirname, ".ticket-sniper-secure-browser");
const MAX_EVENTS = 80;
const MAX_FACTS = 1200;
const TRANSPORT_FACTS = 240;

export class SecureBrowserRuntime {
  constructor(options = {}) {
    this.context = null;
    this.page = null;
    this.network = [];
    this.consoleEvents = [];
    this.jsErrors = [];
    this.runtimeFacts = [];
    this.runtimeFactChannels = {};
    this.lastResult = null;
    this.lastError = "";
    this.lastOpenedAt = 0;
    this.bridgeInstalled = false;
    this.collectorSource = null;
    this.pageHooksSource = null;
    this.profileDir = options.profileDir || DEFAULT_PROFILE_DIR;
    this.profileLabel = options.profileLabel || "secure-browser";
    this.localAppOrigins = new Set((options.localAppOrigins || []).map(value => String(value || "").replace(/\/+$/, "")));
    this.activeAnalysisKey = "";
    this.contextClosed = true;
    this.operationChain = Promise.resolve();
  }

  async open(rawUrl = "") {
    return this.serializeOperation(() => this.openOnce(rawUrl));
  }

  async openOnce(rawUrl = "") {
    await this.ensureContext();
    const targetUrl = normalizeOptionalUrl(rawUrl);
    this.page = await this.usablePage();
    this.attachPage(this.page);
    if (targetUrl && this.page.url() !== targetUrl) await this.page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    this.lastOpenedAt = Date.now();
    return this.status();
  }

  async analyze(rawUrl = "") {
    return this.serializeOperation(() => this.withContextRecovery(() => this.analyzeOnce(rawUrl)));
  }

  async analyzeOnce(rawUrl = "") {
    await this.ensureContext();
    const targetUrl = normalizeOptionalUrl(rawUrl);
    if (targetUrl) {
      this.page = await this.usablePage();
      this.attachPage(this.page);
      if (this.page.url() !== targetUrl) await this.page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    }
    this.page = this.page && !this.page.isClosed() && !isBlankPage(this.page) && !this.isLocalMonitorPage(this.page) ? this.page : this.pickPage();
    if (!this.page || isBlankPage(this.page)) throw httpError(409, "Open the secure browser and navigate to a website first.");
    this.resetTransportIfTargetChanged(this.page.url());
    this.attachPage(this.page);
    const startedAt = Date.now();
    await this.forceCollectorSample(this.page);
    await this.page.waitForTimeout(60).catch(() => {});
    const diagnosticsTick = this.recordDiagnosticsTick(this.page);
    const snapshot = await this.page.evaluate(() => {
      const text = selector => document.querySelector(selector)?.textContent?.trim() || "";
      const value = selector => document.querySelector(selector)?.value?.trim() || "";
      const selected = selector => document.querySelector(selector)?.selectedOptions?.[0]?.textContent?.trim() || "";
      const title = text("h1.page-title") || text("title") || document.title || "";
      const titleConsulate = title.includes("-") ? title.split("-").slice(1).join("-").trim() : "";
      const consulate = titleConsulate || value("input[name='locationName']") || selected("#consulate") || selected("select[name*='consulate' i]") || selected("select[id*='consulate' i]");
      const locationId = value("input[name='locationId']") || value("input[name*='location' i]");
      const calendarCandidates = [...document.querySelectorAll([
        "[role='gridcell']",
        "[data-date]",
        ".ui-datepicker-calendar td",
        ".datepicker td",
        ".calendar td",
        "td"
      ].join(","))];
      const selectableCalendarCells = calendarCandidates.filter(node => {
        const style = getComputedStyle(node);
        const label = `${node.textContent || ""} ${node.getAttribute("aria-label") || ""} ${node.className || ""}`;
        return style.visibility !== "hidden" && style.display !== "none" && /\b([1-9]|[12]\d|3[01])\b|available|select/i.test(label) && !/disabled|unavailable/i.test(label);
      });
      const availableDates = selectableCalendarCells.map(node => {
        const headerText = calendarHeaderFor(node);
        const dateText = [
          node.getAttribute("data-date"),
          node.getAttribute("data-available-date"),
          node.getAttribute("datetime"),
          node.getAttribute("aria-label"),
          headerText && node.textContent ? `${headerText} ${node.textContent}` : "",
          node.textContent
        ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
        return {
          text: dateText.slice(0, 120),
          label: String(node.getAttribute("aria-label") || "").slice(0, 120),
          calendarHeader: headerText.slice(0, 80)
        };
      }).filter(item => item.text).slice(0, 80);
      const signatureSource = [
        location.hostname,
        location.pathname,
        document.forms.length,
        document.querySelectorAll("input,select,textarea").length,
        document.querySelectorAll("button,[role='button'],a").length,
        calendarCandidates.length,
        selectableCalendarCells.length,
        consulate,
        [...document.querySelectorAll("h1,h2,h3,[role='heading']")].slice(0, 20).map(node => node.textContent.trim()).join("|")
      ].join("::");
      return {
        title,
        readyState: document.readyState,
        forms: document.forms.length,
        inputs: document.querySelectorAll("input,select,textarea").length,
        buttons: document.querySelectorAll("button,[role='button'],input[type='button'],input[type='submit']").length,
        links: document.links.length,
        scripts: document.scripts.length,
        iframes: document.querySelectorAll("iframe").length,
        calendarCells: calendarCandidates.length,
        selectableCalendarCells: selectableCalendarCells.length,
        availableDates,
        consulate,
        locationId,
        signature: String(hashString(signatureSource))
      };

      function hashString(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index += 1) {
          hash ^= value.charCodeAt(index);
          hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, "0");
      }

      function calendarHeaderFor(node) {
        const scope = node.closest(".ui-datepicker-group,.ui-datepicker,.datepicker,.calendar,[role='grid']") || document;
        const monthSelect = scope.querySelector(".ui-datepicker-month")?.selectedOptions?.[0]?.textContent ||
          scope.querySelector("select[name*='month' i]")?.selectedOptions?.[0]?.textContent ||
          "";
        const yearSelect = scope.querySelector(".ui-datepicker-year")?.selectedOptions?.[0]?.textContent ||
          scope.querySelector("select[name*='year' i]")?.selectedOptions?.[0]?.textContent ||
          "";
        const title = scope.querySelector(".ui-datepicker-title,.datepicker-switch,[class*='month' i],[aria-live]")?.textContent || "";
        const text = `${monthSelect} ${yearSelect}`.trim() || title.trim();
        return text.replace(/\s+/g, " ");
      }
    });
    await this.collectAccessibilityTree(this.page);
    const html = await this.page.content();
    const result = analyzeRenderedSnapshot({
      url: this.page.url(),
      requestedUrl: this.page.url(),
      html,
      rendered: snapshot,
      network: this.network.slice(-30),
      consoleErrors: this.consoleEvents.slice(-30),
      jsErrors: this.jsErrors.slice(-30),
      runtimeFacts: [...this.runtimeFacts.slice(-(TRANSPORT_FACTS - 1)), diagnosticsTick].filter(Boolean),
      startedAt
    });
    this.lastResult = result;
    this.lastError = "";
    return result;
  }

  status() {
    try {
      const usable = this.isContextUsable();
      const page = usable ? this.pickPage() : null;
      const pages = usable ? this.safePages() : [];
      return {
        ok: true,
        state: usable ? "secure_browser_open" : "secure_browser_closed",
        pageUrl: page && !isBlankPage(page) ? page.url() : "",
        pageCount: pages.length,
        lastOpenedAt: this.lastOpenedAt,
        lastError: this.lastError,
        hasResult: Boolean(this.lastResult)
      };
    } catch (error) {
      this.contextClosed = true;
      this.context = null;
      this.page = null;
      this.bridgeInstalled = false;
      this.lastError = "The runtime browser was closed; it will relaunch automatically on the next analysis.";
      return {
        ok: true,
        state: "secure_browser_closed",
        pageUrl: "",
        pageCount: 0,
        lastOpenedAt: this.lastOpenedAt,
        lastError: this.lastError,
        hasResult: Boolean(this.lastResult)
      };
    }
  }

  async close() {
    await this.context?.close().catch(() => {});
    this.context = null;
    this.page = null;
    this.bridgeInstalled = false;
    this.contextClosed = true;
    this.network = [];
    this.consoleEvents = [];
    this.jsErrors = [];
    this.runtimeFacts = [];
    this.runtimeFactChannels = {};
    this.activeAnalysisKey = "";
    return this.status();
  }

  async ensureContext() {
    if (this.context && this.isContextUsable()) return;
    this.context = null;
    this.page = null;
    this.bridgeInstalled = false;
    this.contextClosed = true;
    this.profileDir = this.profileDir || DEFAULT_PROFILE_DIR;
    await mkdir(this.profileDir, { recursive: true });
    this.context = await this.launchPersistentContext(this.profileDir).catch(async error => {
      if (!/existing browser session|profile is already in use/i.test(error.message || "")) throw error;
      this.profileDir = resolve(import.meta.dirname, `.ticket-sniper-${this.profileLabel}-fallback-${Date.now()}`);
      this.lastError = "Primary secure browser profile was locked; using a temporary fallback profile for this server run.";
      await mkdir(this.profileDir, { recursive: true });
      return this.launchPersistentContext(this.profileDir);
    });
    this.contextClosed = false;
    this.context.on("close", () => {
      this.contextClosed = true;
      this.context = null;
      this.page = null;
      this.bridgeInstalled = false;
    });
    await this.installCollectorBridge();
    this.context.on("page", page => this.attachPage(page));
    for (const page of this.context.pages()) this.attachPage(page);
  }

  launchPersistentContext(profileDir) {
    return chromium.launchPersistentContext(profileDir, {
      headless: false,
      executablePath: findBrowserExecutable(),
      viewport: { width: 1320, height: 860 },
      acceptDownloads: false
    });
  }

  async installCollectorBridge() {
    if (this.bridgeInstalled) return;
    this.pageHooksSource = this.pageHooksSource || await readFile(resolve(import.meta.dirname, "page-runtime-hooks.js"), "utf8");
    this.collectorSource = this.collectorSource || await readFile(resolve(import.meta.dirname, "runtime-collector.js"), "utf8");
    await this.context.exposeBinding("__ticketSniperRuntimeBridge", async (_source, message) => {
      this.acceptRuntimeMessage(message);
      return { ok: true };
    });
    await this.context.addInitScript(collectorBootstrapSource(this.pageHooksSource));
    await this.context.addInitScript(this.collectorSource);
    this.bridgeInstalled = true;
  }

  pickPage() {
    const pages = this.safePages();
    return [...pages].reverse().find(page => !page.isClosed() && !isBlankPage(page) && !this.isLocalMonitorPage(page)) ||
      [...pages].reverse().find(page => !page.isClosed() && !isBlankPage(page)) ||
      pages.find(page => !page.isClosed()) ||
      null;
  }

  safePages() {
    try {
      return this.context?.pages() || [];
    } catch {
      this.contextClosed = true;
      this.context = null;
      this.page = null;
      this.bridgeInstalled = false;
      return [];
    }
  }

  isContextUsable() {
    if (!this.context || this.contextClosed) return false;
    try {
      this.context.pages();
      return true;
    } catch {
      return false;
    }
  }

  isLocalMonitorPage(page) {
    try {
      const url = new URL(page.url());
      if (!this.localAppOrigins.size) return false;
      return this.localAppOrigins.has(url.origin) && [
        "/",
        "/runtime-diagnostics.html",
        "/visa-monitor.html",
        "/options.html"
      ].includes(url.pathname);
    } catch {
      return false;
    }
  }

  async usablePage() {
    await this.ensureContext();
    const page = this.page && !this.page.isClosed() ? this.page : this.pickPage();
    if (page && !page.isClosed()) return page;
    try {
      return await this.context.newPage();
    } catch (error) {
      if (!isTargetClosedError(error)) throw error;
      this.context = null;
      this.page = null;
      this.bridgeInstalled = false;
      this.contextClosed = true;
      await this.ensureContext();
      return this.context.newPage();
    }
  }

  serializeOperation(operation) {
    const previous = this.operationChain.catch(() => {});
    const current = previous.then(operation);
    this.operationChain = current.catch(() => {});
    return current;
  }

  async withContextRecovery(operation) {
    try {
      return await operation();
    } catch (error) {
      if (!isTargetClosedError(error)) throw error;
      this.lastError = "The runtime browser closed during analysis; the bridge relaunched it and retried once.";
      this.context = null;
      this.page = null;
      this.bridgeInstalled = false;
      this.contextClosed = true;
      return operation();
    }
  }

  attachPage(page) {
    if (!page || page.__ticketSniperAttached) return;
    page.__ticketSniperAttached = true;
    page.on("domcontentloaded", () => this.injectCollectorIntoExistingPage(page).catch(() => {}));
    this.injectCollectorIntoExistingPage(page).catch(() => {});
    page.on("console", message => {
      if (!["error", "warning"].includes(message.type())) return;
      this.consoleEvents.push({ type: message.type(), text: message.text(), url: page.url(), timestamp: Date.now() });
      this.consoleEvents = this.consoleEvents.slice(-MAX_EVENTS);
    });
    page.on("pageerror", error => {
      this.jsErrors.push({ message: error.message, url: page.url(), timestamp: Date.now() });
      this.jsErrors = this.jsErrors.slice(-MAX_EVENTS);
    });
    page.on("response", response => {
      const status = response.status();
      if (status < 400) return;
      const request = response.request();
      this.network.push({
        url: response.url(),
        status,
        method: request.method(),
        resourceType: request.resourceType(),
        failed: false,
        timestamp: Date.now()
      });
      this.network = this.network.slice(-MAX_EVENTS);
    });
    page.on("requestfailed", request => {
      this.network.push({
        url: request.url(),
        status: 0,
        method: request.method(),
        resourceType: request.resourceType(),
        failed: true,
        failureText: request.failure()?.errorText || "",
        timestamp: Date.now()
      });
      this.network = this.network.slice(-MAX_EVENTS);
    });
  }

  async injectCollectorIntoExistingPage(page) {
    if (!page || page.isClosed() || isBlankPage(page)) return;
    try {
      await page.evaluate(collectorBootstrapSource(this.pageHooksSource || await readFile(resolve(import.meta.dirname, "page-runtime-hooks.js"), "utf8")));
      await page.addScriptTag({ content: this.collectorSource || await readFile(resolve(import.meta.dirname, "runtime-collector.js"), "utf8") });
    } catch (error) {
      this.recordLocalFact(page, "runtime", "collector-injection-warning", {
        severity: "medium",
        message: "The target page rejected runtime collector injection. Rendered DOM analysis is still available, but live runtime channels may be thinner.",
        reason: String(error?.message || error).slice(0, 180)
      }, { source: "secure-browser-injection" });
    }
  }

  async forceCollectorSample(page) {
    if (!page || page.isClosed()) return;
    await page.evaluate(async () => {
      await window.chrome?.runtime?.sendMessage?.({
        type: "RUNTIME_FACT_DETECTED",
        payload: {
          timestamp: Date.now(),
          page: { host: location.hostname, path: location.pathname },
          fact: {
            timestamp: Date.now(),
            source: "runtime",
            type: "diagnostics_tick",
            value: {
              severity: "info",
              reason: "secure_browser_tick",
              visibility: document.visibilityState,
              readyState: document.readyState
            },
            metadata: { url: `${location.hostname}${location.pathname}` },
            context: { pageUrl: `${location.origin}${location.pathname}`, collectorVersion: "secure-bridge" }
          }
        }
      });
      if (typeof window.__ticketSniperForceRuntimeSample === "function") {
        window.__ticketSniperForceRuntimeSample("secure_browser_tick");
      }
    }).catch(() => {});
  }

  recordDiagnosticsTick(page) {
    let pageUrl = "";
    try { pageUrl = page?.url() || ""; } catch { pageUrl = ""; }
    const now = Date.now();
    const fact = {
      timestamp: now,
      source: "runtime",
      type: "diagnostics_tick",
      value: {
        severity: "info",
        reason: "secure_browser_tick",
        bridge: "node-ledger"
      },
      metadata: { url: sanitizeLocalUrl(pageUrl) },
      context: { pageUrl: sanitizeLocalUrl(pageUrl), collectorVersion: "secure-bridge" }
    };
    this.acceptRuntimeMessage({
      type: "RUNTIME_FACT_DETECTED",
      payload: { timestamp: now, page: pageContextFromUrl(pageUrl), fact }
    });
    return fact;
  }

  acceptRuntimeMessage(message) {
    if (message?.type !== "RUNTIME_FACT_DETECTED" || !message.payload?.fact) return;
    const fact = message.payload.fact;
    if (!this.factBelongsToActiveTarget(fact)) return;
    this.runtimeFacts.push(fact);
    this.runtimeFacts = this.runtimeFacts.slice(-MAX_FACTS);
    const channel = `${fact.source || "unknown"}/${fact.type || "fact"}`;
    this.runtimeFactChannels[channel] = this.runtimeFactChannels[channel] || [];
    this.runtimeFactChannels[channel].push(fact);
    this.runtimeFactChannels[channel] = this.runtimeFactChannels[channel].slice(-120);
  }

  resetTransportIfTargetChanged(pageUrl) {
    const key = analysisTargetKey(pageUrl);
    if (!key || key === this.activeAnalysisKey) return;
    this.activeAnalysisKey = key;
    this.network = [];
    this.consoleEvents = [];
    this.jsErrors = [];
    this.runtimeFacts = [];
    this.runtimeFactChannels = {};
  }

  factBelongsToActiveTarget(fact) {
    if (!this.activeAnalysisKey) return true;
    const pageUrl = fact?.context?.pageUrl || fact?.metadata?.url || "";
    if (!pageUrl) return true;
    return analysisTargetKey(pageUrl) === this.activeAnalysisKey;
  }

  recordLocalFact(page, source, type, value = {}, metadata = {}) {
    let pageUrl = "";
    try { pageUrl = page?.url() || ""; } catch { pageUrl = ""; }
    const now = Date.now();
    const channel = `${source}/${type}`;
    this.acceptRuntimeMessage({
      type: "RUNTIME_FACT_DETECTED",
      payload: {
        timestamp: now,
        page: pageContextFromUrl(pageUrl),
        fact: {
          timestamp: now,
          source,
          type,
          channel,
          organ: inferOrgan(source, type),
          severity: normalizeSeverity(value?.severity),
          confidence: confidenceForFact(source, type, metadata),
          captureMode: metadata.captureMode || captureModeForFact(source, type),
          payload: sanitizeRuntimeFactValue({ value, metadata }),
          value,
          metadata,
          context: { pageUrl: sanitizeLocalUrl(pageUrl), collectorVersion: "secure-bridge" }
        }
      }
    });
  }

  async collectAccessibilityTree(page) {
    if (!page || page.isClosed()) return;
    let session = null;
    try {
      session = await this.context.newCDPSession(page);
      const result = await session.send("Accessibility.getFullAXTree");
      const nodes = Array.isArray(result.nodes) ? result.nodes : [];
      const roles = {};
      let ignored = 0;
      let named = 0;
      for (const node of nodes.slice(0, 2500)) {
        const role = String(node.role?.value || "unknown").slice(0, 80);
        roles[role] = (roles[role] || 0) + 1;
        if (node.ignored) ignored += 1;
        if (node.name?.value) named += 1;
      }
      this.recordLocalFact(page, "a11y", "cdp_ax_tree", {
        severity: "low",
        nodeCount: nodes.length,
        ignored,
        named,
        roles
      }, {
        captureMode: "chrome_devtools_protocol",
        confidence: 0.95,
        sample: nodes.slice(0, 80).map(node => ({
          role: String(node.role?.value || "unknown").slice(0, 80),
          nameHash: stableHash(String(node.name?.value || "")),
          ignored: Boolean(node.ignored),
          childCount: Array.isArray(node.childIds) ? node.childIds.length : 0
        }))
      });
    } catch (error) {
      this.recordLocalFact(page, "a11y", "cdp_ax_unavailable", {
        severity: "low",
        status: "best_effort",
        reason: String(error?.message || error).slice(0, 180)
      }, { captureMode: "chrome_devtools_protocol", confidence: 0.4 });
    } finally {
      await session?.detach?.().catch(() => {});
    }
  }
}

function pageContextFromUrl(value) {
  try {
    const url = new URL(value);
    return { host: url.hostname, path: url.pathname };
  } catch {
    return { host: "", path: "" };
  }
}

function sanitizeLocalUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

function analysisTargetKey(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

function collectorBootstrapSource(pageHooksSource) {
  return `
(() => {
  if (window.__ticketSniperStandaloneCollectorBridgeInstalled) return;
  window.__ticketSniperStandaloneCollectorBridgeInstalled = true;
  window.__ticketSniperRuntimeMessageListeners = [];
  window.__ticketSniperPageHooksSource = ${JSON.stringify(pageHooksSource || "")};
  const storageArea = {
    get: async key => key === "runtimeDiagnosticsSettings" ? { runtimeDiagnosticsSettings: { enabled: true } } : {},
    set: async () => ({}),
    remove: async () => ({})
  };
  window.chrome = window.chrome || {};
  window.chrome.storage = window.chrome.storage || {};
  window.chrome.storage.sync = window.chrome.storage.sync || storageArea;
  window.chrome.storage.local = window.chrome.storage.local || storageArea;
  window.chrome.storage.onChanged = window.chrome.storage.onChanged || { addListener: () => {} };
  window.chrome.runtime = window.chrome.runtime || {};
  window.chrome.runtime.sendMessage = async message => {
    if (typeof window.__ticketSniperRuntimeBridge === "function") {
      await window.__ticketSniperRuntimeBridge(message);
    }
    return { ok: true };
  };
  window.chrome.runtime.onMessage = window.chrome.runtime.onMessage || {
    addListener: listener => window.__ticketSniperRuntimeMessageListeners.push(listener)
  };
  window.chrome.runtime.getURL = () => "data:text/javascript;charset=utf-8," + encodeURIComponent(window.__ticketSniperPageHooksSource || "");
  window.__ticketSniperForceRuntimeSample = reason => {
    for (const listener of window.__ticketSniperRuntimeMessageListeners || []) {
      try {
        listener({ type: "FORCE_RUNTIME_SAMPLE", payload: { reason } }, {}, () => {});
      } catch {}
    }
  };
})();
`;
}

function normalizeOptionalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let url;
  try { url = new URL(raw); } catch { throw httpError(400, "Enter a valid HTTP or HTTPS URL."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw httpError(400, "Only HTTP and HTTPS URLs can be opened.");
  return url.href;
}

function isBlankPage(page) {
  return !page || page.url() === "about:blank";
}

function isTargetClosedError(error) {
  return /target page, context or browser has been closed|browser has been closed|context.*closed|page.*closed|target closed/i.test(String(error?.message || error || ""));
}

function findBrowserExecutable() {
  if (process.env.TICKET_SNIPER_BROWSER && existsSync(process.env.TICKET_SNIPER_BROWSER)) return process.env.TICKET_SNIPER_BROWSER;
  const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  if (existsSync(edge)) return edge;
  if (existsSync(chrome)) return chrome;
  throw httpError(500, "No supported Chromium browser was found. Install Microsoft Edge or Chrome, or set TICKET_SNIPER_BROWSER.");
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeSeverity(value) {
  return ["high", "medium", "low", "info"].includes(value) ? (value === "info" ? "low" : value) : "low";
}

function captureModeForFact(source, type) {
  if (source === "a11y" && /cdp|ax/i.test(type)) return "chrome_devtools_protocol";
  if (source === "browser") return "playwright_rendered_snapshot";
  if (source === "vdom") return "framework_runtime_hooks";
  if (source === "multicontext" && /sw_fetch/.test(type)) return "first_party_helper";
  return "secure_browser_bridge";
}

function confidenceForFact(source, type, metadata = {}) {
  if (metadata?.confidence !== undefined) return Math.max(0, Math.min(1, Number(metadata.confidence) || 0));
  if (source === "a11y" && /cdp|ax/i.test(type)) return 0.95;
  return 0.86;
}

function inferOrgan(source, type) {
  const text = `${source}/${type}`.toLowerCase();
  if (/long-task|memory|cpu|wasm|gpu|script-error|console/.test(text)) return "Energy";
  if (/network|fetch|xhr|websocket|request|response|flow/.test(text)) return "Flow";
  if (/resource|supply|cdn|script|image|stylesheet/.test(text)) return "Supply";
  if (/a11y|cascade|specificity|selector|interaction|value|layout_shift/.test(text)) return "Value";
  if (/behavior|event|click|pointer|input|post_message/.test(text)) return "Behavior";
  if (/navigation|lifecycle|storage|worker|service|sw_|reload/.test(text)) return "Lifecycle";
  if (/dom|shadow|topology|layout_tree|layout_dependency|structure/.test(text)) return "Topology";
  if (/dependency|iframe|worker|message_channel|promise|vdom/.test(text)) return "Dependency";
  if (/rhythm|microtask|animation|transition|reflow|recalc|frame/.test(text)) return "Rhythm";
  return "Topology";
}

function sanitizeRuntimeFactValue(value) {
  if (Array.isArray(value)) return value.slice(0, 30).map(sanitizeRuntimeFactValue);
  if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 260) : value;
  return Object.fromEntries(Object.entries(value).slice(0, 60).map(([key, raw]) => {
    if (/cookie|token|password|secret|authorization|credential|session|email|phone|passport/i.test(key)) return [key, "[redacted]"];
    return [key, sanitizeRuntimeFactValue(raw)];
  }));
}

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
