const RUNTIME_DEFAULTS = Object.freeze({
  reportCooldownMs: 1000,
  mutationWindowMs: 1000,
  mutationBurstThreshold: 80,
  stylesheetCheckMs: 4000,
  heartbeatMs: 1000,
  maxSelectorLength: 180
});

const RUNTIME_LAYER_COVERAGE = Object.freeze({
  dom: { status: "full", captureMode: "page_injection", confidence: 0.95, reason: "MutationObserver, topology scans, events, and structural deltas are available in-page." },
  layout: { status: "full", captureMode: "page_injection", confidence: 0.9, reason: "Layout tree, forced reflow hooks, layout-shift timing, rhythm, stacking, and dependency scans are available." },
  cssom: { status: "full", captureMode: "page_injection", confidence: 0.88, reason: "Accessible stylesheets, rule mutations, cascade conflicts, specificity, animations, and style recalculation hooks are captured." },
  accessibility: { status: "best_effort", captureMode: "page_injection", confidence: 0.72, reason: "DOM-derived accessibility topology is captured here; secure browser mode adds Chrome CDP AX-tree facts." },
  javascript: { status: "full", captureMode: "page_injection", confidence: 0.9, reason: "Network APIs, timers, microtasks, Promise chains, errors, storage, WASM, and runtime scheduling are hooked." },
  shadow: { status: "full", captureMode: "page_injection", confidence: 0.86, reason: "Open shadow roots, attachShadow, slot changes, and host mappings are captured. Closed roots remain browser-protected." },
  multicontext: { status: "best_effort", captureMode: "page_injection", confidence: 0.76, reason: "Iframes, Workers, MessageChannel, postMessage, and Service Worker registration are captured; arbitrary SW fetch handlers require first-party helper instrumentation." },
  vdom: { status: "best_effort", captureMode: "framework_runtime_hooks", confidence: 0.7, reason: "React Fiber, Vue devtools hooks, and Svelte devtools surfaces are captured when frameworks expose runtime internals." },
  serviceWorkerFetch: { status: "first_party_only", captureMode: "first_party_helper", confidence: 0.6, reason: "Browsers do not allow third-party pages to inspect Service Worker fetch events directly; a first-party helper can emit sw_fetch facts." }
});

let runtimeCollectorEnabled = false;
let runtimeCollector = null;
let runtimeHookInjected = false;

const RUNTIME_STRUCTURAL_FACT_KEYS = new Set(globalThis.TicketSniperRuntimeLayer?.structuralFacts || [
  "dom/element_change",
  "dom/attribute_change",
  "dom/text_change",
  "dom/shadow_root",
  "cssom/css_rule_insert",
  "cssom/css_rule_delete",
  "layout/layout_shift",
  "shadow/shadow_root_created",
  "shadow/shadow_mapping",
  "shadow/slot_change",
  "a11y/a11y_role_change",
  "a11y/a11y_state_change",
  "runtime/js_microtask",
  "runtime/js_promise_chain",
  "runtime/js_event_loop_render",
  "runtime/js_event_loop_idle",
  "runtime/scheduling",
  "multicontext/iframe_created",
  "multicontext/iframe_loaded",
  "multicontext/post_message",
  "multicontext/worker_created",
  "multicontext/worker_message",
  "multicontext/worker_post",
  "multicontext/message_channel_created",
  "multicontext/message_channel_message",
  "multicontext/sw_register",
  "multicontext/sw_activated",
  "multicontext/sw_fetch",
  "vdom/vdom_commit",
  "vdom/vdom_update",
  "vdom/vdom_diff"
]);

initializeRuntimeCollector().catch(() => {});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.runtimeDiagnosticsSettings) return;
  setRuntimeCollectorEnabled(changes.runtimeDiagnosticsSettings.newValue?.enabled !== false);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "FORCE_RUNTIME_SAMPLE") return false;
  if (!runtimeCollectorEnabled || !runtimeCollector?.started) {
    sendResponse({ ok: false, status: "collector_not_running" });
    return false;
  }
  try {
    runtimeCollector.forceSample(message.payload?.reason || "diagnostics_tick");
    sendResponse({ ok: true, sampledAt: Date.now(), url: location.href });
  } catch (error) {
    sendResponse({ ok: false, error: error.message || String(error) });
  }
  return false;
});

async function initializeRuntimeCollector() {
  if (!isRuntimeSupportedPage()) return;
  const { runtimeDiagnosticsSettings } = await chrome.storage.sync.get("runtimeDiagnosticsSettings");
  setRuntimeCollectorEnabled(runtimeDiagnosticsSettings?.enabled !== false);
}

function setRuntimeCollectorEnabled(enabled) {
  runtimeCollectorEnabled = enabled;
  if (!enabled) {
    runtimeCollector?.stop();
    runtimeCollector = null;
    return;
  }
  if (!runtimeCollector) runtimeCollector = new RuntimeCollector();
  runtimeCollector.start();
  injectPageRuntimeHooks();
}

class RuntimeCollector {
  constructor(options = {}) {
    this.options = { ...RUNTIME_DEFAULTS, ...options };
    this.started = false;
    this.lastReports = new Map();
    this.mutationTimes = [];
    this.listeners = [];
    this.observers = [];
    this.timers = new Set();
    this.lastStylesheetSignature = "";
    this.lastForcedSampleAt = 0;
    this.sampleSequence = 0;
    this.dirtySinceSample = true;
    this.scanMarks = {
      structure: 0,
      stylesheets: 0,
      animation: 0,
      layout: 0,
      accessibility: 0,
      vdom: 0,
      protection: 0
    };
    this.sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    this.pageFactQueue = [];
    this.pageFactFlushScheduled = false;
    this.lastBridgeFactId = 0;
    this.seenBridgeFactIds = new Set();
    this.lastRelaySeenWriteAt = 0;
    this.lastRelaySeenKey = "";
    this.lastUrl = location.href;
    this.webBloomberg = createRuntimeBloombergState(this.sessionId);
  }

  start() {
    if (this.started || !isRuntimeSupportedPage()) return;
    this.started = true;
    this.startRuntimeLayer();
    this.startDiagnosticsLayer();
  }

  startRuntimeLayer() {
    this.observeDocument();
    this.observePageHookFacts();
    this.observeShadowRoots();
    this.observeLayoutRuntime();
  }

  startDiagnosticsLayer() {
    this.emitDiagnosticFact("runtime", "collector-state", { state: "started", visibility: document.visibilityState }, { readyState: document.readyState });
    this.observeUrlChanges();
    this.observeStorageSnapshots();
    this.observeRuntimeErrors();
    this.observePerformance();
    this.scanAccessibilityTree();
    this.observeResources();
    this.scanExistingStructure();
    this.scanProtectionSurface();
    this.scanVirtualDomSurface();
    this.emitLayerCoverage("collector_start");
    setTimeout(() => this.scanProtectionSurface(), 750);
    setTimeout(() => this.scanProtectionSurface(), 1800);
    this.addTimer(() => this.scanStylesheets(), this.options.stylesheetCheckMs);
    this.addTimer(() => this.scanAnimationStyles(), this.options.stylesheetCheckMs);
    this.addTimer(() => this.scanLayoutTree(), 2000);
    this.addTimer(() => this.scanAccessibilityTree(), 6000);
    this.addTimer(() => this.scanVirtualDomSurface(), 6000);
    this.addTimer(() => this.scanProtectionSurface(), 4000);
    this.addTimer(() => this.emitLayerCoverage("periodic_coverage"), 5000);
    this.addTimer(() => this.emitHeartbeat(), this.options.heartbeatMs);
    this.addTimer(() => this.flushWebBloombergWindow("periodic_upload"), 1000);
  }

  stop() {
    this.started = false;
    for (const observer of this.observers) observer.disconnect();
    for (const timer of this.timers) clearInterval(timer);
    for (const [target, type, listener, options] of this.listeners) target.removeEventListener(type, listener, options);
    this.observers = [];
    this.timers.clear();
    this.listeners = [];
  }

  addTimer(callback, intervalMs) {
    const id = setInterval(callback, intervalMs);
    this.timers.add(id);
    return id;
  }

  addListener(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    this.listeners.push([target, type, listener, options]);
  }

  emit(source, type, value = {}, metadata = {}) {
    if (isRuntimeStructuralFact(source, type)) return this.emitRuntimeFact(source, type, value, metadata);
    return this.emitDiagnosticFact(source, type, value, metadata);
  }

