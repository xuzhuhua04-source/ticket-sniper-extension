import "./organ-frequency-engine.js";

const MAX_HTML_BYTES = 1_250_000;

export async function analyzeUrl(rawUrl) {
  const url = validateHttpUrl(rawUrl);
  const startedAt = Date.now();
  const response = await fetch(url.href, {
    redirect: "follow",
    headers: {
      "user-agent": "TicketSniperDiagnostics/standalone (+local structural diagnostics)",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const bytes = new Uint8Array(await response.arrayBuffer());
  const limited = bytes.slice(0, MAX_HTML_BYTES);
  const html = decodeBody(limited, contentType);
  const fetchedAt = Date.now();
  const page = pageContext(response.url || url.href);
  const headers = Object.fromEntries([...response.headers.entries()].slice(0, 80));
  const facts = buildFacts({ url: response.url || url.href, requestedUrl: url.href, response, html, bytes, headers, startedAt, fetchedAt, page });
  return diagnosticsPayload({
    facts,
    page,
    statusMessage: `Analyzed ${page.host} without opening a browser tab.`,
    state: "standalone_url_analyzed",
    category: "standalone-url-analysis",
    requestedUrl: url.href,
    finalUrl: response.url || url.href,
    analyzedAt: fetchedAt
  });
}

export function analyzeRenderedSnapshot(snapshot = {}) {
  const finalUrl = String(snapshot.url || "");
  const page = pageContext(finalUrl);
  const fetchedAt = Date.now();
  const html = String(snapshot.html || "");
  const headers = snapshot.headers || {};
  const response = {
    status: snapshot.status || 200,
    ok: (snapshot.status || 200) < 400,
    redirected: false,
    headers: { get: key => headers[String(key).toLowerCase()] || headers[key] || "" }
  };
  const facts = buildFacts({
    url: finalUrl,
    requestedUrl: snapshot.requestedUrl || finalUrl,
    response,
    html,
    bytes: new TextEncoder().encode(html),
    headers,
    startedAt: snapshot.startedAt || fetchedAt,
    fetchedAt,
    page
  });
  for (const runtimeFact of snapshot.runtimeFacts || []) {
    if (!runtimeFact?.source || !runtimeFact?.type) continue;
    facts.push(fact(
      String(runtimeFact.source).slice(0, 60),
      String(runtimeFact.type).slice(0, 80),
      runtimeFact.value || {},
      {
        ...(runtimeFact.metadata || {}),
        runtimeLayer: runtimeFact.runtimeLayer || runtimeFact.metadata?.runtimeLayer || null,
        captureMode: runtimeFact.captureMode || runtimeFact.runtimeLayer?.captureMode || runtimeFact.metadata?.captureMode || ""
      },
      page,
      Number(runtimeFact.timestamp) || fetchedAt + 9
    ));
  }
  const rendered = snapshot.rendered || {};
  facts.push(fact("browser", "rendered-dom-snapshot", {
    severity: rendered.calendarCells > 0 ? "low" : "medium",
    title: rendered.title || "",
    readyState: rendered.readyState || "",
    forms: rendered.forms || 0,
    inputs: rendered.inputs || 0,
    buttons: rendered.buttons || 0,
    links: rendered.links || 0,
    scripts: rendered.scripts || 0,
    iframes: rendered.iframes || 0,
    calendarCells: rendered.calendarCells || 0,
    selectableCalendarCells: rendered.selectableCalendarCells || 0,
    availableDates: rendered.availableDates || [],
    consulate: rendered.consulate || "",
    locationId: rendered.locationId || "",
    signature: rendered.signature || ""
  }, { source: "playwright-rendered-page" }, page, fetchedAt + 10));
  for (const issue of snapshot.jsErrors || []) {
    facts.push(fact("runtime", "script-error", {
      severity: "high",
      message: issue.message || String(issue),
      pageUrl: sanitizeUrl(issue.url || finalUrl)
    }, { source: "secure-browser-pageerror" }, page, fetchedAt + 11));
  }
  for (const issue of snapshot.consoleErrors || []) {
    const text = issue.text || "";
    facts.push(fact("runtime", "console", {
      severity: issue.type === "error" && !/failed to load resource/i.test(text) ? "high" : "medium",
      type: issue.type || "console",
      message: text
    }, { source: "secure-browser-console" }, page, fetchedAt + 12));
  }
  for (const item of snapshot.network || []) {
    facts.push(fact("network", item.failed ? "request-failed" : "response-status", {
      severity: item.failed || item.status >= 500 ? "high" : item.status >= 400 ? "medium" : "low",
      method: item.method || "",
      resourceType: item.resourceType || "",
      status: item.status || 0,
      failed: Boolean(item.failed),
      url: sanitizeUrl(item.url || "")
    }, { failureText: item.failureText || "" }, page, fetchedAt + 13));
  }
  facts.sort((left, right) => right.timestamp - left.timestamp);
  return diagnosticsPayload({
    facts,
    page,
    statusMessage: `Analyzed rendered page ${page.host} from the secure browser session.`,
    state: "secure_browser_rendered_page_analyzed",
    category: "secure-browser-rendered-analysis",
    requestedUrl: snapshot.requestedUrl || finalUrl,
    finalUrl,
    analyzedAt: fetchedAt
  });
}

function buildFacts({ url, requestedUrl, response, html, bytes, headers, startedAt, fetchedAt, page }) {
  const facts = [];
  const structure = structuralSummary(html);
  const resources = resourceSummary(html, url);
  const providers = detectProtectionProviders(html, headers);
  const technology = technologySummary(html, headers);
  const cssom = cssomSummary(html);
  const layout = layoutStaticSummary(html);
  const a11y = accessibilitySummary(html);
  const timingMs = fetchedAt - startedAt;
  facts.push(fact("network", "document-fetch", {
    severity: response.status >= 500 ? "high" : response.status >= 400 ? "medium" : "low",
    status: response.status,
    ok: response.ok,
    redirected: response.redirected,
    timingMs,
    byteLength: bytes.byteLength,
    truncated: bytes.byteLength > MAX_HTML_BYTES,
    contentType: response.headers.get("content-type") || ""
  }, { requestedUrl: sanitizeUrl(requestedUrl), finalUrl: sanitizeUrl(url) }, page, fetchedAt));
  facts.push(fact("dom", "structure-snapshot", {
    severity: structure.hasPassword || structure.forms > 4 ? "medium" : "low",
    ...structure
  }, { titleHash: hashString(structure.title), titleLength: structure.title.length }, page, fetchedAt + 1));
  facts.push(fact("network", "resource-map", {
    severity: resources.scriptHosts.length > 12 ? "medium" : "low",
    scripts: resources.scripts,
    stylesheets: resources.stylesheets,
    images: resources.images,
    iframes: resources.iframes,
    scriptHostCount: resources.scriptHosts.length,
    styleHostCount: resources.styleHosts.length
  }, { scriptHosts: resources.scriptHosts, styleHosts: resources.styleHosts, iframeHosts: resources.iframeHosts }, page, fetchedAt + 2));
  facts.push(fact("runtime", "technology-profile", {
    severity: providers.length ? "medium" : "low",
    frameworks: technology.frameworks,
    analytics: technology.analytics,
    securityProviders: providers.map(item => item.provider),
    server: headers.server || "",
    poweredBy: headers["x-powered-by"] || ""
  }, { headerNames: Object.keys(headers).slice(0, 40) }, page, fetchedAt + 3));
  if (cssom.stylesheets || cssom.inlineStyleBlocks || cssom.inlineStyleAttributes || cssom.mediaRules || cssom.keyframeRules) {
    facts.push(fact("cssom", "stylesheet-snapshot", {
      severity: cssom.crossOriginLikely > 6 ? "medium" : "low",
      ...cssom
    }, { source: "standalone-static-projection", captureMode: "standalone_static_projection" }, page, fetchedAt + 4));
  }
  if (layout.layoutElements || layout.positionedElements || layout.scrollContainers || layout.mediaElements) {
    facts.push(fact("layout", "static-geometry-snapshot", {
      severity: layout.positionedElements > 80 || layout.mediaElements > 120 ? "medium" : "low",
      ...layout
    }, { source: "standalone-static-projection", captureMode: "standalone_static_projection" }, page, fetchedAt + 5));
  }
  if (a11y.roles || a11y.ariaStates || a11y.namedControls || a11y.interactiveElements) {
    facts.push(fact("a11y", "semantic-topology", {
      severity: a11y.unnamedInteractive > 0 ? "medium" : "low",
      ...a11y
    }, { source: "standalone-static-projection", captureMode: "standalone_static_projection" }, page, fetchedAt + 6));
  }
  if (resources.iframes) {
    facts.push(fact("multicontext", "iframe-observed", {
      severity: resources.iframes > 8 ? "medium" : "low",
      count: resources.iframes,
      iframeHostCount: resources.iframeHosts.length
    }, { iframeHosts: resources.iframeHosts, source: "standalone-static-projection", captureMode: "standalone_static_projection" }, page, fetchedAt + 7));
  }
  if (technology.frameworks.length) {
    facts.push(fact("vdom", "framework-surface", {
      severity: "low",
      frameworks: technology.frameworks,
      exposedRuntimeHooks: false
    }, { source: "standalone-static-projection", captureMode: "standalone_static_projection", limitation: "Framework runtime internals require page injection or exposed dev hooks." }, page, fetchedAt + 8));
  }
  for (const provider of providers) {
    facts.push(fact("anti_crawler", "challenge", {
      severity: provider.severity,
      provider: provider.provider,
      kind: provider.kind,
      marker: provider.marker
    }, { detection: "standalone-html-header-scan", captureMode: "standalone_static_projection" }, page, fetchedAt + 9));
  }
  const calendar = calendarSummary(html);
  if (calendar.hasCalendar || calendar.dateLikeCount) {
    facts.push(fact("dom", "calendar-structure", {
      severity: calendar.hasCalendar ? "low" : "info",
      ...calendar
    }, { note: "Standalone URL analysis reads fetched markup only; authenticated dynamic calendars may not be present in server HTML.", captureMode: "standalone_static_projection" }, page, fetchedAt + 10));
  }
  return facts.sort((left, right) => right.timestamp - left.timestamp);
}

function structuralSummary(html) {
  return {
    title: textBetween(html, /<title[^>]*>/i, /<\/title>/i).replace(/\s+/g, " ").trim().slice(0, 180),
    forms: countMatches(html, /<form\b/gi),
    inputs: countMatches(html, /<(input|select|textarea)\b/gi),
    buttons: countMatches(html, /<(button|input\b[^>]*type=["']?(submit|button))/gi),
    links: countMatches(html, /<a\b[^>]*href=/gi),
    scripts: countMatches(html, /<script\b/gi),
    stylesheets: countMatches(html, /<link\b[^>]*rel=["']?stylesheet/gi),
    iframes: countMatches(html, /<iframe\b/gi),
    headings: countMatches(html, /<h[1-6]\b/gi),
    hasPassword: /<input\b[^>]*type=["']?password/i.test(html),
    hasCalendar: /calendar|datepicker|appointment|available-date|selectDay|ui-datepicker/i.test(html)
  };
}

function calendarSummary(html) {
  const dateCandidates = [...new Set([...html.matchAll(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+20\d{2})\b/gi)]
    .map(match => match[0].replace(/\s+/g, " ").trim())
    .filter(Boolean))].slice(0, 80);
  return {
    hasCalendar: /calendar|datepicker|ui-datepicker|appointment/i.test(html),
    dateLikeCount: Math.min(500, countMatches(html, /\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2})\b/g)),
    selectableHints: countMatches(html, /available|selectDay|data-date|data-available-date|aria-disabled=["']?false/gi),
    consulateHints: countMatches(html, /consulate|consular post|embassy|locationName|locationId/gi),
    dateCandidates
  };
}

function resourceSummary(html, baseUrl) {
  const scripts = extractUrls(html, /<script\b[^>]*src=["']([^"']+)["']/gi, baseUrl);
  const styles = extractUrls(html, /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']?stylesheet|<link\b[^>]*rel=["']?stylesheet[^>]*href=["']([^"']+)["']/gi, baseUrl);
  const images = extractUrls(html, /<(?:img|source)\b[^>]*src=["']([^"']+)["']/gi, baseUrl);
  const iframes = extractUrls(html, /<iframe\b[^>]*src=["']([^"']+)["']/gi, baseUrl);
  return {
    scripts: scripts.length,
    stylesheets: styles.length,
    images: images.length,
    iframes: iframes.length,
    scriptHosts: uniqueHosts(scripts),
    styleHosts: uniqueHosts(styles),
    iframeHosts: uniqueHosts(iframes)
  };
}

function cssomSummary(html) {
  return {
    stylesheets: countMatches(html, /<link\b[^>]*rel=["']?stylesheet|<link\b[^>]*href=["'][^"']+\.css(?:[?#][^"']*)?["']/gi),
    inlineStyleBlocks: countMatches(html, /<style\b/gi),
    inlineStyleAttributes: countMatches(html, /\sstyle=["'][^"']+["']/gi),
    mediaRules: countMatches(html, /@media\b/gi),
    keyframeRules: countMatches(html, /@(?:-\w+-)?keyframes\b/gi),
    classSelectors: countMatches(html, /\bclass=["'][^"']+["']/gi),
    crossOriginLikely: uniqueHosts(extractUrls(html, /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']?stylesheet|<link\b[^>]*rel=["']?stylesheet[^>]*href=["']([^"']+)["']/gi, "https://standalone.invalid/")).length
  };
}

function layoutStaticSummary(html) {
  return {
    layoutElements: countMatches(html, /<(main|section|article|aside|nav|header|footer|form|table|ul|ol|li|div)\b/gi),
    positionedElements: countMatches(html, /position\s*:\s*(absolute|fixed|sticky|relative)|\b(top|left|right|bottom)\s*:/gi),
    scrollContainers: countMatches(html, /overflow(?:-[xy])?\s*:\s*(auto|scroll|hidden)/gi),
    gridHints: countMatches(html, /display\s*:\s*grid|\bgrid-template\b|\bgrid\b/gi),
    flexHints: countMatches(html, /display\s*:\s*flex|\bflex-direction\b|\bflex\b/gi),
    mediaElements: countMatches(html, /<(img|picture|source|video|canvas|svg)\b/gi)
  };
}

function accessibilitySummary(html) {
  const interactive = countMatches(html, /<(button|a\b[^>]*href=|input|select|textarea|summary)\b/gi);
  const labels = countMatches(html, /<(label)\b|\baria-label=|\baria-labelledby=/gi);
  return {
    roles: countMatches(html, /\srole=["'][^"']+["']/gi),
    ariaStates: countMatches(html, /\saria-(expanded|selected|checked|disabled|hidden|pressed|current|invalid)=/gi),
    namedControls: labels,
    interactiveElements: interactive,
    semanticLandmarks: countMatches(html, /<(main|nav|header|footer|aside|section|article)\b|\srole=["'](?:main|navigation|banner|contentinfo|complementary|region)["']/gi),
    unnamedInteractive: Math.max(0, interactive - labels)
  };
}

function technologySummary(html, headers) {
  const lower = html.toLowerCase();
  const frameworks = [];
  const analytics = [];
  if (/react|__react|data-reactroot/.test(lower)) frameworks.push("react");
  if (/vue|__vue|data-v-/.test(lower)) frameworks.push("vue");
  if (/angular|ng-version|ng-app/.test(lower)) frameworks.push("angular");
  if (/next\/static|__next_data__/.test(lower)) frameworks.push("nextjs");
  if (/webpack|vite|parcel/.test(lower)) frameworks.push("bundled-js");
  if (/googletagmanager|gtag\(|google-analytics/.test(lower)) analytics.push("google-analytics");
  if (/hotjar|mixpanel|segment\.com|amplitude/.test(lower)) analytics.push("behavior-analytics");
  if (headers.server) frameworks.push(`server:${headers.server.slice(0, 60)}`);
  if (headers["x-powered-by"]) frameworks.push(`powered-by:${headers["x-powered-by"].slice(0, 60)}`);
  return { frameworks: [...new Set(frameworks)], analytics: [...new Set(analytics)] };
}

function detectProtectionProviders(html, headers) {
  const text = `${html.slice(0, 500000)} ${JSON.stringify(headers)}`.toLowerCase();
  const checks = [
    ["cloudflare", "challenge", ["cf-challenge", "cf-ray", "turnstile", "checking your browser", "__cf_bm"]],
    ["akamai", "fingerprint", ["akamai", "_abck", "bm_sz", "bot manager"]],
    ["perimeterx", "challenge", ["perimeterx", "px-captcha", "_px", "pxvid"]],
    ["datadome", "challenge", ["datadome", "dd_cid"]],
    ["imperva", "challenge", ["imperva", "incapsula", "visid_incap"]],
    ["google-recaptcha", "captcha", ["recaptcha/api.js", "g-recaptcha", "google.com/recaptcha"]],
    ["hcaptcha", "captcha", ["hcaptcha.com", "h-captcha"]]
  ];
  return checks.flatMap(([provider, kind, markers]) => {
    const marker = markers.find(item => text.includes(item));
    return marker ? [{ provider, kind, marker, severity: kind === "fingerprint" ? "medium" : "high" }] : [];
  });
}

function groupFacts(facts) {
  return facts.reduce((channels, item) => {
    const channel = `${item.source}/${item.type}`;
    channels[channel] = channels[channel] || [];
    channels[channel].push(item);
    return channels;
  }, {});
}

function statusForFact(fact, page) {
  return {
    state: "standalone_signal_detected",
    message: `${fact.value?.provider || fact.source} ${fact.value?.kind || fact.type} detected in fetched markup or headers.`,
    checkedAt: fact.timestamp,
    host: page.host,
    severity: fact.value?.severity || "low",
    fact
  };
}

function diagnosticsPayload({ facts, page, statusMessage, state, category, requestedUrl, finalUrl, analyzedAt }) {
  const channels = groupFacts(facts);
  const spectrum = buildStandaloneSpectrum(facts);
  const layerCoverage = buildLayerCoverage(facts);
  const latestFact = facts[0] || null;
  const status = {
    state: latestFact ? state : "standalone_no_facts",
    message: latestFact ? statusMessage : "No structural facts were produced.",
    checkedAt: analyzedAt,
    host: page.host,
    severity: facts.some(item => item.value?.severity === "high") ? "high" : facts.some(item => item.value?.severity === "medium") ? "medium" : "low",
    channel: latestFact ? `${latestFact.source}/${latestFact.type}` : "standalone/none",
    fact: latestFact
  };
  return {
    ok: true,
    analyzedAt,
    requestedUrl,
    finalUrl,
    status,
    diagnostics: {
      runtimeFactChannels: channels,
      runtimeFactHistory: facts.slice(0, 1000),
      runtimeFactStatus: status,
      runtimeLayerCoverage: layerCoverage,
      crawlerSignalHistory: facts.filter(item => item.source === "anti_crawler").map(item => statusForFact(item, page)).slice(0, 20),
      crawlerSignalStatus: facts.find(item => item.source === "anti_crawler") ? statusForFact(facts.find(item => item.source === "anti_crawler"), page) : null,
      structuralPipelineLatest: structuralPipelineSummary(facts, page, category),
      structuralPipelineState: { summary: graphSummary(facts), updatedAt: analyzedAt },
      organFrequencySpectrumState: spectrum,
      organFrequencySpectrumLatest: {
        checkedAt: analyzedAt,
        windowMs: spectrum.windowMs,
        closure: spectrum.closure,
        products: spectrum.products,
        commercialPackages: spectrum.commercialPackages,
        spectra: compactSpectra(spectrum.spectra)
      }
    }
  };
}

function buildStandaloneSpectrum(facts) {
  const engine = new globalThis.TicketSniperOrganFrequency.OrganFrequencySpectrumEngine({}, { windowMs: 100 });
  engine.ingestMany(facts, { source: "standalone-analyzer" });
  return engine.snapshot();
}

function compactSpectra(spectra = {}) {
  return Object.fromEntries(Object.entries(spectra).map(([organ, value]) => [organ, {
    organ,
    frequency: value.frequency || 0,
    delta: value.delta || 0,
    energy: value.energy || 0,
    volatility: value.volatility || 0,
    nodeCount: value.nodeCount || 0,
    edgeCount: value.edgeCount || 0
  }]));
}

function structuralPipelineSummary(facts, page, category = "standalone-url-analysis") {
  const high = facts.filter(item => item.value?.severity === "high").length;
  const medium = facts.filter(item => item.value?.severity === "medium").length;
  return {
    classification: high ? "high-visibility-structural-risk" : medium ? "medium-visibility-structural-change" : "low-visibility-structural-baseline",
    category,
    signal: page.host,
    score: Math.min(1, (high * 0.35) + (medium * 0.15) + (facts.length * 0.02)),
    eventCount: facts.length,
    graph: graphSummary(facts)
  };
}

function graphSummary(facts) {
  return {
    nodeCount: facts.length,
    edgeCount: Math.max(0, facts.length - 1),
    channels: [...new Set(facts.map(item => `${item.source}/${item.type}`))]
  };
}

function fact(source, type, value, metadata, page, timestamp = Date.now()) {
  const channel = `${source}/${type}`;
  const severity = normalizeSeverity(value?.severity);
  const captureMode = metadata?.captureMode || captureModeForFact(source, type);
  const runtimeLayer = runtimeLayerFact(source, type, value, metadata);
  return {
    timestamp,
    source,
    type,
    channel,
    runtimeLayer,
    organ: inferOrgan(source, type),
    severity,
    confidence: confidenceForFact(source, type, metadata),
    captureMode,
    payload: sanitizeValue({ value, metadata }),
    value: sanitizeValue(value),
    metadata: sanitizeValue(metadata),
    context: page
  };
}

function runtimeLayerFact(source, type, value = {}, metadata = {}) {
  if (metadata?.runtimeLayer?.treeId && metadata?.runtimeLayer?.type) {
    const stamped = metadata.runtimeLayer;
    return {
      treeId: stamped.treeId,
      type: stamped.type,
      nodeType: stamped.nodeType || "node",
      highlightKind: stamped.highlightKind || (/Added|Created|Inserted|Registered/.test(stamped.type) ? "added" : /Removed|Deleted|Detached|Terminated/.test(stamped.type) ? "removed" : "changed"),
      target: stamped.target || `${stamped.treeId}:${hashString(String(value?.signature || value?.url || metadata?.url || type)).slice(0, 12)}`,
      label: stamped.label || String(value?.title || value?.kind || value?.provider || value?.url || stamped.type).slice(0, 80),
      confidence: stamped.confidence || confidenceForFact(source, type, metadata),
      captureMode: stamped.captureMode || metadata?.captureMode || captureModeForFact(source, type)
    };
  }
  const sourceKey = normalizeFactName(source);
  const typeKey = normalizeFactName(type);
  const mapped = {
    "browser/rendered_dom_snapshot": ["dom", "DOM.TreeTopologyChanged", "tag"],
    "dom/structure_snapshot": ["dom", "DOM.TreeTopologyChanged", "tag"],
    "dom/calendar_structure": ["dom", "DOM.TreeTopologyChanged", "tag"],
    "cssom/stylesheet_snapshot": ["cssom", "CSS.RuleChanged", "rule"],
    "layout/static_geometry_snapshot": ["layout", "Layout.GeometryChanged", "box"],
    "a11y/semantic_topology": ["a11y", "A11y.SemanticTopologyChanged", "role"],
    "multicontext/iframe_observed": ["worker", "Worker.Created", "worker"],
    "vdom/framework_surface": ["vdom", "VDOM.VDOMTreeChanged", "vnode"],
    "network/document_fetch": ["worker", "Worker.MessageReceived", "worker"],
    "network/resource_map": ["worker", "Worker.MessageReceived", "worker"],
    "network/response_status": ["worker", "Worker.MessageReceived", "worker"],
    "network/request_failed": ["worker", "Worker.MessageReceived", "worker"],
    "runtime/script_error": ["js", "JSRuntime.ExecutionChanged", "context"],
    "runtime/console": ["js", "JSRuntime.ExecutionChanged", "context"],
    "runtime/technology_profile": ["js", "JSRuntime.RuntimeTopologyChanged", "context"],
    "runtime/diagnostics_tick": ["js", "JSRuntime.EventLoopPhaseChanged", "context"],
    "anti_crawler/challenge": ["js", "JSRuntime.ExecutionChanged", "context"]
  }[`${sourceKey}/${typeKey}`] || runtimeLayerFallback(`${sourceKey} ${typeKey}`);
  return {
    treeId: mapped[0],
    type: mapped[1],
    nodeType: mapped[2],
    highlightKind: /Added|Created|Inserted|Registered/.test(mapped[1]) ? "added" : /Removed|Deleted|Detached|Terminated/.test(mapped[1]) ? "removed" : "changed",
    target: `${mapped[0]}:${hashString(String(value?.signature || value?.url || metadata?.url || typeKey)).slice(0, 12)}`,
    label: String(value?.title || value?.kind || value?.provider || value?.url || mapped[1]).slice(0, 80),
    confidence: confidenceForFact(source, type, metadata),
    captureMode: metadata?.captureMode || captureModeForFact(source, type)
  };
}

function runtimeLayerFallback(text) {
  if (/css|style|stylesheet|selector/.test(text)) return ["cssom", "CSS.StyleChanged", "rule"];
  if (/layout|rendered|snapshot|structure|dom|calendar/.test(text)) return ["dom", "DOM.TreeTopologyChanged", "tag"];
  if (/network|fetch|request|response|resource/.test(text)) return ["worker", "Worker.MessageReceived", "worker"];
  if (/a11y|accessibility|aria/.test(text)) return ["a11y", "A11y.SemanticTopologyChanged", "role"];
  return ["js", "JSRuntime.StateChanged", "context"];
}

function normalizeFactName(value) {
  return String(value || "fact").trim().toLowerCase().replace(/-/g, "_");
}

function buildLayerCoverage(facts) {
  const defaults = {
    dom: coverage("best_effort", "standalone_html_or_page_injection", 0.72, "DOM structure is available from fetched HTML or rendered page facts."),
    layout: coverage("best_effort", "page_injection", 0.7, "Layout requires rendered page instrumentation; fetched HTML cannot expose final layout."),
    cssom: coverage("best_effort", "standalone_html_or_page_injection", 0.72, "Stylesheet links are visible from HTML; full CSSOM requires page injection."),
    accessibility: coverage("best_effort", "page_injection_or_cdp", 0.72, "DOM-derived accessibility is available; secure browser can add CDP AX-tree facts."),
    javascript: coverage("best_effort", "page_injection", 0.7, "Runtime JavaScript facts require injected collector hooks."),
    shadow: coverage("best_effort", "page_injection", 0.68, "Open shadow roots require rendered page access."),
    multicontext: coverage("best_effort", "page_injection", 0.68, "Iframes and Workers require runtime page access."),
    vdom: coverage("best_effort", "framework_runtime_hooks", 0.62, "Framework internals are captured only when hooks are exposed."),
    serviceWorkerFetch: coverage("first_party_only", "first_party_helper", 0.6, "Arbitrary third-party Service Worker fetch handlers are browser-protected.")
  };
  for (const item of facts) {
    const source = String(item.source || "");
    const type = String(item.type || "");
    const channel = `${source}/${type}`.toLowerCase();
    if (source === "runtime" && type === "layer_coverage" && item.value?.layers) {
      for (const [name, layer] of Object.entries(item.value.layers)) {
        defaults[name] = { ...coverage(layer.status, layer.captureMode, layer.confidence, layer.reason), lastFactAt: item.timestamp };
      }
    }
    const layer = layerForFact(channel);
    if (!layer || !defaults[layer]) continue;
    defaults[layer] = {
      ...defaults[layer],
      status: item.captureMode === "chrome_devtools_protocol" ? "full" : defaults[layer].status,
      lastFactAt: Math.max(defaults[layer].lastFactAt || 0, item.timestamp || 0),
      evidenceCount: (defaults[layer].evidenceCount || 0) + 1
    };
  }
  return defaults;
}

function coverage(status, captureMode, confidence, reason) {
  return { status, captureMode, confidence, reason, evidenceCount: 0, lastFactAt: 0 };
}

function layerForFact(channel) {
  if (channel.startsWith("dom/")) return "dom";
  if (channel.startsWith("layout/")) return "layout";
  if (channel.startsWith("cssom/")) return "cssom";
  if (channel.startsWith("a11y/")) return "accessibility";
  if (channel.startsWith("runtime/") || channel.startsWith("performance/")) return "javascript";
  if (channel.startsWith("shadow/")) return "shadow";
  if (channel.startsWith("multicontext/")) return /sw_fetch/.test(channel) ? "serviceWorkerFetch" : "multicontext";
  if (channel.startsWith("vdom/")) return "vdom";
  return "";
}

function normalizeSeverity(value) {
  return ["high", "medium", "low", "info"].includes(value) ? (value === "info" ? "low" : value) : "low";
}

function captureModeForFact(source, type) {
  if (source === "browser") return "playwright_rendered_snapshot";
  if (source === "a11y" && /cdp|ax/i.test(type)) return "chrome_devtools_protocol";
  if (source === "vdom") return "framework_runtime_hooks";
  if (source === "runtime" && type === "layer_coverage") return "collector_capability";
  if (source === "multicontext" && /sw_fetch/.test(type)) return "first_party_helper";
  return source === "network" || source === "dom" || source === "runtime" ? "standalone_or_page_injection" : "page_injection";
}

function confidenceForFact(source, type, metadata) {
  if (metadata?.confidence !== undefined) return Math.max(0, Math.min(1, Number(metadata.confidence) || 0));
  if (source === "a11y" && /cdp|ax/i.test(type)) return 0.95;
  if (source === "vdom") return 0.72;
  if (source === "multicontext" && /sw_fetch/.test(type)) return 0.6;
  return 0.82;
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

function pageContext(value) {
  const url = validateHttpUrl(value);
  return { host: url.hostname, path: url.pathname, pageUrl: `${url.origin}${url.pathname}` };
}

function validateHttpUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw httpError(400, "Enter a valid HTTP or HTTPS URL."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw httpError(400, "Only HTTP and HTTPS URLs can be analyzed.");
  return url;
}

function decodeBody(bytes, contentType) {
  const charset = /charset=([^;\s]+)/i.exec(contentType)?.[1] || "utf-8";
  try { return new TextDecoder(charset).decode(bytes); }
  catch { return new TextDecoder("utf-8").decode(bytes); }
}

function extractUrls(html, regex, baseUrl) {
  const urls = [];
  for (const match of html.matchAll(regex)) {
    const raw = match[1] || match[2] || "";
    if (!raw) continue;
    try { urls.push(new URL(raw, baseUrl).href); } catch { /* Ignore invalid resource references. */ }
  }
  return urls.slice(0, 500);
}

function uniqueHosts(urls) {
  return [...new Set(urls.map(item => {
    try { return new URL(item).hostname; } catch { return ""; }
  }).filter(Boolean))].slice(0, 40);
}

function textBetween(value, startRegex, endRegex) {
  const start = value.search(startRegex);
  if (start < 0) return "";
  const afterStart = value.slice(start).replace(startRegex, "");
  const end = afterStart.search(endRegex);
  return end < 0 ? afterStart : afterStart.slice(0, end);
}

function countMatches(value, regex) {
  return [...value.matchAll(regex)].length;
}

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.slice(0, 30).map(sanitizeValue);
  if (!value || typeof value !== "object") return typeof value === "string" ? scrubString(value) : value;
  return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, raw]) => {
    if (/cookie|token|password|secret|authorization|credential|session|email|phone|passport/i.test(key)) return [key, "[redacted]"];
    return [key, sanitizeValue(raw)];
  }));
}

function scrubString(value) {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:\d[ -]?){9,}\b/g, "[number]")
    .slice(0, 260);
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
