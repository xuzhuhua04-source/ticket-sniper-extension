const CRAWLER_OFFICIAL_HOSTS = ["usvisascheduling.com", "ais.usvisa-info.com", "ustraveldocs.com", "cgifederal.secure.force.com"];
const CRAWLER_DEFAULTS = Object.freeze({
  domBurstWindowMs: 600,
  domBurstThreshold: 240,
  resourceBurstWindowMs: 1000,
  resourceBurstThreshold: 60,
  humanIdleThresholdMs: 120000,
  entropyWindowMs: 60000,
  minHumanEventsForEntropy: 12,
  timingRegularityWindowSize: 20,
  timingRegularityThreshold: 5,
  reportCooldownMs: 45000
});

let crawlerSignalsEnabled = false;
let crawlerSignalsCollector = null;

initializeCrawlerSignals().catch(() => {});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.runtimeDiagnosticsSettings) return;
  setCrawlerSignalsEnabled(changes.runtimeDiagnosticsSettings.newValue?.enabled !== false);
});

async function initializeCrawlerSignals() {
  if (!isCrawlerSupportedPage()) return;
  const { runtimeDiagnosticsSettings } = await chrome.storage.sync.get("runtimeDiagnosticsSettings");
  setCrawlerSignalsEnabled(runtimeDiagnosticsSettings?.enabled !== false);
}

function setCrawlerSignalsEnabled(enabled) {
  crawlerSignalsEnabled = enabled;
  if (!enabled) {
    crawlerSignalsCollector?.stop();
    crawlerSignalsCollector = null;
    return;
  }
  if (!crawlerSignalsCollector) crawlerSignalsCollector = new CrawlerSignalsCollector();
  crawlerSignalsCollector.start();
}

class CrawlerSignalsCollector {
  constructor(options = {}) {
    this.options = { ...CRAWLER_DEFAULTS, ...options };
    this.started = false;
    this.domMutationTimes = [];
    this.resourceTimes = [];
    this.humanEventTimes = [];
    this.timingSamples = [];
    this.lastHumanEvent = Date.now();
    this.lastPointerDown = 0;
    this.lastKeyDown = 0;
    this.lastReports = new Map();
    this.timers = new Set();
    this.listeners = [];
    this.observers = [];
  }