  emitRuntimeFact(source, type, value = {}, metadata = {}) {
    if (!runtimeCollectorEnabled || !this.started) return;
    const timestamp = Date.now();
    const channel = `${source}/${type}`;
    const captureMode = metadata.captureMode || captureModeForRuntimeFact(source, type);
    const runtimeLayer = runtimeLayerFact(source, type, value, metadata);
    const fact = {
      timestamp,
      source,
      type,
      channel,
      runtimeLayer,
      organ: inferRuntimeOrgan(source, type),
      confidence: runtimeFactConfidence(source, type, metadata),
      captureMode,
      payload: sanitizeRuntimeValue({ value, metadata }),
      value: sanitizeRuntimeValue(value),
      metadata: sanitizeRuntimeValue(metadata),
      context: runtimeFactContext(this.sessionId)
    };
    const key = `${source}:${type}:${stableRuntimeKey(fact.value, fact.metadata)}`;
    const previous = this.lastReports.get(key) || 0;
    if (fact.timestamp - previous < this.options.reportCooldownMs) return;
    this.lastReports.set(key, fact.timestamp);
    chrome.runtime.sendMessage({
      type: "RUNTIME_FACT_DETECTED",
      payload: {
        timestamp: fact.timestamp,
        page: sanitizeRuntimePageLocation(),
        fact
      }
    }).catch(() => {});
  }

  emitDiagnosticFact(source, type, value = {}, metadata = {}) {
    if (!runtimeCollectorEnabled || !this.started) return;
    const timestamp = Date.now();
    const channel = `${source}/${type}`;
    const severity = normalizeRuntimeSeverity(value?.severity);
    const captureMode = metadata.captureMode || captureModeForRuntimeFact(source, type);
    const runtimeLayer = runtimeLayerFact(source, type, value, metadata);
    const fact = {
      timestamp,
      source,
      type,
      channel,
      runtimeLayer,
      organ: inferRuntimeOrgan(source, type),
      severity,
      confidence: runtimeFactConfidence(source, type, metadata),
      captureMode,
      payload: sanitizeRuntimeValue({ value, metadata }),
      value: sanitizeRuntimeValue(value),
      metadata: sanitizeRuntimeValue(metadata),
      context: runtimeFactContext(this.sessionId)
    };
    const key = `diagnostic:${source}:${type}:${stableRuntimeKey(fact.value, fact.metadata)}`;
    const previous = this.lastReports.get(key) || 0;
    if (fact.timestamp - previous < this.options.reportCooldownMs) return;
    this.lastReports.set(key, fact.timestamp);
    this.recordWebBloombergFact(fact);
    chrome.runtime.sendMessage({
      type: "DIAGNOSTIC_FACT_DETECTED",
      payload: {
        timestamp: fact.timestamp,
        page: sanitizeRuntimePageLocation(),
        fact
      }
    }).catch(() => {});
  }

  forceSample(reason = "diagnostics_tick") {
    const now = Date.now();
    this.sampleSequence += 1;
    const dirty = this.dirtySinceSample;
    this.lastForcedSampleAt = now;
    this.emitDiagnosticFact("runtime", "diagnostics_tick", {
      severity: "info",
      reason,
      sequence: this.sampleSequence,
      dirty,
      visibility: document.visibilityState,
      readyState: document.readyState
    }, { url: sanitizeRuntimeUrl(location.href) });
    this.runSampleScan("structure", 5000, dirty, () => this.scanExistingStructure());
    this.runSampleScan("stylesheets", 4000, dirty, () => this.scanStylesheets());
    this.runSampleScan("animation", 5000, dirty, () => this.scanAnimationStyles());
    this.runSampleScan("layout", 3000, dirty, () => this.scanLayoutTree());
    this.runSampleScan("accessibility", 10000, dirty, () => this.scanAccessibilityTree());
    this.runSampleScan("vdom", 10000, false, () => this.scanVirtualDomSurface());
    this.runSampleScan("protection", 15000, dirty, () => this.scanProtectionSurface());
    this.emitLayerCoverage(reason);
    this.emitHeartbeat();
    this.flushWebBloombergWindow(reason);
    this.dirtySinceSample = false;
  }

  recordWebBloombergFact(fact) {
    const now = performance.now();
    const wallNow = Date.now();
    for (const bucketMs of [10, 50, 100, 1000]) {
      const bucketStart = Math.floor(now / bucketMs) * bucketMs;
      const key = `${bucketMs}:${bucketStart}`;
      if (!this.webBloomberg.buckets.has(key)) {
        this.webBloomberg.buckets.set(key, {
          startPerf: bucketStart,
          endPerf: bucketStart + bucketMs,
          startWall: wallNow - Math.max(0, now - bucketStart),
          endWall: wallNow - Math.max(0, now - (bucketStart + bucketMs)),
          bucket_ms: bucketMs,
          metrics: {},
          dependency_edges: [],
          risk_hints: []
        });
      }
      const window = this.webBloomberg.buckets.get(key);
      const metric = webBloombergMetricForFact(fact);
      window.metrics[metric] = (window.metrics[metric] || 0) + 1;
      window.metrics.behavior = (window.metrics.behavior || 0) + 1;
      const edge = webBloombergEdgeForFact(fact, metric);
      if (edge && window.dependency_edges.length < 80) window.dependency_edges.push(edge);
      const hint = webBloombergRiskHintForFact(fact, metric);
      if (hint && window.risk_hints.length < 40) window.risk_hints.push(hint);
    }
    this.trimWebBloombergBuckets(now);
  }

  trimWebBloombergBuckets(now = performance.now()) {
    for (const [key, value] of this.webBloomberg.buckets.entries()) {
      if (now - value.endPerf > 6000) this.webBloomberg.buckets.delete(key);
    }
  }

  flushWebBloombergWindow(reason = "periodic_upload") {
    const now = performance.now();
    const uploadWindows = [...this.webBloomberg.buckets.values()]
      .filter(window => window.bucket_ms === 1000 && window.endPerf <= now && window.endPerf > this.webBloomberg.lastUploadedPerf)
      .slice(-5)
      .map(window => normalizeRuntimeBloombergWindow(window, this.webBloomberg, reason));
    if (!uploadWindows.length) return;
    this.webBloomberg.lastUploadedPerf = Math.max(...uploadWindows.map(window => window.end_perf || 0), this.webBloomberg.lastUploadedPerf);
    for (const uploadWindow of uploadWindows) {
      const { end_perf, ...window } = uploadWindow;
      this.emit("web_bloomberg", "behavior-window", {
        severity: webBloombergWindowSeverity(window),
        window,
        uploadPolicy: "compact_window_records_only",
        rawEventsUploaded: false
      }, {
        captureMode: "browser_local_millisecond_aggregation",
        reason
      });
    }
  }

  runSampleScan(name, cadenceMs, dirty, callback) {
    const now = Date.now();
    const due = now - (this.scanMarks[name] || 0) >= cadenceMs;
    if (!due && !dirty) return;
    this.scanMarks[name] = now;
    callback();
  }

