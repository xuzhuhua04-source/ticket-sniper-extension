(function installTicketSniperPageHooks() {
  if (window.__ticketSniperRuntimeHooksInstalled || window.__ticketSniperRuntimeHooksInstalling) return;
  window.__ticketSniperRuntimeHooksInstalling = true;

  const VERSION = "3.2.0";
  const BRIDGE_BUFFER_LIMIT = 48;
  const BRIDGE_ATTRIBUTE_LIMIT = 48000;
  const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const lastReports = new Map();
  const networkTimes = [];
  const timingSamples = [];
  const redirects = [];
  const bridgeBuffer = [];
  let bridgeSequence = 0;
  const options = {
    reportCooldownMs: 1000,
    networkBurstWindowMs: 300,
    networkBurstThreshold: 50,
    timingWindowSize: 20,
    timingVarianceThreshold: 5
  };

  const originals = {
    fetch: window.fetch,
    XMLHttpRequest: window.XMLHttpRequest,
    sendBeacon: navigator.sendBeacon?.bind(navigator),
    WebSocket: window.WebSocket,
    Image: window.Image,
    scriptSrc: Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src"),
    pushState: history.pushState,
    replaceState: history.replaceState,
    setTimeout: window.setTimeout,
    setInterval: window.setInterval,
    requestAnimationFrame: window.requestAnimationFrame?.bind(window),
    requestIdleCallback: window.requestIdleCallback?.bind(window),
    queueMicrotask: window.queueMicrotask?.bind(window),
    promiseThen: Promise.prototype.then,
    Worker: window.Worker,
    MessageChannel: window.MessageChannel,
    createElement: Document.prototype.createElement,
    attachShadow: Element.prototype.attachShadow,
    getComputedStyle: window.getComputedStyle?.bind(window),
    getBoundingClientRect: Element.prototype.getBoundingClientRect,
    offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth"),
    offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight"),
    scrollTop: Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop"),
    cssInsertRule: window.CSSStyleSheet?.prototype?.insertRule,
    cssDeleteRule: window.CSSStyleSheet?.prototype?.deleteRule,
    console: {},
    localSetItem: Storage.prototype.setItem,
    localRemoveItem: Storage.prototype.removeItem,
    localClear: Storage.prototype.clear,
    indexedOpen: window.indexedDB?.open?.bind(window.indexedDB),
    swRegister: navigator.serviceWorker?.register?.bind(navigator.serviceWorker),
    wasmInstantiate: window.WebAssembly?.instantiate,
    wasmInstantiateStreaming: window.WebAssembly?.instantiateStreaming,
    wasmCompile: window.WebAssembly?.compile
  };

  function emit(source, type, value, metadata) {
    const timestamp = Date.now();
    const channel = `${source}/${type}`;
    const severity = normalizeSeverity(value?.severity);
    const captureMode = metadata?.captureMode || captureModeForFact(source, type);
    const fact = {
      timestamp,
      source,
      type,
      channel,
      organ: inferOrgan(source, type),
      severity,
      confidence: confidenceForFact(source, type, metadata),
      captureMode,
      payload: sanitize({ value: value || {}, metadata: metadata || {} }),
      value: sanitize(value || {}),
      metadata: sanitize(metadata || {}),
      context: buildContext()
    };
    const key = `${source}:${type}:${hashString(JSON.stringify({ value: fact.value, metadata: fact.metadata }))}`;
    const previous = lastReports.get(key) || 0;
    if (fact.timestamp - previous < options.reportCooldownMs) return;
    lastReports.set(key, fact.timestamp);
    const publish = () => {
      window.postMessage({ channel: "TICKET_SNIPER_PAGE_FACT", fact }, window.location.origin);
      window.dispatchEvent(new CustomEvent("ticket-sniper-page-fact", { detail: fact }));
      const envelope = { id: ++bridgeSequence, fact };
      bridgeBuffer.push(envelope);
      while (bridgeBuffer.length > BRIDGE_BUFFER_LIMIT) bridgeBuffer.shift();
      const encoded = JSON.stringify(envelope).slice(0, 8000);
      document.documentElement.setAttribute("data-ticket-sniper-fact", encoded);
      document.documentElement.setAttribute("data-ticket-sniper-fact-buffer", JSON.stringify(bridgeBuffer).slice(0, BRIDGE_ATTRIBUTE_LIMIT));
      window.dispatchEvent(new CustomEvent("ticket-sniper-page-fact-json", { detail: encoded }));
      document.dispatchEvent(new CustomEvent("ticket-sniper-page-fact-json", { detail: encoded }));
      const node = originals.createElement.call(document, "meta");
      node.setAttribute("data-ticket-sniper-fact-node", "true");
      node.setAttribute("content", encoded);
      document.documentElement.appendChild(node);
      originals.setTimeout.call(window, () => node.remove(), 2000);
    };
    originals.setTimeout.call(window, publish, 0);
    originals.setTimeout.call(window, publish, 120);
  }

  function buildContext() {
    return {
      sessionId,
      pageUrl: `${location.origin}${location.pathname}`,
      referrer: safeUrl(document.referrer),
      userAgent: safeUserAgent(navigator.userAgent),
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
      collectorVersion: VERSION
    };
  }

  function patchNetwork() {
    if (typeof originals.fetch === "function") {
      window.fetch = async function patchedFetch(input, init) {
        const startedAt = performance.now();
        const url = requestUrl(input);
        const method = requestMethod(input, init);
        recordNetworkEvent("fetch", url);
        emit("runtime", "js_fetch_start", { method, url: safeUrl(url), severity: "low" });
        emit("network", "request", { kind: "fetch", method, url: safeUrl(url) });
        try {
          const response = await originals.fetch.apply(this, arguments);
          const headers = safeHeaders(response.headers);
          emit("runtime", "js_fetch_end", { method, url: safeUrl(response.url || url), status: response.status, durationMs: Math.round(performance.now() - startedAt), severity: response.status >= 400 ? "medium" : "low" });
          emit("network", "response", {
            kind: "fetch",
            status: response.status,
            ok: response.ok,
            redirected: response.redirected,
            durationMs: Math.round(performance.now() - startedAt),
            sizeBytes: response.headers.get("content-length") ? Number(response.headers.get("content-length")) : null
          }, { url: safeUrl(response.url || url), headers });
          recordBlockOrRedirect(url, response.status, response.redirected, headers);
          return response;
        } catch (error) {
          emit("network", "error", { kind: "fetch", message: safeMessage(error?.message || error), severity: "medium" }, { url: safeUrl(url) });
          throw error;
        }
      };
    }

    if (typeof originals.XMLHttpRequest === "function") {
      window.XMLHttpRequest = function PatchedXHR() {
        const xhr = new originals.XMLHttpRequest();
        let url = "";
        let method = "GET";
        let startedAt = 0;
        const open = xhr.open;
        const send = xhr.send;
        xhr.open = function patchedOpen(nextMethod, nextUrl) {
          method = String(nextMethod || "GET");
          url = String(nextUrl || "");
          return open.apply(xhr, arguments);
        };
        xhr.send = function patchedSend() {
          startedAt = performance.now();
          recordNetworkEvent("xhr", url);
          emit("runtime", "js_fetch_start", { method, url: safeUrl(url), transport: "xhr", severity: "low" });
          emit("network", "request", { kind: "xhr", method, url: safeUrl(url) });
          xhr.addEventListener("loadend", () => {
            const headers = parseHeaderString(xhr.getAllResponseHeaders?.() || "");
            emit("runtime", "js_fetch_end", { method, url: safeUrl(url), transport: "xhr", status: xhr.status, durationMs: Math.round(performance.now() - startedAt), severity: xhr.status >= 400 ? "medium" : "low" });
            emit("network", "response", {
              kind: "xhr",
              status: xhr.status,
              ok: xhr.status >= 200 && xhr.status < 400,
              durationMs: Math.round(performance.now() - startedAt)
            }, { url: safeUrl(url), headers });
            recordBlockOrRedirect(url, xhr.status, false, headers);
          });
          return send.apply(xhr, arguments);
        };
        return xhr;
      };
    }

    if (originals.sendBeacon) {
      navigator.sendBeacon = function patchedBeacon(url, data) {
        emit("network", "request", { kind: "sendBeacon", method: "POST", url: safeUrl(String(url)), sizeBytes: bodySize(data) });
        const ok = originals.sendBeacon(url, data);
        emit("network", "response", { kind: "sendBeacon", synthetic: true, ok, status: ok ? 204 : 0 }, { url: safeUrl(String(url)) });
        return ok;
      };
    }

    if (typeof originals.WebSocket === "function") {
      window.WebSocket = function PatchedWebSocket(url, protocols) {
        const startedAt = performance.now();
        emit("network", "request", { kind: "websocket", method: "WS", url: safeUrl(String(url)) });
        const socket = protocols === undefined ? new originals.WebSocket(url) : new originals.WebSocket(url, protocols);
        const originalSend = socket.send.bind(socket);
        socket.send = function patchedSocketSend(data) {
          emit("runtime", "js_ws_send", { url: safeUrl(String(url)), sizeBucket: bucketNumber(bodySize(data) || 0), severity: "low" });
          return originalSend(data);
        };
        socket.addEventListener("open", () => emit("network", "response", { kind: "websocket", status: 101, durationMs: Math.round(performance.now() - startedAt) }, { url: safeUrl(String(url)) }));
        socket.addEventListener("message", event => emit("runtime", "js_ws_message", { url: safeUrl(String(url)), sizeBucket: bucketNumber(bodySize(event.data) || 0), severity: "low" }));
        socket.addEventListener("close", event => emit("network", "response", { kind: "websocket-close", code: event.code, clean: event.wasClean }, { url: safeUrl(String(url)) }));
        socket.addEventListener("error", () => emit("network", "error", { kind: "websocket", severity: "medium" }, { url: safeUrl(String(url)) }));
        return socket;
      };
    }

    patchImageAndScript();
  }

  function patchImageAndScript() {
    if (typeof originals.Image === "function") {
      window.Image = function PatchedImage(width, height) {
        const img = new originals.Image(width, height);
        const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
        if (desc?.set) {
          Object.defineProperty(img, "src", {
            configurable: true,
            get: () => desc.get ? desc.get.call(img) : img.getAttribute("src"),
            set: value => {
              emit("network", "request", { kind: "image", method: "GET", url: safeUrl(String(value)) });
              return desc.set.call(img, value);
            }
          });
        }
        return img;
      };
    }
    if (originals.scriptSrc?.set) {
      Object.defineProperty(HTMLScriptElement.prototype, "src", {
        configurable: true,
        get: originals.scriptSrc.get,
        set(value) {
          emit("network", "request", { kind: "script", method: "GET", url: safeUrl(String(value)) });
          const provider = providerFromUrl(String(value));
          if (provider || /fingerprint|fpjs|botd|captcha|challenge/i.test(String(value))) {
            emit("anti_crawler", "fingerprint", { provider, technique: "script-src", severity: provider ? "medium" : "low" }, { resource: safeUrl(String(value)) });
          }
          return originals.scriptSrc.set.call(this, value);
        }
      });
    }
  }

  function patchRuntime() {
    for (const level of ["log", "warn", "error", "info", "debug"]) {
      const original = console[level];
      if (typeof original !== "function") continue;
      originals.console[level] = original.bind(console);
      console[level] = function patchedConsole() {
        emit("runtime", "console", { level, argc: arguments.length, message: safeMessage([...arguments].map(String).join(" ")), severity: level === "error" ? "high" : level === "warn" ? "medium" : "info" });
        return originals.console[level].apply(console, arguments);
      };
    }

    window.setTimeout = function patchedSetTimeout(handler, delay) {
      emit("runtime", "scheduling", { kind: "timeout", delay: Number(delay) || 0 });
      return originals.setTimeout.apply(this, arguments);
    };
    window.setInterval = function patchedSetInterval(handler, delay) {
      emit("runtime", "scheduling", { kind: "interval", delay: Number(delay) || 0 });
      return originals.setInterval.apply(this, arguments);
    };
    if (originals.requestAnimationFrame) {
      window.requestAnimationFrame = function patchedRAF(callback) {
        const requestedAt = performance.now();
        return originals.requestAnimationFrame(function runtimeFrame(timestamp) {
          emit("runtime", "js_event_loop_render", { frameInterval: Math.round(timestamp - requestedAt), timestamp });
          return callback(timestamp);
        });
      };
    }
    if (originals.requestIdleCallback) {
      window.requestIdleCallback = function patchedRIC(callback, options) {
        const requestedAt = performance.now();
        return originals.requestIdleCallback(function runtimeIdle(deadline) {
          emit("runtime", "js_event_loop_idle", {
            timeRemaining: Math.round(deadline.timeRemaining()),
            didTimeout: Boolean(deadline.didTimeout),
            duration: Math.round(performance.now() - requestedAt)
          });
          return callback(deadline);
        }, options);
      };
    }
    if (originals.queueMicrotask) {
      window.queueMicrotask = function patchedQueueMicrotask(callback) {
        const requestedAt = performance.now();
        return originals.queueMicrotask(function runtimeMicrotask() {
          emit("runtime", "js_microtask", { duration: Math.round(performance.now() - requestedAt) });
          return callback();
        });
      };
    }
    Promise.prototype.then = function patchedThen(onFulfilled, onRejected) {
      const requestedAt = performance.now();
      emit("runtime", "js_promise_chain", { severity: "info" });
      return originals.promiseThen.call(this, function wrappedFulfilled(value) {
        emit("runtime", "js_microtask", { duration: Math.round(performance.now() - requestedAt) });
        return typeof onFulfilled === "function" ? onFulfilled(value) : value;
      }, typeof onRejected === "function" ? function wrappedRejected(reason) {
        emit("runtime", "js_microtask", { duration: Math.round(performance.now() - requestedAt), rejected: true });
        return onRejected(reason);
      } : onRejected);
    };
    history.pushState = function patchedPushState(state, title, url) {
      emit("runtime", "navigation", { kind: "pushState", url: safeUrl(String(url || "")) });
      return originals.pushState.apply(this, arguments);
    };
    history.replaceState = function patchedReplaceState(state, title, url) {
      emit("runtime", "navigation", { kind: "replaceState", url: safeUrl(String(url || "")) });
      return originals.replaceState.apply(this, arguments);
    };
    window.addEventListener("popstate", () => emit("runtime", "navigation", { kind: "popstate", url: safeUrl(location.href) }), { passive: true });
  }

  function patchLayoutAccess() {
    if (originals.getComputedStyle) {
      window.getComputedStyle = function patchedGetComputedStyle(element, pseudoElement) {
        if (element instanceof Element) {
          emit("cssom", "forced_style_recalc", { nodeId: stableNodeId(element), severity: "low" }, { selector: stableSelector(element) });
        }
        return originals.getComputedStyle(element, pseudoElement);
      };
    }
    if (originals.getBoundingClientRect) {
      Element.prototype.getBoundingClientRect = function patchedGetBoundingClientRect() {
        emit("layout", "forced_reflow", { nodeId: stableNodeId(this), severity: "low" }, { selector: stableSelector(this) });
        return originals.getBoundingClientRect.call(this);
      };
    }
    if (originals.offsetWidth?.get) {
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        configurable: true,
        get() {
          emit("layout", "forced_reflow", { nodeId: stableNodeId(this), metric: "offsetWidth", severity: "low" }, { selector: stableSelector(this) });
          return originals.offsetWidth.get.call(this);
        }
      });
    }
    if (originals.offsetHeight?.get) {
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        configurable: true,
        get() {
          emit("layout", "forced_reflow", { nodeId: stableNodeId(this), metric: "offsetHeight", severity: "low" }, { selector: stableSelector(this) });
          return originals.offsetHeight.get.call(this);
        }
      });
    }
    if (originals.scrollTop?.get && originals.scrollTop?.set) {
      Object.defineProperty(Element.prototype, "scrollTop", {
        configurable: true,
        get() {
          emit("layout", "forced_reflow", { nodeId: stableNodeId(this), metric: "scrollTop", severity: "low" }, { selector: stableSelector(this) });
          return originals.scrollTop.get.call(this);
        },
        set(value) {
          return originals.scrollTop.set.call(this, value);
        }
      });
    }
  }

  function patchCssomRuntime() {
    if (typeof originals.cssInsertRule === "function") {
      CSSStyleSheet.prototype.insertRule = function patchedInsertRule(rule, index) {
        emit("cssom", "css_rule_insert", { ruleHash: hashString(String(rule || "")), index: Number(index) || 0, severity: "medium" }, { selector: selectorFromRuleText(rule), href: safeUrl(this.href || "inline") });
        return originals.cssInsertRule.call(this, rule, index);
      };
    }
    if (typeof originals.cssDeleteRule === "function") {
      CSSStyleSheet.prototype.deleteRule = function patchedDeleteRule(index) {
        emit("cssom", "css_rule_delete", { index: Number(index) || 0, severity: "medium" }, { href: safeUrl(this.href || "inline") });
        return originals.cssDeleteRule.call(this, index);
      };
    }
  }

  function patchShadowDomRuntime() {
    if (typeof originals.attachShadow !== "function") return;
    Element.prototype.attachShadow = function patchedAttachShadow(init) {
      const root = originals.attachShadow.call(this, init);
      const hostId = stableNodeId(this);
      emit("shadow", "shadow_root_created", { hostId, mode: init?.mode || root.mode || "unknown", severity: "low" }, { hostSelector: stableSelector(this) });
      observeShadowRoot(root, hostId);
      return root;
    };
    for (const element of [...document.querySelectorAll("*")].slice(0, 1200)) {
      if (element.shadowRoot) observeShadowRoot(element.shadowRoot, stableNodeId(element));
    }
  }

  function observeShadowRoot(root, hostId) {
    if (!root || root.__ticketSniperHooked) return;
    root.__ticketSniperHooked = true;
    emit("shadow", "shadow_mapping", { hostId, childCount: root.childNodes.length, severity: "low" });
    root.querySelectorAll?.("slot").forEach(slot => {
      slot.addEventListener("slotchange", () => {
        emit("shadow", "slot_change", { hostId, slotName: slot.name || "default", assignedCount: slot.assignedNodes?.().length || 0, severity: "low" });
      });
    });
    const observer = new MutationObserver(mutations => {
      emit("shadow", "shadow_topology", { hostId, mutationCount: mutations.length, childCount: root.childNodes.length, severity: mutations.length > 20 ? "medium" : "low" });
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true });
  }

  function patchVirtualDomHooks() {
    const reactHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (reactHook && !reactHook.__ticketSniperPatched) {
      reactHook.__ticketSniperPatched = true;
      const originalCommit = reactHook.onCommitFiberRoot;
      reactHook.onCommitFiberRoot = function patchedCommit(rendererId, root, priorityLevel) {
        emit("vdom", "vdom_commit", { rendererId, priorityLevel, severity: "low" });
        try {
          const summary = summarizeFiberRoot(root);
          emit("vdom", "vdom_topology", summary);
          if (summary.changedProps || summary.changedState) emit("vdom", "vdom_diff", summary);
        } catch {
          emit("vdom", "vdom_break", { reason: "fiber-summary-failed", severity: "low" });
        }
        return typeof originalCommit === "function" ? originalCommit.apply(this, arguments) : undefined;
      };
    }
    const vueHook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
    if (vueHook?.on && !vueHook.__ticketSniperPatched) {
      vueHook.__ticketSniperPatched = true;
      try {
        vueHook.on("component:updated", payload => emit("vdom", "vdom_update", { framework: "vue", componentId: String(payload?.uid || payload?.id || ""), severity: "low" }));
      } catch {
        emit("vdom", "vdom_break", { framework: "vue", reason: "hook-subscribe-failed", severity: "low" });
      }
    }
    if (window.__SVELTE_DEVTOOLS__ && !window.__SVELTE_DEVTOOLS__.__ticketSniperSeen) {
      window.__SVELTE_DEVTOOLS__.__ticketSniperSeen = true;
      emit("vdom", "vdom_topology", { framework: "svelte", roots: Array.isArray(window.__SVELTE_DEVTOOLS__.roots) ? window.__SVELTE_DEVTOOLS__.roots.length : null, severity: "low" });
    }
  }

  function patchStorage() {
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      emit("storage", "storage-change", { area: storageArea(this), op: "setItem", keyHash: hashString(String(key)), valueSize: String(value || "").length });
      return originals.localSetItem.apply(this, arguments);
    };
    Storage.prototype.removeItem = function patchedRemoveItem(key) {
      emit("storage", "storage-change", { area: storageArea(this), op: "removeItem", keyHash: hashString(String(key)) });
      return originals.localRemoveItem.apply(this, arguments);
    };
    Storage.prototype.clear = function patchedClear() {
      emit("storage", "storage-change", { area: storageArea(this), op: "clear" });
      return originals.localClear.apply(this, arguments);
    };
    if (originals.indexedOpen) {
      window.indexedDB.open = function patchedIndexedOpen(name, version) {
        emit("storage", "indexeddb-open", { nameHash: hashString(String(name || "")), version: Number(version) || null });
        return originals.indexedOpen(name, version);
      };
    }
    setInterval(() => {
      emit("storage", "storage-snapshot", storageSnapshot(localStorage, "local"));
      emit("storage", "storage-snapshot", storageSnapshot(sessionStorage, "session"));
      emit("storage", "storage-snapshot", { area: "cookie", count: document.cookie ? document.cookie.split(";").length : 0, signature: hashString(document.cookie || "") });
    }, 10000);
  }

  function patchProtectionSurfaces() {
    if (originals.swRegister) {
      navigator.serviceWorker.register = async function patchedRegister(scriptURL, opts) {
        const url = String(scriptURL || "");
        const provider = providerFromUrl(url);
        emit("multicontext", "sw_register", { script: safeUrl(url), severity: "low" });
        emit("multicontext", "sw_fetch_capability", {
          status: "first_party_only",
          severity: "info",
          reason: "Service Worker fetch events can only be emitted by a first-party helper inside the Service Worker script."
        }, { captureMode: "first_party_helper" });
        emit("anti_crawler", provider ? "fingerprint" : "service-worker", { provider, technique: "service-worker-register", severity: provider ? "medium" : "low" }, { resource: safeUrl(url) });
        return originals.swRegister(scriptURL, opts);
      };
    }
    if (window.WebAssembly) {
      if (originals.wasmInstantiate) {
        WebAssembly.instantiate = function patchedInstantiate() {
          emit("anti_crawler", "fingerprint", { provider: null, technique: "wasm-instantiate", severity: "low" });
          return originals.wasmInstantiate.apply(this, arguments);
        };
      }
      if (originals.wasmInstantiateStreaming) {
        WebAssembly.instantiateStreaming = function patchedInstantiateStreaming() {
          emit("anti_crawler", "fingerprint", { provider: null, technique: "wasm-instantiate-streaming", severity: "low" });
          return originals.wasmInstantiateStreaming.apply(this, arguments);
        };
      }
      if (originals.wasmCompile) {
        WebAssembly.compile = function patchedCompile() {
          emit("anti_crawler", "fingerprint", { provider: null, technique: "wasm-compile", severity: "low" });
          return originals.wasmCompile.apply(this, arguments);
        };
      }
    }
  }

  function patchCrossContext() {
    if (typeof originals.createElement === "function") {
      Document.prototype.createElement = function patchedCreateElement(tagName, options) {
        const element = originals.createElement.call(this, tagName, options);
        if (String(tagName || "").toLowerCase() === "iframe") {
          const iframeId = `iframe-${hashString(String(Date.now() + Math.random()))}`;
          element.dataset.ticketSniperFrameId = iframeId;
          emit("multicontext", "iframe_created", { iframeId, severity: "low" });
          element.addEventListener("load", () => emit("multicontext", "iframe_loaded", { iframeId, url: safeUrl(element.src || "") }), { once: false });
        }
        return element;
      };
    }
    window.addEventListener("message", event => {
      emit("multicontext", "post_message", {
        origin: safeUrl(event.origin || ""),
        sizeBucket: bucketNumber(JSON.stringify(sanitize(event.data || "")).length),
        severity: "low"
      });
    }, true);
    if (typeof originals.Worker === "function") {
      window.Worker = function PatchedWorker(url, options) {
        const worker = new originals.Worker(url, options);
        const workerId = `worker-${hashString(String(url || "") + Date.now())}`;
        emit("multicontext", "worker_created", { workerId, script: safeUrl(String(url || "")), severity: "low" });
        const originalPost = worker.postMessage.bind(worker);
        worker.postMessage = function patchedWorkerPost(message, transfer) {
          emit("multicontext", "worker_post", { workerId, sizeBucket: bucketNumber(JSON.stringify(sanitize(message || "")).length), severity: "low" });
          return originalPost(message, transfer);
        };
        worker.addEventListener("message", event => emit("multicontext", "worker_message", { workerId, sizeBucket: bucketNumber(JSON.stringify(sanitize(event.data || "")).length), severity: "low" }));
        return worker;
      };
    }
    if (typeof originals.MessageChannel === "function") {
      window.MessageChannel = function PatchedMessageChannel() {
        const channel = new originals.MessageChannel();
        const channelId = `channel-${hashString(String(Date.now() + Math.random()))}`;
        emit("multicontext", "message_channel_created", { channelId, severity: "low" });
        for (const [index, port] of [channel.port1, channel.port2].entries()) {
          const originalPost = port.postMessage.bind(port);
          port.postMessage = function patchedPortPost(message, transfer) {
            emit("multicontext", "message_channel_message", { channelId, port: index + 1, sizeBucket: bucketNumber(JSON.stringify(sanitize(message || "")).length), severity: "low" });
            return originalPost(message, transfer);
          };
        }
        return channel;
      };
    }
    navigator.serviceWorker?.addEventListener?.("controllerchange", () => emit("multicontext", "sw_activated", { severity: "low" }));
  }

  function observeTimingRegularity() {
    setInterval(() => {
      const now = performance.now();
      timingSamples.push(now);
      if (timingSamples.length > options.timingWindowSize) timingSamples.shift();
      if (timingSamples.length < options.timingWindowSize) return;
      const intervals = timingSamples.slice(1).map((time, index) => time - timingSamples[index]);
      const variance = varianceOf(intervals);
      if (variance < options.timingVarianceThreshold) {
        emit("crawler", "crawler-pattern", { pattern: "regular-timing-loop", severity: "medium", score: 0.6, detail: { variance: Number(variance.toFixed(3)), samples: timingSamples.length } });
      }
    }, 250);
  }

  function recordNetworkEvent(kind, url) {
    const now = Date.now();
    networkTimes.push(now);
    while (networkTimes.length && now - networkTimes[0] > options.networkBurstWindowMs) networkTimes.shift();
    if (networkTimes.length > options.networkBurstThreshold) {
      emit("crawler", "crawler-pattern", { pattern: "network-burst", severity: "medium", score: 0.7, detail: { kind, count: networkTimes.length, windowMs: options.networkBurstWindowMs } }, { url: safeUrl(url) });
    }
  }

  function recordBlockOrRedirect(url, status, redirected, headers) {
    const provider = providerFromUrl(url) || providerFromHeaders(headers);
    if (status === 403 || status === 429) {
      emit("anti_crawler", "block", { provider, reason: status === 403 ? "forbidden" : "rate-limit", status, severity: "high" }, { url: safeUrl(url), headers: markerHeaders(headers) });
    }
    if (redirected) {
      redirects.push(safeUrl(url));
      emit("anti_crawler", "block", { provider, reason: "redirect", severity: provider ? "medium" : "low", redirectCount: redirects.length }, { url: safeUrl(url) });
    }
    const markers = markerHeaders(headers);
    if (markers.length) emit("anti_crawler", "fingerprint", { provider: providerFromHeaders(headers), technique: "header-marker", severity: "medium" }, { headers: markers });
  }

  safeInstall("network-hooks", patchNetwork);
  safeInstall("runtime-hooks", patchRuntime);
  safeInstall("layout-access-hooks", patchLayoutAccess);
  safeInstall("cssom-hooks", patchCssomRuntime);
  safeInstall("shadow-dom-hooks", patchShadowDomRuntime);
  safeInstall("vdom-hooks", patchVirtualDomHooks);
  safeInstall("cross-context-hooks", patchCrossContext);
  safeInstall("storage-hooks", patchStorage);
  safeInstall("protection-hooks", patchProtectionSurfaces);
  safeInstall("timing-regularity", observeTimingRegularity);
  window.__ticketSniperRuntimeHooksInstalled = true;
  window.__ticketSniperRuntimeHooksInstalling = false;
  emit("runtime", "collector-state", { state: "page-hooks-installed", severity: "low" });

  function safeInstall(name, installer) {
    try {
      installer();
      emit("runtime", "collector-state", { state: `${name}-installed`, severity: "low" });
    } catch (error) {
      emit("runtime", "collector-state", { state: `${name}-failed`, severity: "medium", message: safeMessage(error?.message || error) });
    }
  }

  function requestUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    return input?.url || "";
  }

  function requestMethod(input, init) {
    return String(init?.method || input?.method || "GET").toUpperCase();
  }

  function safeHeaders(headers) {
    try {
      return [...headers.entries()].filter(([name]) => /cf-|akamai|server|x-|retry-after|captcha|challenge/i.test(name)).slice(0, 20).map(([name, value]) => [name.slice(0, 80), String(value).slice(0, 120)]);
    } catch {
      return [];
    }
  }

  function stableNodeId(element) {
    if (!(element instanceof Element)) return "";
    if (!element.__ticketSniperNodeId) {
      Object.defineProperty(element, "__ticketSniperNodeId", { value: `node-${hashString(stableSelector(element) + Date.now() + Math.random())}`, configurable: false });
    }
    return element.__ticketSniperNodeId;
  }

  function stableSelector(element) {
    if (!(element instanceof Element)) return "";
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
      let part = current.tagName.toLowerCase();
      const role = current.getAttribute("role");
      if (current.id && !/password|token|secret|email|phone/i.test(current.id)) part += `#${String(current.id).slice(0, 40)}`;
      else if (role) part += `[role="${String(role).slice(0, 40)}"]`;
      else {
        const siblings = current.parentElement ? [...current.parentElement.children].filter(child => child.tagName === current.tagName) : [];
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(" > ").slice(0, 180);
  }

  function selectorFromRuleText(rule) {
    return String(rule || "").split("{")[0].trim().slice(0, 160);
  }

  function summarizeFiberRoot(root) {
    const fiber = root?.current || root;
    const summary = { framework: "react", nodeCount: 0, hostCount: 0, componentCount: 0, changedProps: 0, changedState: 0, severity: "low" };
    const stack = fiber ? [fiber] : [];
    const seen = new Set();
    while (stack.length && summary.nodeCount < 500) {
      const node = stack.pop();
      if (!node || seen.has(node)) continue;
      seen.add(node);
      summary.nodeCount += 1;
      if (typeof node.type === "string") summary.hostCount += 1;
      else summary.componentCount += 1;
      if (node.alternate) {
        if (hashString(JSON.stringify(sanitize(node.memoizedProps || {}))) !== hashString(JSON.stringify(sanitize(node.alternate.memoizedProps || {})))) summary.changedProps += 1;
        if (hashString(JSON.stringify(sanitize(node.memoizedState || {}))) !== hashString(JSON.stringify(sanitize(node.alternate.memoizedState || {})))) summary.changedState += 1;
      }
      if (node.child) stack.push(node.child);
      if (node.sibling) stack.push(node.sibling);
    }
    if (summary.changedProps + summary.changedState > 20) summary.severity = "medium";
    return summary;
  }

  function parseHeaderString(raw) {
    return String(raw || "").split(/\r?\n/).map(line => line.split(":")).filter(parts => parts.length >= 2).map(parts => [parts[0].trim(), parts.slice(1).join(":").trim()]).filter(([name]) => name);
  }

  function markerHeaders(headers) {
    return (headers || []).filter(([name, value]) => /cf-|akamai|perimeter|px|datadome|captcha|challenge|retry-after/i.test(`${name}:${value}`)).slice(0, 12).map(([name, value]) => `${name}:${String(value).slice(0, 80)}`);
  }

  function providerFromHeaders(headers) {
    const lower = JSON.stringify(headers || []).toLowerCase();
    if (/cloudflare|cf-/.test(lower)) return "cloudflare";
    if (/akamai|ak-/.test(lower)) return "akamai";
    if (/perimeterx|px/.test(lower)) return "perimeterx";
    if (/datadome/.test(lower)) return "datadome";
    if (/imperva|incapsula/.test(lower)) return "imperva";
    return null;
  }

  function providerFromUrl(value) {
    const lower = String(value || "").toLowerCase();
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

  function storageArea(storage) {
    return storage === localStorage ? "local" : storage === sessionStorage ? "session" : "unknown";
  }

  function storageSnapshot(storage, area) {
    const keys = [];
    try {
      for (let index = 0; index < storage.length; index += 1) keys.push(hashString(storage.key(index) || ""));
    } catch {
      return { area, restricted: true };
    }
    return { area, count: keys.length, keySignature: hashString(keys.sort().join("|")) };
  }

  function bodySize(data) {
    if (!data) return 0;
    if (typeof data === "string") return data.length;
    if (data instanceof Blob) return data.size;
    if (data instanceof ArrayBuffer) return data.byteLength;
    return null;
  }

  function safeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, location.href);
      return `${url.origin}${url.pathname}`;
    } catch {
      return String(value).slice(0, 160);
    }
  }

  function safeUserAgent(value) {
    return String(value || "").replace(/\([^)]*\)/g, "(redacted)").slice(0, 160);
  }

  function normalizeSeverity(value) {
    return ["high", "medium", "low", "info"].includes(value) ? (value === "info" ? "low" : value) : "low";
  }

  function captureModeForFact(source, type) {
    if (source === "vdom") return "framework_runtime_hooks";
    if (source === "multicontext" && /sw_fetch/.test(type)) return "first_party_helper";
    if (source === "a11y" && /cdp|ax/i.test(type)) return "chrome_devtools_protocol";
    return "page_injection";
  }

  function confidenceForFact(source, type, metadata) {
    if (metadata?.confidence !== undefined) return Math.max(0, Math.min(1, Number(metadata.confidence) || 0));
    if (source === "vdom") return 0.72;
    if (source === "multicontext" && /sw_fetch/.test(type)) return 0.6;
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

  function safeMessage(value) {
    return String(value || "").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]").replace(/\b\d{6,}\b/g, "[number]").slice(0, 220);
  }

  function sanitize(value) {
    if (Array.isArray(value)) return value.slice(0, 30).map(sanitize);
    if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 240) : value;
    return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, raw]) => {
      if (/cookie|token|password|secret|authorization|credential|session|email|phone|address|passport|body/i.test(key)) return [key, "[redacted]"];
      if (typeof raw === "string") return [key, raw.slice(0, 240)];
      if (typeof raw === "number" || typeof raw === "boolean" || raw === null) return [key, raw];
      return [key, sanitize(raw)];
    }));
  }

  function hashString(value) {
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

  function varianceOf(values) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  }
})();