  start() {
    if (this.started || !isCrawlerSupportedPage()) return;
    this.started = true;
    this.scanNavigator();
    this.scanAntiCrawlerSurface();
    this.observeDomBursts();
    this.observeResources();
    this.observeHumanSignals();
    this.observeTimingPatterns();
    this.observeEventPatterns();
    this.addTimer(() => this.scanAntiCrawlerSurface(), 4000);
    this.addTimer(() => this.checkHumanIdle(), 10000);
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

  emit(source, type, value, metadata = {}) {
    if (!crawlerSignalsEnabled || !this.started) return;
    const signalKey = `${source}:${type}:${value.signal || value.pattern || value.kind || value.technique || value.reason || "unknown"}`;
    const now = Date.now();
    const previous = this.lastReports.get(signalKey) || 0;
    if (now - previous < this.options.reportCooldownMs) return;
    this.lastReports.set(signalKey, now);
    const fact = { timestamp: now, source, type, value, metadata, context: crawlerFactContext() };
    chrome.runtime.sendMessage({
      type: isCrawlerOfficialHost() ? "CRAWLER_SIGNAL_DETECTED" : "RUNTIME_FACT_DETECTED",
      payload: {
        timestamp: now,
        page: sanitizePageLocation(),
        fact
      }
    }).catch(() => {});
  }

  scanNavigator() {
    const suspicious = [];
    const nav = navigator;
    if (nav.webdriver) suspicious.push("webdriver=true");
    if (!nav.languages || nav.languages.length === 0) suspicious.push("no-languages");
    if (nav.plugins && nav.plugins.length === 0) suspicious.push("no-plugins");
    if (/headless/i.test(nav.userAgent)) suspicious.push("headless-user-agent");
    if (nav.hardwareConcurrency === 1) suspicious.push("single-core");
    if (suspicious.length) {
      this.emit("crawler", "crawler-behavior", {
        signal: "navigator-anomaly",
        severity: "medium",
        detail: suspicious
      });
    }
  }

  observeHumanSignals() {
    const update = () => {
      const now = Date.now();
      this.lastHumanEvent = now;
      this.humanEventTimes.push(now);
      trimWindow(this.humanEventTimes, this.options.entropyWindowMs);
    };
    for (const eventName of ["mousemove", "scroll", "keydown", "pointerdown"]) {
      this.addListener(window, eventName, update, { passive: true, capture: true });
    }
  }

  checkHumanIdle() {
    const now = Date.now();
    const idleMs = now - this.lastHumanEvent;
    if (idleMs > this.options.humanIdleThresholdMs) {
      this.emit("crawler", "crawler-pattern", {
        pattern: "no-human-signals",
        severity: "low",
        score: 0.45,
        detail: { idleMs: Math.round(idleMs / 1000) * 1000 }
      });
    }
    const entropy = computeTimingEntropy(this.humanEventTimes);
    if (this.humanEventTimes.length >= this.options.minHumanEventsForEntropy && entropy < 0.4) {
      this.emit("crawler", "crawler-pattern", {
        pattern: "low-human-event-entropy",
        severity: "medium",
        score: 0.65,
        detail: { entropy: Number(entropy.toFixed(3)), count: this.humanEventTimes.length }
      });
    }
  }

  observeTimingPatterns() {
    this.addTimer(() => {
      const now = performance.now();
      this.timingSamples.push(now);
      if (this.timingSamples.length > this.options.timingRegularityWindowSize) this.timingSamples.shift();
      if (this.timingSamples.length < this.options.timingRegularityWindowSize) return;
      const intervals = this.timingSamples.slice(1).map((time, index) => time - this.timingSamples[index]);
      const variance = computeVariance(intervals);
      if (variance < this.options.timingRegularityThreshold) {
        this.emit("crawler", "crawler-pattern", {
          pattern: "regular-timing-loop",
          severity: "medium",
          score: 0.6,
          detail: { variance: Number(variance.toFixed(3)), samples: this.timingSamples.length }
        });
      }
    }, 250);
  }

  observeDomBursts() {
    const observer = new MutationObserver(mutations => {
      const now = Date.now();
      this.domMutationTimes.push(...mutations.map(() => now));
      trimWindow(this.domMutationTimes, this.options.domBurstWindowMs);
      if (this.domMutationTimes.length > this.options.domBurstThreshold) {
        this.emit("crawler", "crawler-pattern", {
          pattern: "dom-burst",
          severity: "medium",
          score: 0.72,
          detail: { count: this.domMutationTimes.length, windowMs: this.options.domBurstWindowMs }
        });
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    this.observers.push(observer);
  }

  observeResources() {
    if (!("PerformanceObserver" in window)) return;
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) this.recordResource(entry.name);
      });
      observer.observe({ type: "resource", buffered: true });
      this.observers.push(observer);
    } catch {
      for (const entry of performance.getEntriesByType?.("resource") || []) this.recordResource(entry.name);
    }
  }

  recordResource(url) {
    const now = Date.now();
    this.resourceTimes.push(now);
    trimWindow(this.resourceTimes, this.options.resourceBurstWindowMs);
    const provider = detectProviderFromUrl(url);
    if (provider) {
      this.emit("anti_crawler", "fingerprint", {
        provider,
        technique: "resource-marker",
        severity: "medium"
      }, { resource: sanitizeUrl(url) });
    }
    if (this.resourceTimes.length > this.options.resourceBurstThreshold) {
      this.emit("crawler", "crawler-pattern", {
        pattern: "resource-burst",
        severity: "medium",
        score: 0.68,
        detail: { count: this.resourceTimes.length, windowMs: this.options.resourceBurstWindowMs }
      });
    }
  }

  observeEventPatterns() {
    this.addListener(window, "pointerdown", () => { this.lastPointerDown = Date.now(); }, { passive: true, capture: true });
    this.addListener(window, "keydown", () => { this.lastKeyDown = Date.now(); }, { passive: true, capture: true });
    this.addListener(window, "click", event => {
      const now = Date.now();
      if (now - this.lastPointerDown > 500) {
        this.emit("crawler", "crawler-behavior", {
          signal: "click-without-recent-pointerdown",
          severity: "low",
          detail: { targetTag: event.target?.tagName || null, deltaMs: now - this.lastPointerDown }
        });
      }
    }, { passive: true, capture: true });
    this.addListener(window, "input", event => {
      const now = Date.now();
      if (now - this.lastKeyDown > 500) {
        this.emit("crawler", "crawler-behavior", {
          signal: "input-without-recent-keydown",
          severity: "low",
          detail: { targetTag: event.target?.tagName || null, deltaMs: now - this.lastKeyDown }
        });
      }
    }, { passive: true, capture: true });
  }