  observeDocument() {
    if (!document.documentElement) return;
    const observer = new MutationObserver(mutations => this.handleMutations(mutations));
    observer.observe(document.documentElement, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true
    });
    this.observers.push(observer);
    this.addListener(document, "visibilitychange", () => {
      this.emit("runtime", "page-lifecycle", { state: document.visibilityState });
    }, { passive: true });
    this.addListener(window, "pagehide", event => {
      this.emit("runtime", "page-lifecycle", { state: "pagehide", persisted: Boolean(event.persisted) });
    }, { passive: true });
  }

  observePageHookFacts() {
    const relay = fact => this.enqueuePageHookFact(fact);
    this.addListener(window, "message", event => {
      if (!isRuntimeSupportedPage()) return;
      const fact = event.data?.channel === "TICKET_SNIPER_PAGE_FACT" ? event.data.fact : null;
      relay(fact);
    }, false);
    this.addListener(window, "ticket-sniper-page-fact", event => relay(event.detail), false);
    const relayJson = event => this.consumeBridgeEnvelopeJson(event.detail);
    this.addListener(window, "ticket-sniper-page-fact-json", relayJson, false);
    this.addListener(document, "ticket-sniper-page-fact-json", relayJson, false);
    if (document.documentElement) {
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.type === "attributes") {
            this.consumeBridgeAttribute(mutation);
            this.consumeBridgeBuffer();
          }
          if (mutation.type === "childList") this.consumeBridgeNodes(mutation);
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-ticket-sniper-fact", "data-ticket-sniper-fact-buffer"],
        childList: true
      });
      this.observers.push(observer);
      this.addTimer(() => {
        this.consumeCurrentBridgeAttribute();
        this.consumeBridgeBuffer();
      }, 250);
    }
  }

  consumeCurrentBridgeAttribute() {
    if (!document.documentElement) return;
    const raw = document.documentElement.getAttribute("data-ticket-sniper-fact") || "";
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const id = Number(parsed.id) || 0;
      if (id && this.seenBridgeFactIds.has(id)) return;
      this.lastBridgeFactId = id;
      if (id) this.rememberBridgeFactId(id);
      this.enqueuePageHookFact(parsed.fact);
    } catch {
      // Ignore malformed bridge payloads.
    }
  }

  consumeBridgeEnvelopeJson(raw) {
    if (!raw || typeof raw !== "string") return;
    try {
      const parsed = JSON.parse(raw);
      const id = Number(parsed.id) || 0;
      if (id && this.seenBridgeFactIds.has(id)) return;
      if (id) {
        this.lastBridgeFactId = Math.max(this.lastBridgeFactId, id);
        this.rememberBridgeFactId(id);
      }
      this.enqueuePageHookFact(parsed.fact);
    } catch {
      // Ignore malformed bridge payloads.
    }
  }

  consumeBridgeBuffer() {
    if (!document.documentElement) return;
    const raw = document.documentElement.getAttribute("data-ticket-sniper-fact-buffer") || "";
    if (!raw) return;
    try {
      const entries = JSON.parse(raw);
      if (!Array.isArray(entries)) return;
      for (const entry of entries) {
        const id = Number(entry?.id) || 0;
        if (id && this.seenBridgeFactIds.has(id)) continue;
        if (id) {
          this.lastBridgeFactId = Math.max(this.lastBridgeFactId, id);
          this.rememberBridgeFactId(id);
        }
        this.enqueuePageHookFact(entry?.fact);
      }
    } catch {
      // Ignore malformed bridge payloads.
    }
  }

  rememberBridgeFactId(id) {
    this.seenBridgeFactIds.add(id);
    if (this.seenBridgeFactIds.size <= 160) return;
    this.seenBridgeFactIds = new Set([...this.seenBridgeFactIds].slice(-80));
  }

  enqueuePageHookFact(fact) {
    if (!fact || !fact.source || !fact.type) return;
    this.pageFactQueue.push(fact);
    if (this.pageFactFlushScheduled) return;
    this.pageFactFlushScheduled = true;
    setTimeout(() => this.flushPageHookFacts(), 0);
  }

  flushPageHookFacts() {
    this.pageFactFlushScheduled = false;
    const facts = this.pageFactQueue.splice(0, 50);
    for (const fact of facts) {
      const source = String(fact.source).slice(0, 40);
      const type = String(fact.type).slice(0, 60);
      this.recordRelaySeen(source, type);
      this.emit(source, type, sanitizeRuntimeValue(fact.value || {}), sanitizeRuntimeValue(fact.metadata || {}));
    }
    if (this.pageFactQueue.length) {
      this.pageFactFlushScheduled = true;
      setTimeout(() => this.flushPageHookFacts(), 25);
    }
  }

  recordRelaySeen(source, type) {
    const now = Date.now();
    const key = `${source}/${type}`;
    if (key === this.lastRelaySeenKey && now - this.lastRelaySeenWriteAt < 1000) return;
    this.lastRelaySeenKey = key;
    this.lastRelaySeenWriteAt = now;
    chrome.storage.local.set({ runtimeRelaySeen: { checkedAt: now, source, type } }).catch(() => {});
  }

  handleMutations(mutations) {
    const now = Date.now();
    this.dirtySinceSample = true;
    this.mutationTimes.push(...mutations.map(() => now));
    trimRuntimeWindow(this.mutationTimes, this.options.mutationWindowMs);
    if (this.mutationTimes.length > this.options.mutationBurstThreshold) {
      this.emit("dom", "mutation-burst", {
        severity: "medium",
        count: this.mutationTimes.length,
        windowMs: this.options.mutationWindowMs
      });
    }

    const bridgeMutations = new Set();
    for (const mutation of mutations) {
      if (mutation.type === "childList") this.consumeBridgeNodes(mutation);
      if (mutation.type === "attributes" && this.consumeBridgeAttribute(mutation)) bridgeMutations.add(mutation);
    }

    for (const mutation of mutations.filter(item => !bridgeMutations.has(item)).slice(0, 20)) {
      if (mutation.type === "childList") this.emitChildListFact(mutation);
      else if (mutation.type === "attributes") {
        this.emitAttributeFact(mutation);
      }
      else if (mutation.type === "characterData") this.emitTextFact(mutation);
    }
  }

  consumeBridgeAttribute(mutation) {
    if (mutation.attributeName !== "data-ticket-sniper-fact" || !(mutation.target instanceof Element)) return false;
    const raw = mutation.target.getAttribute("data-ticket-sniper-fact") || "";
    try {
      const parsed = JSON.parse(raw);
      this.enqueuePageHookFact(parsed.fact);
    } catch {
      // Ignore malformed bridge payloads.
    }
    return true;
  }

  consumeBridgeNodes(mutation) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE || node.getAttribute?.("data-ticket-sniper-fact-node") !== "true") continue;
      try {
        const parsed = JSON.parse(node.getAttribute("content") || "");
        this.enqueuePageHookFact(parsed.fact);
      } catch {
        // Ignore malformed bridge payloads.
      }
    }
  }

  emitChildListFact(mutation) {
    const added = [...mutation.addedNodes].filter(node => node.nodeType === Node.ELEMENT_NODE && node.getAttribute?.("data-ticket-sniper-fact-node") !== "true");
    const removed = [...mutation.removedNodes].filter(node => node.nodeType === Node.ELEMENT_NODE && node.getAttribute?.("data-ticket-sniper-fact-node") !== "true");
    if (!added.length && !removed.length) return;
    const element = added[0] || removed[0];
    this.emit("dom", "element-change", {
      added: added.length,
      removed: removed.length,
      tag: element.tagName ? element.tagName.toLowerCase() : null,
      severity: added.length + removed.length > 8 ? "medium" : "low"
    }, {
      selector: stableSelector(element),
      path: stableDomPath(element),
      rect: element.getBoundingClientRect ? rectSnapshot(element) : null
    });
  }

  emitAttributeFact(mutation) {
    if (!(mutation.target instanceof Element)) return;
    const name = mutation.attributeName || "";
    if (isSensitiveRuntimeName(name)) return;
    const target = mutation.target;
    this.emit("dom", "attribute-change", {
      name,
      tag: target.tagName.toLowerCase(),
      severity: /class|style|aria-|role|disabled|hidden/i.test(name) ? "low" : "info"
    }, {
      selector: stableSelector(target),
      path: stableDomPath(target),
      rect: rectSnapshot(target)
    });
  }

  emitTextFact(mutation) {
    const parent = mutation.target?.parentElement;
    if (!parent || isSensitiveRuntimeElement(parent)) return;
    const length = String(mutation.target.data || "").trim().length;
    this.emit("dom", "text-change", {
      length,
      bucket: length > 120 ? "large" : length > 24 ? "medium" : "small",
      severity: "info"
    }, {
      selector: stableSelector(parent),
      path: stableDomPath(parent)
    });
  }

  observeShadowRoots() {
    const scan = () => {
      for (const element of [...document.querySelectorAll("*")].slice(0, 2000)) {
        const root = element.shadowRoot;
        if (!root || root.__ticketSniperObserved) continue;
        root.__ticketSniperObserved = true;
        this.emit("dom", "shadow-root", {
          mode: root.mode,
          childCount: root.childNodes.length,
          severity: "low"
        }, {
          hostSelector: stableSelector(element),
          hostPath: stableDomPath(element)
        });
        const observer = new MutationObserver(mutations => this.handleMutations(mutations));
        observer.observe(root, { childList: true, attributes: true, characterData: true, subtree: true });
        this.observers.push(observer);
      }
    };
    scan();
    this.addTimer(scan, 5000);
  }

  observeRuntimeErrors() {
    this.emit("runtime", "console", {
      level: "info",
      message: "console channel initialized",
      severity: "low"
    });
    this.addListener(window, "error", event => {
      this.emit("runtime", "script-error", {
        severity: "high",
        message: safeRuntimeMessage(event.message),
        file: sanitizeRuntimeUrl(event.filename),
        line: Number(event.lineno) || null,
        column: Number(event.colno) || null
      });
    }, true);
    this.addListener(window, "unhandledrejection", event => {
      this.emit("runtime", "unhandled-rejection", {
        severity: "high",
        message: safeRuntimeMessage(event.reason?.message || event.reason || "Unhandled promise rejection")
      });
    }, true);
  }

  observeUrlChanges() {
    this.emit("runtime", "navigation", {
      kind: "document",
      url: sanitizeRuntimeUrl(location.href),
      severity: "low"
    });
    this.addTimer(() => {
      if (location.href === this.lastUrl) return;
      const previous = this.lastUrl;
      this.lastUrl = location.href;
      this.emit("runtime", "navigation", {
        kind: "url-change",
        previous: sanitizeRuntimeUrl(previous),
        url: sanitizeRuntimeUrl(location.href),
        severity: "low"
      });
    }, 250);
  }

  observeStorageSnapshots() {
    let previous = "";
    const scan = () => {
      const snapshot = {
        local: storageSnapshot(localStorage, "local"),
        session: storageSnapshot(sessionStorage, "session"),
        cookie: { area: "cookie", count: document.cookie ? document.cookie.split(";").length : 0, signature: hashRuntimeString(document.cookie || "") }
      };
      const signature = hashRuntimeString(JSON.stringify(snapshot));
      if (!previous || previous !== signature) {
        this.emit("storage", "storage-snapshot", {
          severity: "low",
          signature,
          areas: snapshot
        });
      }
      previous = signature;
    };
    scan();
    this.addTimer(scan, 1000);
  }

  observePerformance() {
    if (!("PerformanceObserver" in window)) return;
    try {
      const longTaskObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.emit("performance", "long-task", {
            severity: entry.duration > 250 ? "high" : "medium",
            durationMs: Math.round(entry.duration)
          });
        }
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });
      this.observers.push(longTaskObserver);
    } catch {
      // Long task timing is not available in every browser context.
    }
  }

  observeLayoutRuntime() {
    if ("PerformanceObserver" in window) {
      try {
        const shiftObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.emit("layout", "layout_shift", {
              severity: entry.value > 0.15 ? "medium" : "low",
              shiftAmount: Number(entry.value || 0),
              hadRecentInput: Boolean(entry.hadRecentInput),
              sourceCount: entry.sources?.length || 0
            });
          }
        });
        shiftObserver.observe({ type: "layout-shift", buffered: true });
        this.observers.push(shiftObserver);
      } catch {
        // Layout shift timing is not available in every browser context.
      }
    }
    let lastFrame = performance.now();
    let frames = 0;
    const tick = now => {
      if (!this.started) return;
      frames += 1;
      if (frames % 30 === 0) {
        this.emit("layout", "layout_rhythm", {
          severity: now - lastFrame > 40 ? "medium" : "info",
          frameIntervalMs: Math.round(now - lastFrame)
        });
      }
      lastFrame = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  scanLayoutTree() {
    const nodes = [...document.querySelectorAll("body, body *")].filter(node => !isRuntimeHidden(node)).slice(0, 900);
    const displayCounts = {};
    const stacking = [];
    const layoutNodes = [];
    const layoutEdges = [];
    const paintRegions = [];
    const layoutTypes = {};
    let paintOrder = 0;
    for (const node of nodes) {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const layoutType = inferLayoutType(style);
      displayCounts[style.display || "unknown"] = (displayCounts[style.display || "unknown"] || 0) + 1;
      layoutTypes[layoutType] = (layoutTypes[layoutType] || 0) + 1;
      if (layoutNodes.length < 40) {
        layoutNodes.push({
          id: stableDomPath(node),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          zIndex: style.zIndex,
          display: style.display,
          position: style.position,
          margin: style.margin,
          padding: style.padding,
          border: style.borderWidth,
          layoutType,
          paintOrder
        });
      }
      if (layoutEdges.length < 80 && node.parentElement) {
        layoutEdges.push({ parentId: stableDomPath(node.parentElement), childId: stableDomPath(node), dependencyType: "layout-flow" });
      }
      if (style.position !== "static" || style.zIndex !== "auto" || Number(style.opacity) < 1 || style.transform !== "none") {
        stacking.push({ selector: stableSelector(node), zIndex: style.zIndex, position: style.position, paintOrder: paintOrder++ });
      }
      if (paintRegions.length < 40 && rect.width > 0 && rect.height > 0) {
        paintRegions.push({ id: stableDomPath(node), areaBucket: bucketNumber(rect.width * rect.height), visible: true, layoutType });
      }
    }
    this.emit("layout", "layout_dependency", {
      severity: nodes.length > 700 ? "medium" : "low",
      nodeCount: nodes.length,
      displayCounts,
      layoutTypes,
      stackingContextCount: stacking.length
    }, {
      layoutNodes,
      layoutEdges,
      paintRegions,
      stacking: stacking.slice(0, 20)
    });
    this.emit("layout", "layout_tree", {
      severity: nodes.length > 700 ? "medium" : "low",
      nodeCount: nodes.length,
      edgeCount: layoutEdges.length,
      stackingContextCount: stacking.length
    }, {
      layoutNodes,
      layoutEdges,
      paintRegions,
      captureMode: "page_injection"
    });
  }

  scanAnimationStyles() {
    const animated = [];
    const transitioned = [];
    for (const node of [...document.querySelectorAll("body, body *")].filter(item => !isRuntimeHidden(item)).slice(0, 900)) {
      const style = getComputedStyle(node);
      if (style.animationName && style.animationName !== "none") {
        animated.push({ selector: stableSelector(node), name: style.animationName, duration: style.animationDuration, timingFunction: style.animationTimingFunction });
      }
      if (style.transitionProperty && style.transitionProperty !== "all 0s ease 0s" && style.transitionDuration !== "0s") {
        transitioned.push({ selector: stableSelector(node), property: style.transitionProperty, duration: style.transitionDuration, timingFunction: style.transitionTimingFunction });
      }
      if (animated.length >= 20 && transitioned.length >= 20) break;
    }
    if (animated.length) this.emit("cssom", "css_animation", { severity: "low", count: animated.length }, { animations: animated.slice(0, 20) });
    if (transitioned.length) this.emit("cssom", "css_transition", { severity: "low", count: transitioned.length }, { transitions: transitioned.slice(0, 20) });
  }

  scanAccessibilityTree() {
    const nodes = [...document.querySelectorAll("a, button, input, select, textarea, [role], [aria-label], [aria-labelledby], [aria-describedby], h1, h2, h3, h4, h5, h6, main, nav, header, footer")].filter(node => !isRuntimeHidden(node)).slice(0, 700);
    let missingNames = 0;
    let brokenRefs = 0;
    const states = [];
    const relationships = [];
    const roles = {};
    for (const node of nodes) {
      const role = inferRuntimeRole(node);
      roles[role] = (roles[role] || 0) + 1;
      const needsName = /button|link|textbox|combobox|checkbox|radio|img/.test(role);
      const name = accessibleRuntimeName(node);
      if (needsName && !name) missingNames += 1;
      for (const attr of ["aria-labelledby", "aria-describedby", "aria-owns"]) {
        const refs = String(node.getAttribute(attr) || "").split(/\s+/).filter(Boolean);
        brokenRefs += refs.filter(id => !document.getElementById(id)).length;
        for (const id of refs.slice(0, 8)) relationships.push({ from: stableDomPath(node), to: id, type: attr.replace("aria-", "") });
      }
      if (states.length < 80) states.push({
        nodeId: stableDomPath(node),
        role,
        nameHash: hashRuntimeString(name || ""),
        checked: node.getAttribute("aria-checked"),
        disabled: node.getAttribute("aria-disabled") || String(Boolean(node.disabled || node.hasAttribute("disabled"))),
        expanded: node.getAttribute("aria-expanded"),
        selected: node.getAttribute("aria-selected")
      });
    }
    if (missingNames || brokenRefs) {
      this.emit("a11y", brokenRefs ? "a11y_conflict" : "a11y_break", {
        severity: missingNames + brokenRefs > 8 ? "medium" : "low",
        missingNames,
        brokenRefs,
        scanned: nodes.length
      }, { roles, states: states.slice(0, 80), relationships: relationships.slice(0, 80) });
    } else {
      this.emit("a11y", "a11y_topology", { severity: "info", scanned: nodes.length, roles }, { states: states.slice(0, 80), relationships: relationships.slice(0, 80) });
    }
  }

  scanVirtualDomSurface() {
    const frameworks = [];
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) frameworks.push("react");
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) frameworks.push("vue");
    if (window.__SVELTE_DEVTOOLS__) frameworks.push("svelte");
    const react = summarizeReactRuntime();
    const vue = summarizeVueRuntime();
    const svelte = summarizeSvelteRuntime();
    const reactRoots = react.rootCount || countReactRoots();
    if (frameworks.length || reactRoots || vue.appCount || svelte.rootCount) {
      this.emit("vdom", "vdom_topology", {
        severity: "low",
        frameworks,
        reactRoots,
        reactFiberNodes: react.nodeCount,
        reactChangedProps: react.changedProps,
        reactChangedState: react.changedState,
        vueApps: vue.appCount,
        vueComponents: vue.componentCount,
        svelteRoots: svelte.rootCount
      }, {
        react: react.sample,
        vue: vue.sample,
        svelte: svelte.sample,
        captureMode: "framework_runtime_hooks"
      });
      if (react.changedProps || react.changedState || vue.componentCount || svelte.rootCount) {
        this.emit("vdom", "vdom_diff", {
          severity: react.changedProps + react.changedState > 20 ? "medium" : "low",
          reactChangedProps: react.changedProps,
          reactChangedState: react.changedState,
          vueComponents: vue.componentCount,
          svelteRoots: svelte.rootCount
        }, { captureMode: "framework_runtime_hooks" });
      }
    } else {
      this.emit("vdom", "vdom_capability", {
        severity: "info",
        status: "best_effort",
        reason: "No public framework runtime hook was exposed on this page."
      }, { captureMode: "framework_runtime_hooks" });
    }
  }

  observeResources() {
    this.emit("network", "request", {
      kind: "document",
      method: "GET",
      url: sanitizeRuntimeUrl(location.href),
      fallback: true
    });
    this.emit("network", "response", {
      kind: "document",
      status: 0,
      synthetic: true,
      durationMs: Math.round(performance.now()),
      fallback: true
    }, {
      resource: sanitizeRuntimeUrl(location.href)
    });
    if (!("PerformanceObserver" in window)) return;
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType === "xmlhttprequest" || entry.initiatorType === "fetch" || entry.initiatorType === "script") {
            this.emit("network", "request", {
              kind: entry.initiatorType,
              method: "GET",
              url: sanitizeRuntimeUrl(entry.name),
              fallback: true
            });
            this.emit("network", "response", {
              kind: entry.initiatorType,
              status: 0,
              synthetic: true,
              durationMs: Math.round(entry.duration || 0),
              transferBucket: bucketNumber(entry.transferSize || 0),
              fallback: true
            }, {
              resource: sanitizeRuntimeUrl(entry.name)
            });
            this.emit("network", "resource-observed", {
              initiatorType: entry.initiatorType,
              durationMs: Math.round(entry.duration || 0),
              transferBucket: bucketNumber(entry.transferSize || 0),
              severity: entry.duration > 5000 ? "medium" : "info"
            }, {
              resource: sanitizeRuntimeUrl(entry.name)
            });
          }
        }
      });
      observer.observe({ type: "resource", buffered: true });
      this.observers.push(observer);
    } catch {
      // Resource timing can be unavailable on some pages.
    }
  }

  scanExistingStructure() {
    const forms = document.querySelectorAll("form").length;
    const iframes = document.querySelectorAll("iframe").length;
    const scripts = document.scripts.length;
    const shadowHosts = [...document.querySelectorAll("*")].filter(element => element.shadowRoot).length;
    const eventSurface = summarizeDomEventSurface();
    this.emit("dom", "structure-snapshot", {
      forms,
      iframes,
      scripts,
      shadowHosts,
      eventSurface,
      severity: "low"
    });
    for (const iframe of [...document.querySelectorAll("iframe")].slice(0, 10)) {
      this.emit("dom", "iframe-observed", {
        severity: "low",
        sandboxed: iframe.hasAttribute("sandbox")
      }, {
        selector: stableSelector(iframe),
        resource: sanitizeRuntimeUrl(iframe.getAttribute("src") || "")
      });
    }
  }

  scanProtectionSurface() {
    const html = document.documentElement.innerHTML.slice(0, 300000).toLowerCase();
    const challengeChecks = [
      ["cloudflare", "js-challenge", ["cf-challenge", "cf-captcha", "checking your browser", "turnstile"]],
      ["akamai", "js-challenge", ["akamai bot manager", "_abck", "bm_sz"]],
      ["perimeterx", "js-challenge", ["perimeterx", "_px", "px-captcha"]],
      ["datadome", "js-challenge", ["datadome", "dd_cid"]],
      ["imperva", "js-challenge", ["imperva", "incapsula", "visid_incap"]]
    ];
    for (const [provider, kind, markers] of challengeChecks) {
      const marker = markers.find(item => html.includes(item));
      if (marker) {
        this.emit("anti_crawler", "challenge", {
          provider,
          kind,
          severity: "high"
        }, { marker });
      }
    }
    this.scanProtectionNodes();
    this.scanCaptchaFrames();
    this.scanProtectionScripts();
  }

  scanProtectionNodes() {
    const nodes = [...document.querySelectorAll("body, body *")].slice(0, 2500);
    let reported = 0;
    for (const node of nodes) {
      const markerText = [
        node.id || "",
        typeof node.className === "string" ? node.className : "",
        node.getAttribute("data-testid") || "",
        node.getAttribute("data-cf-beacon") || "",
        String(node.textContent || "").slice(0, 160)
      ].join(" ").toLowerCase();
      const provider = /cf-|cloudflare|checking your browser|turnstile/.test(markerText) ? "cloudflare" : detectRuntimeProviderFromUrl(markerText);
      if (!provider && !/challenge|captcha|checking your browser/.test(markerText)) continue;
      this.emit("anti_crawler", "challenge", {
        provider,
        kind: /captcha/.test(markerText) ? "captcha" : "challenge-node",
        severity: "high"
      }, {
        selector: stableSelector(node),
        marker: markerText.replace(/\s+/g, " ").slice(0, 120),
        hidden: isRuntimeHidden(node)
      });
      reported += 1;
      if (reported >= 8) break;
    }
  }

  scanCaptchaFrames() {
    const selectors = [
      "iframe[src*='recaptcha' i]",
      "iframe[src*='hcaptcha' i]",
      "iframe[src*='captcha' i]",
      "div[class*='h-captcha' i]",
      "div[class*='g-recaptcha' i]"
    ];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      const src = node.getAttribute("src") || "";
      this.emit("anti_crawler", "challenge", {
        provider: detectRuntimeProviderFromUrl(src) || runtimeProviderFromSelector(selector),
        kind: "captcha",
        severity: "high"
      }, { selector, resource: sanitizeRuntimeUrl(src), hidden: isRuntimeHidden(node) });
    }
  }

  scanProtectionScripts() {
    for (const script of [...document.scripts]) {
      const src = script.src || "";
      if (!src) continue;
      const provider = detectRuntimeProviderFromUrl(src);
      const lower = src.toLowerCase();
      if (provider || /fingerprint|fpjs|botd|deviceid|captcha|challenge/.test(lower)) {
        this.emit("anti_crawler", "fingerprint", {
          provider,
          technique: /captcha|challenge/.test(lower) ? "challenge-script" : "fingerprint-script",
          severity: provider ? "medium" : "low"
        }, { resource: sanitizeRuntimeUrl(src) });
      }
    }
  }

  scanStylesheets() {
    const sheets = [];
    const selectorCounts = {};
    const selectorProperties = new Map();
    const conflicts = [];
    let scannedRules = 0;
    for (const sheet of [...document.styleSheets].slice(0, 80)) {
      try {
        sheets.push(`${sanitizeRuntimeUrl(sheet.href || "inline")}:${sheet.cssRules?.length || 0}`);
        for (const rule of [...(sheet.cssRules || [])].slice(0, 35)) {
          const selector = rule.selectorText || "";
          const specificity = selector ? calculateSpecificity(selector) : { score: 0 };
          if (selector) selectorCounts[selector.slice(0, 80)] = specificity.score;
          if (selector && rule.style) {
            for (const property of [...rule.style].slice(0, 60)) {
              const key = `${selector}::${property}`;
              const value = rule.style.getPropertyValue(property);
              const previous = selectorProperties.get(key);
              if (previous && previous.value !== value && conflicts.length < 40) {
                conflicts.push({
                  selector: selector.slice(0, 120),
                  property,
                  previousHash: hashRuntimeString(previous.value),
                  nextHash: hashRuntimeString(value),
                  specificity: specificity.score,
                  href: sanitizeRuntimeUrl(sheet.href || "inline")
                });
              }
              selectorProperties.set(key, { value, specificity: specificity.score });
            }
          }
          this.emit("cssom", "css-rule", {
            op: "snapshot",
            ruleType: rule.type,
            ruleHash: hashRuntimeString(rule.cssText || ""),
            specificity: specificity.score,
            severity: "info"
          }, {
            href: sanitizeRuntimeUrl(sheet.href || "inline")
          });
          scannedRules += 1;
          if (scannedRules >= 220) break;
        }
      } catch {
        sheets.push(`${sanitizeRuntimeUrl(sheet.href || "cross-origin")}:restricted`);
      }
      if (scannedRules >= 220) break;
    }
    const signature = hashRuntimeString(sheets.join("|"));
    if (conflicts.length) {
      this.emit("cssom", "cascade_conflict", {
        severity: conflicts.length > 12 ? "medium" : "low",
        conflictCount: conflicts.length,
        scannedRules
      }, { conflicts, captureMode: "page_injection" });
    }
    if (this.lastStylesheetSignature && this.lastStylesheetSignature !== signature) {
      this.emit("cssom", "stylesheet-change", {
        severity: "medium",
        count: sheets.length,
        signature,
        selectorSample: selectorCounts
      });
    }
    this.lastStylesheetSignature = signature;
  }

  emitHeartbeat() {
    const memory = performance.memory ? {
      usedBucket: bucketNumber(performance.memory.usedJSHeapSize),
      totalBucket: bucketNumber(performance.memory.totalJSHeapSize)
    } : null;
    this.emit("runtime", "health-heartbeat", {
      severity: "info",
      readyState: document.readyState,
      visibility: document.visibilityState,
      memory
    });
  }

  emitLayerCoverage(reason = "coverage") {
    this.emit("runtime", "layer_coverage", {
      severity: "info",
      reason,
      layers: RUNTIME_LAYER_COVERAGE
    }, { captureMode: "collector_capability" });
  }
}

function injectPageRuntimeHooks() {
  if (runtimeHookInjected || !document.documentElement) return;
  runtimeHookInjected = true;
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("page-runtime-hooks.js");
  script.async = false;
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

function isRuntimeSupportedPage() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function sanitizeRuntimePageLocation() {
  return { host: location.hostname, path: location.pathname };
}

function runtimeFactContext(sessionId) {
  return {
    sessionId,
    pageUrl: `${location.origin}${location.pathname}`,
    referrer: sanitizeRuntimeUrl(document.referrer),
    userAgent: String(navigator.userAgent || "").replace(/\([^)]*\)/g, "(redacted)").slice(0, 160),
    device: {
      platform: navigator.platform || "",
      language: navigator.language || "",
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemory: navigator.deviceMemory || null
    },
    network: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType || "",
      downlinkBucket: bucketNumber(navigator.connection.downlink || 0),
      rttBucket: bucketNumber(navigator.connection.rtt || 0)
    } : null,
    collectorVersion: "3.2.0"
  };
}

function sanitizeRuntimeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, location.href);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return String(value).slice(0, 140);
  }
}

function sanitizeRuntimeValue(value) {
  if (Array.isArray(value)) return value.slice(0, 25).map(sanitizeRuntimeValue);
  if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 220) : value;
  return Object.fromEntries(Object.entries(value).slice(0, 40).map(([key, raw]) => {
    if (isSensitiveRuntimeName(key)) return [key, "[redacted]"];
    if (typeof raw === "string") return [key, raw.slice(0, 220)];
    if (typeof raw === "number" || typeof raw === "boolean" || raw === null) return [key, raw];
    return [key, sanitizeRuntimeValue(raw)];
  }));
}