  scanAntiCrawlerSurface() {
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
    this.scanCaptchaFrames();
    this.scanScripts();
    this.scanCookieMarkers();
    this.scanStorageMarkers();
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
        provider: detectProviderFromUrl(src) || providerFromSelector(selector),
        kind: "captcha",
        severity: "high"
      }, { selector, resource: sanitizeUrl(src), hidden: isHidden(node) });
    }
  }

  scanScripts() {
    for (const script of [...document.scripts]) {
      const src = script.src || "";
      if (!src) continue;
      const provider = detectProviderFromUrl(src);
      const lower = src.toLowerCase();
      if (provider || /fingerprint|fpjs|botd|deviceid|captcha|challenge/.test(lower)) {
        this.emit("anti_crawler", "fingerprint", {
          provider,
          technique: /captcha|challenge/.test(lower) ? "challenge-script" : "fingerprint-script",
          severity: provider ? "medium" : "low"
        }, { resource: sanitizeUrl(src) });
      }
    }
  }

  scanCookieMarkers() {
    let cookie = "";
    try { cookie = document.cookie.toLowerCase(); } catch { return; }
    if (!cookie) return;
    const markers = ["cf_clearance", "__cf_bm", "_abck", "bm_sz", "datadome", "_px", "visid_incap"];
    const detected = markers.filter(marker => cookie.includes(marker));
    if (detected.length) {
      this.emit("anti_crawler", "challenge", {
        provider: detectProviderFromCookie(cookie),
        kind: "cookie-challenge",
        severity: "medium"
      }, { markers: detected });
    }
  }

  scanStorageMarkers() {
    const markers = [];
    for (const storage of [localStorage, sessionStorage]) {
      const prefix = storage === localStorage ? "local" : "session";
      try {
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index) || "";
          if (/cf|ak|px|dd|bot|fingerprint|captcha|challenge/i.test(key)) markers.push(`${prefix}:${key.slice(0, 80)}`);
        }
      } catch {
        // Some portals restrict storage reads.
      }
    }
    if (markers.length) {
      this.emit("anti_crawler", "fingerprint", {
        provider: null,
        technique: "storage-marker",
        severity: "low"
      }, { markers: markers.slice(0, 12) });
    }
  }
}

function isCrawlerOfficialHost() {
  const host = location.hostname.toLowerCase();
  return CRAWLER_OFFICIAL_HOSTS.some(official => host === official || host.endsWith(`.${official}`));
}

function isCrawlerSupportedPage() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function sanitizePageLocation() {
  return { host: location.hostname, path: location.pathname };
}

function crawlerFactContext() {
  return {
    pageUrl: `${location.origin}${location.pathname}`,
    referrer: sanitizeUrl(document.referrer),
    userAgent: String(navigator.userAgent || "").replace(/\([^)]*\)/g, "(redacted)").slice(0, 160),
    device: {
      platform: navigator.platform || "",
      language: navigator.language || "",
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemory: navigator.deviceMemory || null
    },
    collectorVersion: "3.2.0"
  };
}

function sanitizeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, location.href);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return String(value).slice(0, 120);
  }
}

function detectProviderFromUrl(value) {
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

function detectProviderFromCookie(cookie) {
  if (/cf_clearance|__cf_bm/.test(cookie)) return "cloudflare";
  if (/_abck|bm_sz/.test(cookie)) return "akamai";
  if (/datadome/.test(cookie)) return "datadome";
  if (/_px/.test(cookie)) return "perimeterx";
  if (/visid_incap/.test(cookie)) return "imperva";
  return null;
}

function providerFromSelector(selector) {
  if (/recaptcha/i.test(selector)) return "google-recaptcha";
  if (/hcaptcha|h-captcha/i.test(selector)) return "hcaptcha";
  return null;
}

function isHidden(node) {
  const style = getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  return style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || rect.width === 0 || rect.height === 0;
}

function trimWindow(values, windowMs) {
  const now = Date.now();
  while (values.length && now - values[0] > windowMs) values.shift();
}

function computeTimingEntropy(times) {
  if (times.length < 2) return 1;
  const buckets = new Map();
  for (let index = 1; index < times.length; index += 1) {
    const bucket = Math.round((times[index] - times[index - 1]) / 50);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }
  if (buckets.size <= 1) return 0;
  const total = times.length - 1;
  let entropy = 0;
  for (const count of buckets.values()) {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  }
  return entropy / Math.log2(buckets.size);
}

function computeVariance(values) {
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
}