function isSensitiveRuntimeName(name) {
  return /cookie|token|password|secret|authorization|credential|session|email|phone|address|name|passport/i.test(String(name || ""));
}

function isSensitiveRuntimeElement(element) {
  const tag = element.tagName?.toLowerCase();
  const type = element.getAttribute?.("type") || "";
  return tag === "input" || tag === "textarea" || tag === "select" || /password|email|tel|search|text/i.test(type);
}

function safeRuntimeMessage(value) {
  return String(value || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b\d{6,}\b/g, "[number]")
    .slice(0, 220);
}

function stableSelector(element) {
  if (!(element instanceof Element)) return "";
  const parts = [];
  let current = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
    const tag = current.tagName.toLowerCase();
    const role = current.getAttribute("role");
    const testId = current.getAttribute("data-testid") || current.getAttribute("data-test");
    let part = tag;
    if (testId && !isSensitiveRuntimeName(testId)) part += `[data-test="${cssEscapeRuntime(testId).slice(0, 48)}"]`;
    else if (role) part += `[role="${cssEscapeRuntime(role).slice(0, 48)}"]`;
    else {
      const siblings = current.parentElement ? [...current.parentElement.children].filter(child => child.tagName === current.tagName) : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(" > ").slice(0, RUNTIME_DEFAULTS.maxSelectorLength);
}

function stableDomPath(element) {
  if (!(element instanceof Element)) return "";
  const parts = [];
  let current = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 8) {
    const index = current.parentElement ? [...current.parentElement.children].indexOf(current) : 0;
    parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    current = current.parentElement;
  }
  return parts.join("/");
}

function rectSnapshot(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function cssEscapeRuntime(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}

function detectRuntimeProviderFromUrl(value) {
  const lower = String(value || "").toLowerCase();
  if (!lower) return null;
  if (/cloudflare|challenges\.cloudflare|turnstile/.test(lower)) return "cloudflare";
  if (/akamai|_abck|bm_sz|botman/.test(lower)) return "akamai";
  if (/perimeterx|px-captcha|\/_px|pxvid/.test(lower)) return "perimeterx";
  if (/datadome|dd_cid/.test(lower)) return "datadome";
  if (/imperva|incapsula|visid_incap/.test(lower)) return "imperva";
  if (/recaptcha/.test(lower)) return "google-recaptcha";
  if (/hcaptcha/.test(lower)) return "hcaptcha";
  if (/fingerprint|fpjs|botd/.test(lower)) return "fingerprintjs";
  return null;
}

function runtimeProviderFromSelector(selector) {
  if (/recaptcha/i.test(selector)) return "google-recaptcha";
  if (/hcaptcha|h-captcha/i.test(selector)) return "hcaptcha";
  return null;
}

function isRuntimeHidden(node) {
  const style = getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  return style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || rect.width === 0 || rect.height === 0;
}

function inferRuntimeRole(node) {
  const explicit = node.getAttribute?.("role");
  if (explicit) return explicit.toLowerCase();
  const tag = node.tagName?.toLowerCase() || "";
  const type = String(node.getAttribute?.("type") || "").toLowerCase();
  if (tag === "a" && node.hasAttribute("href")) return "link";
  if (tag === "button") return "button";
  if (tag === "select") return "combobox";
  if (tag === "textarea") return "textbox";
  if (tag === "input") {
    if (["checkbox", "radio", "button", "submit"].includes(type)) return type === "submit" ? "button" : type;
    return "textbox";
  }
  if (/^h[1-6]$/.test(tag)) return "heading";
  return tag || "generic";
}

function normalizeRuntimeSeverity(value) {
  return ["high", "medium", "low", "info"].includes(value) ? (value === "info" ? "low" : value) : "low";
}

function captureModeForRuntimeFact(source, type) {
  if (source === "browser") return "playwright_rendered_snapshot";
  if (source === "a11y" && /cdp|ax/i.test(type)) return "chrome_devtools_protocol";
  if (source === "vdom") return "framework_runtime_hooks";
  if (source === "runtime" && type === "layer_coverage") return "collector_capability";
  if (source === "multicontext" && /sw_fetch/.test(type)) return "first_party_helper";
  return "page_injection";
}

function runtimeFactConfidence(source, type, metadata = {}) {
  if (metadata.confidence !== undefined) return Math.max(0, Math.min(1, Number(metadata.confidence) || 0));
  if (source === "a11y" && /cdp|ax/i.test(type)) return 0.95;
  if (source === "vdom") return 0.72;
  if (source === "multicontext" && /sw_fetch/.test(type)) return 0.6;
  if (source === "runtime" && type === "layer_coverage") return 1;
  return 0.86;
}

function inferRuntimeOrgan(source, type) {
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

function runtimeLayerFact(source, type, value = {}, metadata = {}) {
  const normalizedSource = normalizeRuntimeFactName(source);
  const normalizedType = normalizeRuntimeFactName(type);
  const key = `${normalizedSource}/${normalizedType}`;
  const direct = runtimeLayerDirectMap()[key];
  const text = `${normalizedSource} ${normalizedType} ${JSON.stringify(value || {})} ${JSON.stringify(metadata || {})}`.toLowerCase();
  const mapped = direct || runtimeLayerFallback(text, normalizedType);
  const nodeType = runtimeLayerNodeType(mapped.treeId);
  return {
    treeId: mapped.treeId,
    type: mapped.type,
    nodeType,
    highlightKind: runtimeLayerHighlightKind(mapped.type),
    target: runtimeLayerTarget(mapped.treeId, value, metadata, normalizedType),
    label: runtimeLayerLabel(value, metadata, mapped.type),
    confidence: runtimeFactConfidence(source, type, metadata),
    captureMode: metadata.captureMode || captureModeForRuntimeFact(source, type)
  };
}

function runtimeLayerDirectMap() {
  return {
    "dom/element_change": { treeId: "dom", type: "DOM.NodeAdded" },
    "dom/attribute_change": { treeId: "dom", type: "DOM.AttributeChanged" },
    "dom/text_change": { treeId: "dom", type: "DOM.TextChanged" },
    "dom/shadow_root": { treeId: "shadow", type: "Shadow.RootAdded" },
    "cssom/css_rule_insert": { treeId: "cssom", type: "CSS.RuleInserted" },
    "cssom/css_rule_delete": { treeId: "cssom", type: "CSS.RuleDeleted" },
    "layout/layout_shift": { treeId: "layout", type: "Layout.LayoutShift" },
    "shadow/shadow_root_created": { treeId: "shadow", type: "Shadow.RootAdded" },
    "shadow/shadow_mapping": { treeId: "shadow", type: "Shadow.ComponentTreeChanged" },
    "shadow/slot_change": { treeId: "shadow", type: "Shadow.SlotChanged" },
    "a11y/a11y_role_change": { treeId: "a11y", type: "A11y.RoleChanged" },
    "a11y/a11y_state_change": { treeId: "a11y", type: "A11y.StateChanged" },
    "runtime/js_microtask": { treeId: "js", type: "JSRuntime.MicrotaskScheduled" },
    "runtime/js_promise_chain": { treeId: "js", type: "JSRuntime.PromiseChainUpdated" },
    "runtime/js_event_loop_render": { treeId: "js", type: "JSRuntime.EventLoopPhaseChanged" },
    "runtime/js_event_loop_idle": { treeId: "js", type: "JSRuntime.EventLoopPhaseChanged" },
    "runtime/scheduling": { treeId: "js", type: "JSRuntime.TimerScheduled" },
    "multicontext/iframe_created": { treeId: "worker", type: "Worker.Created" },
    "multicontext/iframe_loaded": { treeId: "worker", type: "Worker.MessageReceived" },
    "multicontext/post_message": { treeId: "worker", type: "Worker.MessagePosted" },
    "multicontext/worker_created": { treeId: "worker", type: "Worker.Created" },
    "multicontext/worker_message": { treeId: "worker", type: "Worker.MessageReceived" },
    "multicontext/worker_post": { treeId: "worker", type: "Worker.MessagePosted" },
    "multicontext/message_channel_created": { treeId: "worker", type: "Worker.ChannelCreated" },
    "multicontext/message_channel_message": { treeId: "worker", type: "Worker.MessagePosted" },
    "multicontext/sw_register": { treeId: "worker", type: "Worker.ServiceWorkerRegistered" },
    "multicontext/sw_activated": { treeId: "worker", type: "Worker.ServiceWorkerActivated" },
    "multicontext/sw_fetch": { treeId: "worker", type: "Worker.ServiceWorkerFetch" },
    "vdom/vdom_commit": { treeId: "vdom", type: "VDOM.Reconciled" },
    "vdom/vdom_update": { treeId: "vdom", type: "VDOM.VDOMNodeUpdated" },
    "vdom/vdom_diff": { treeId: "vdom", type: "VDOM.NodeDiff" }
  };
}

function runtimeLayerFallback(text, type) {
  if (/vdom|react|vue|svelte|component|props/.test(text)) return { treeId: "vdom", type: "VDOM.NodeDiff" };
  if (/shadow|slot/.test(text)) return { treeId: "shadow", type: "Shadow.NodeChanged" };
  if (/a11y|accessibility|aria|role|semantic/.test(text)) return { treeId: "a11y", type: "A11y.SemanticTopologyChanged" };
  if (/css|style|stylesheet|selector|cascade|specificity|keyframe|media/.test(text)) return { treeId: "cssom", type: "CSS.StyleChanged" };
  if (/layout|paint|reflow|geometry|box|scroll|position|shift/.test(text)) return { treeId: "layout", type: "Layout.GeometryChanged" };
  if (/worker|thread|message_channel|service_worker|sw_|post_message|iframe|frame|network|fetch|xhr|websocket/.test(text)) return { treeId: "worker", type: "Worker.MessagePosted" };
  if (/dom|element|attribute|text|mutation|node|tree|structure|calendar/.test(text)) return { treeId: "dom", type: "DOM.TreeTopologyChanged" };
  if (/microtask|promise|timer|interval|timeout/.test(text)) return { treeId: "js", type: "JSRuntime.TimerScheduled" };
  if (/wasm|webassembly|webgpu|gpu|ai|model|inference/.test(text)) return { treeId: "js", type: "JSRuntime.ExecutionChanged" };
  return { treeId: "js", type: "JSRuntime.StateChanged" };
}

function runtimeLayerNodeType(treeId) {
  return { dom: "tag", cssom: "rule", layout: "box", shadow: "component", a11y: "role", js: "context", worker: "worker", vdom: "vnode" }[treeId] || "node";
}

function runtimeLayerHighlightKind(type) {
  if (/Added|Created|Inserted|Registered/.test(type)) return "added";
  if (/Removed|Deleted|Detached|Terminated/.test(type)) return "removed";
  return "changed";
}

function runtimeLayerTarget(treeId, value = {}, metadata = {}, type = "fact") {
  const raw = value.nodeId || metadata.nodeId || metadata.selector || metadata.hostSelector || value.hostId || value.workerId || value.channelId || value.iframeId || value.url || metadata.url || type;
  return `${treeId}:${hashRuntimeString(String(raw)).slice(0, 12)}`;
}

function runtimeLayerLabel(value = {}, metadata = {}, canonicalType = "Runtime fact") {
  return String(metadata.selector || metadata.hostSelector || value.tag || value.kind || value.level || value.framework || value.area || value.url || canonicalType).slice(0, 80);
}

function normalizeRuntimeFactName(value) {
  return String(value || "fact").trim().toLowerCase().replace(/-/g, "_");
}

function isRuntimeStructuralFact(source, type) {
  if (globalThis.TicketSniperRuntimeLayer?.isRuntimeStructuralFact) {
    return globalThis.TicketSniperRuntimeLayer.isRuntimeStructuralFact(source, type);
  }
  const key = `${normalizeRuntimeFactName(source)}/${normalizeRuntimeFactName(type)}`;
  return RUNTIME_STRUCTURAL_FACT_KEYS.has(key);
}

function calculateSpecificity(selector) {
  const text = String(selector || "");
  const ids = (text.match(/#[\w-]+/g) || []).length;
  const classes = (text.match(/(\.[\w-]+|\[[^\]]+\]|:[\w-]+)/g) || []).filter(item => !/^::/.test(item)).length;
  const elements = (text.replace(/#[\w-]+|(\.[\w-]+|\[[^\]]+\]|:{1,2}[\w-]+)|[>+~(),*]/g, " ").match(/\b[a-z][\w-]*\b/gi) || []).length;
  return { ids, classes, elements, score: (ids * 100) + (classes * 10) + elements };
}

function summarizeDomEventSurface() {
  return {
    inlineHandlers: [...document.querySelectorAll("body, body *")].slice(0, 2500)
      .reduce((count, node) => count + [...(node.getAttributeNames?.() || [])].filter(name => /^on/i.test(name)).length, 0),
    forms: document.forms.length,
    buttons: document.querySelectorAll("button,[role='button'],input[type='button'],input[type='submit']").length,
    inputs: document.querySelectorAll("input,select,textarea").length
  };
}

function summarizeReactRuntime() {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const roots = [];
  try {
    for (const rendererRoots of hook?._fiberRoots?.values?.() || []) {
      for (const root of rendererRoots || []) roots.push(root);
    }
  } catch {
    // React private hook shape varies by version.
  }
  const summary = { rootCount: roots.length, nodeCount: 0, hostCount: 0, componentCount: 0, changedProps: 0, changedState: 0, sample: [] };
  for (const root of roots.slice(0, 8)) {
    const rootSummary = summarizeReactFiberRoot(root);
    summary.nodeCount += rootSummary.nodeCount;
    summary.hostCount += rootSummary.hostCount;
    summary.componentCount += rootSummary.componentCount;
    summary.changedProps += rootSummary.changedProps;
    summary.changedState += rootSummary.changedState;
    summary.sample.push(rootSummary);
  }
  return summary;
}

function summarizeReactFiberRoot(root) {
  const fiber = root?.current || root;
  const stack = fiber ? [fiber] : [];
  const seen = new Set();
  const summary = { nodeCount: 0, hostCount: 0, componentCount: 0, changedProps: 0, changedState: 0 };
  while (stack.length && summary.nodeCount < 600) {
    const node = stack.pop();
    if (!node || seen.has(node)) continue;
    seen.add(node);
    summary.nodeCount += 1;
    if (typeof node.type === "string") summary.hostCount += 1;
    else summary.componentCount += 1;
    if (node.alternate) {
      if (hashRuntimeString(JSON.stringify(sanitizeRuntimeValue(node.memoizedProps || {}))) !== hashRuntimeString(JSON.stringify(sanitizeRuntimeValue(node.alternate.memoizedProps || {})))) summary.changedProps += 1;
      if (hashRuntimeString(JSON.stringify(sanitizeRuntimeValue(node.memoizedState || {}))) !== hashRuntimeString(JSON.stringify(sanitizeRuntimeValue(node.alternate.memoizedState || {})))) summary.changedState += 1;
    }
    if (node.child) stack.push(node.child);
    if (node.sibling) stack.push(node.sibling);
  }
  return summary;
}

function summarizeVueRuntime() {
  const hook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
  const apps = [];
  try {
    if (hook?.apps) apps.push(...(Array.isArray(hook.apps) ? hook.apps : [...hook.apps]));
  } catch {
    // Vue devtools hook can hide app internals.
  }
  return {
    appCount: apps.length,
    componentCount: apps.reduce((count, app) => count + countVueComponentTree(app?._instance || app?.app?._instance), 0),
    sample: apps.slice(0, 8).map(app => ({ hasInstance: Boolean(app?._instance || app?.app?._instance) }))
  };
}

function countVueComponentTree(instance) {
  if (!instance) return 0;
  const stack = [instance];
  const seen = new Set();
  let count = 0;
  while (stack.length && count < 600) {
    const item = stack.pop();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    count += 1;
    for (const child of item.subTree?.children || item.children || []) if (child?.component) stack.push(child.component);
  }
  return count;
}

function summarizeSvelteRuntime() {
  const roots = [];
  try {
    const hook = window.__SVELTE_DEVTOOLS__;
    if (Array.isArray(hook?.roots)) roots.push(...hook.roots);
    if (Array.isArray(hook?.components)) roots.push(...hook.components);
  } catch {
    // Svelte devtools hook is optional.
  }
  return { rootCount: roots.length, sample: roots.slice(0, 12).map(item => ({ keys: Object.keys(item || {}).slice(0, 8) })) };
}

function inferLayoutType(style) {
  const display = String(style.display || "").toLowerCase();
  if (display.includes("flex")) return "flex";
  if (display.includes("grid")) return "grid";
  if (display.includes("table")) return "table";
  if (display.includes("inline")) return "inline";
  if (display.includes("block")) return "block";
  return display || "unknown";
}

function accessibleRuntimeName(node) {
  const aria = node.getAttribute?.("aria-label");
  if (aria) return aria.trim();
  const labelledBy = node.getAttribute?.("aria-labelledby");
  if (labelledBy) {
    return labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || "").join(" ").trim();
  }
  const text = String(node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 120);
  const alt = node.getAttribute?.("alt") || node.getAttribute?.("title") || node.getAttribute?.("placeholder");
  return String(alt || "").trim();
}

function countReactRoots() {
  let count = 0;
  for (const key of Object.keys(window)) if (/^__REACT_DEVTOOLS_GLOBAL_HOOK__$/.test(key)) count += 1;
  for (const element of [...document.querySelectorAll("[data-reactroot], [data-reactid], [id='root'], [id='app']")].slice(0, 20)) {
    if (element) count += 1;
  }
  return count;
}

function stableRuntimeKey(value, metadata) {
  return hashRuntimeString(JSON.stringify({ value, metadata }));
}

function createRuntimeBloombergState(sessionId) {
  return {
    sessionId,
    buckets: new Map(),
    sequence: 0,
    lastUploadedPerf: 0
  };
}

function normalizeRuntimeBloombergWindow(window, state, reason) {
  state.sequence += 1;
  const siteId = location.hostname.replace(/^www\./, "").toLowerCase() || "unknown-site";
  const pageId = location.pathname || "/";
  return {
    window_id: `${state.sessionId}-${state.sequence}`,
    site_id: siteId,
    page_id: pageId,
    client_segment: "runtime-collector",
    start_ts: Math.floor(window.startWall),
    end_ts: Math.floor(window.endWall),
    end_perf: window.endPerf,
    bucket_ms: window.bucket_ms,
    metrics: sanitizeRuntimeValue(window.metrics),
    dependency_edges: compactRuntimeBloombergEdges(window.dependency_edges),
    risk_hints: compactRuntimeBloombergHints(window.risk_hints),
    capture_mode: "browser_local_millisecond_aggregation",
    reason
  };
}

function compactRuntimeBloombergEdges(edges = []) {
  const map = new Map();
  for (const edge of edges) {
    const key = `${edge.from}->${edge.to}:${edge.type}`;
    const current = map.get(key) || { ...edge, weight: 0 };
    current.weight += Number(edge.weight) || 1;
    map.set(key, current);
  }
  return [...map.values()].slice(0, 40);
}

function compactRuntimeBloombergHints(hints = []) {
  return hints.slice(0, 20).map(hint => ({
    type: String(hint.type || "runtime").slice(0, 40),
    severity: normalizeRuntimeSeverity(hint.severity || "low"),
    summary: String(hint.summary || "").slice(0, 180)
  }));
}

function webBloombergMetricForFact(fact = {}) {
  const text = `${fact.source || ""}/${fact.type || ""}`.toLowerCase();
  if (/ai|inference|model|embedding/.test(text)) return "ai";
  if (/wasm|webassembly/.test(text)) return "wasm";
  if (/webgpu|gpu/.test(text)) return "webgpu";
  if (/worker|service-worker|message_channel|post_message/.test(text)) return "worker";
  if (/promise|microtask/.test(text)) return "microtask";
  if (/long-task|longtask/.test(text)) return "longtask";
  if (/animation-frame|raf|frame/.test(text)) return "raf";
  if (/fetch|xhr|network|websocket|resource/.test(text)) return "network";
  if (/layout|paint|style|css|reflow|shift/.test(text)) return "layout";
  if (/malicious|fingerprint|webdriver|headless|crawler|captcha/.test(text)) return "malicious";
  if (/protect|challenge|auth|login|paywall/.test(text)) return "protection";
  if (/runtime|script|timer|error|console|javascript/.test(text)) return "js";
  if (/dom|mutation|shadow|vdom/.test(text)) return "dom";
  return "behavior";
}

function webBloombergEdgeForFact(fact = {}, metric = "behavior") {
  if (metric === "behavior") return null;
  const source = metric === "network" ? "browser" : "event-loop";
  return { from: source, to: metric, type: "runtime-frequency", weight: 1 };
}

function webBloombergRiskHintForFact(fact = {}, metric = "behavior") {
  const severity = normalizeRuntimeSeverity(fact.severity || fact.value?.severity || "low");
  if (severity !== "high" && metric !== "malicious" && metric !== "protection" && metric !== "ai") return null;
  return {
    type: metric,
    severity,
    summary: `${fact.source || "runtime"}/${fact.type || "fact"}`
  };
}

function webBloombergWindowSeverity(window = {}) {
  const metrics = window.metrics || {};
  const total = Object.values(metrics).reduce((sum, value) => sum + (Number(value) || 0), 0);
  if ((metrics.malicious || 0) > 0 || total > 120) return "high";
  if ((metrics.protection || 0) > 0 || (metrics.ai || 0) > 4 || total > 40) return "medium";
  return "low";
}

function hashRuntimeString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function bucketNumber(value) {
  const number = Number(value) || 0;
  if (number <= 0) return "0";
  const power = Math.pow(10, Math.floor(Math.log10(number)));
  return `${Math.round(number / power) * power}`;
}

function storageSnapshot(storage, area) {
  const keys = [];
  try {
    for (let index = 0; index < storage.length; index += 1) keys.push(hashRuntimeString(storage.key(index) || ""));
  } catch {
    return { area, restricted: true };
  }
  return { area, count: keys.length, keySignature: hashRuntimeString(keys.sort().join("|")) };
}

function trimRuntimeWindow(values, windowMs) {
  const now = Date.now();
  while (values.length && now - values[0] > windowMs) values.shift();
}
