const elements = {
  skipLink: document.getElementById("skip-link"),
  languageSelect: document.getElementById("language-select"),
  languageLabel: document.getElementById("language-label"),
  platformEyebrow: document.getElementById("platform-eyebrow"),
  toggleDiagnostics: document.getElementById("toggle-diagnostics"),
  refresh: document.getElementById("refresh"),
  exportJson: document.getElementById("export-json"),
  exportAllJson: document.getElementById("export-all-json"),
  clear: document.getElementById("clear"),
  navHome: document.getElementById("nav-home"),
  navPlatform: document.getElementById("nav-platform"),
  navProducts: document.getElementById("nav-products"),
  navResources: document.getElementById("nav-resources"),
  navDocs: document.getElementById("nav-docs"),
  navDashboard: document.getElementById("nav-dashboard"),
  navModules: document.getElementById("nav-modules"),
  navRankings: document.getElementById("nav-rankings"),
  navPlans: document.getElementById("nav-plans"),
  navSignIn: document.getElementById("nav-sign-in"),
  accountChip: document.getElementById("account-chip"),
  signOutButton: document.getElementById("sign-out-button"),
  homeView: document.getElementById("home-view"),
  docsView: document.getElementById("docs-view"),
  signInView: document.getElementById("sign-in-view"),
  plansView: document.getElementById("plans-view"),
  modulesView: document.getElementById("modules-view"),
  rankingsView: document.getElementById("rankings-view"),
  dashboardView: document.getElementById("dashboard-view"),
  authSignIn: document.getElementById("auth-sign-in"),
  authSignUp: document.getElementById("auth-sign-up"),
  authTitle: document.getElementById("auth-title"),
  authCopy: document.getElementById("auth-copy"),
  accountName: document.getElementById("account-name"),
  normalMode: document.getElementById("normal-mode"),
  devMode: document.getElementById("dev-mode"),
  accountEmail: document.getElementById("account-email"),
  accountPassword: document.getElementById("account-password"),
  loginButton: document.getElementById("login-button"),
  accountStatus: document.getElementById("account-status"),
  planButtons: document.querySelectorAll("[data-billing-item], [data-plan]"),
  planPrices: document.querySelectorAll("[data-billing-price], [data-plan-price]"),
  planStatus: document.getElementById("plan-status"),
  homeStart: document.getElementById("home-start"),
  homePricing: document.getElementById("home-pricing"),
  homeEyebrow: document.getElementById("home-eyebrow"),
  homeHeadline: document.getElementById("home-headline"),
  homeCopy: document.getElementById("home-copy"),
  authEyebrow: document.getElementById("auth-eyebrow"),
  authHeadline: document.getElementById("auth-headline"),
  authBody: document.getElementById("auth-body"),
  plansEyebrow: document.getElementById("plans-eyebrow"),
  plansHeadline: document.getElementById("plans-headline"),
  plansCopy: document.getElementById("plans-copy"),
  corePlansHeading: document.getElementById("core-plans-heading"),
  paidModulesHeading: document.getElementById("paid-modules-heading"),
  addonsHeading: document.getElementById("addons-heading"),
  buyingFaqHeading: document.getElementById("buying-faq-heading"),
  productionChecklistHeading: document.getElementById("production-checklist-heading"),
  modulesEyebrow: document.getElementById("modules-eyebrow"),
  modulesHeadline: document.getElementById("modules-headline"),
  modulesCopy: document.getElementById("modules-copy"),
  rankingsEyebrow: document.getElementById("rankings-eyebrow"),
  rankingsHeadline: document.getElementById("rankings-headline"),
  rankingsCopy: document.getElementById("rankings-copy"),
  footerPricing: document.getElementById("footer-pricing"),
  footerDashboard: document.getElementById("footer-dashboard"),
  footerDocs: document.getElementById("footer-docs"),
  portalUrl: document.getElementById("portal-url"),
  openUrl: document.getElementById("open-url"),
  focusLatest: document.getElementById("focus-latest"),
  frequencyWindow: document.getElementById("frequency-window"),
  latestHost: document.getElementById("latest-host"),
  latestTime: document.getElementById("latest-time"),
  streamState: document.getElementById("stream-state"),
  systemHealth: document.getElementById("system-health"),
  totalFacts: document.getElementById("total-facts"),
  channelCount: document.getElementById("channel-count"),
  highCount: document.getElementById("high-count"),
  mediumCount: document.getElementById("medium-count"),
  channels: document.getElementById("channels"),
  profileCount: document.getElementById("profile-count"),
  technologyProfile: document.getElementById("technology-profile"),
  pipelineCount: document.getElementById("pipeline-count"),
  pipelineProfile: document.getElementById("pipeline-profile"),
  organCount: document.getElementById("organ-count"),
  organSummary: document.getElementById("organ-summary"),
  organPanels: document.getElementById("organ-panels"),
  organErrors: document.getElementById("organ-errors"),
  spectrumCount: document.getElementById("spectrum-count"),
  spectrumProfile: document.getElementById("spectrum-profile"),
  structureSignature: document.getElementById("structure-signature"),
  structureEngine: document.getElementById("structure-engine"),
  channelFilter: document.getElementById("channel-filter"),
  factTable: document.getElementById("fact-table"),
  plainHealth: document.getElementById("plain-health"),
  plainHealthDetail: document.getElementById("plain-health-detail"),
  plainChange: document.getElementById("plain-change"),
  plainChangeDetail: document.getElementById("plain-change-detail"),
  plainPressure: document.getElementById("plain-pressure"),
  plainPressureDetail: document.getElementById("plain-pressure-detail"),
  plainAction: document.getElementById("plain-action"),
  plainActionDetail: document.getElementById("plain-action-detail"),
  normalCoverage: document.getElementById("normal-coverage"),
  normalInsightGrid: document.getElementById("normal-insight-grid"),
  coverageGrid: document.getElementById("coverage-grid"),
  targetSummary: document.getElementById("target-summary"),
  targetDetail: document.getElementById("target-detail"),
  signalSummary: document.getElementById("signal-summary"),
  signalDetail: document.getElementById("signal-detail"),
  coverageStatus: document.getElementById("coverage-status"),
  coverageDetail: document.getElementById("coverage-detail"),
  boundaryStatus: document.getElementById("boundary-status"),
  boundaryDetail: document.getElementById("boundary-detail"),
  layerEvidenceLock: document.getElementById("layer-evidence-lock"),
  rankingTabs: document.getElementById("ranking-tabs"),
  rankingTitle: document.getElementById("ranking-title"),
  rankingSubtitle: document.getElementById("ranking-subtitle"),
  rankingCount: document.getElementById("ranking-count"),
  rankingList: document.getElementById("ranking-list"),
  rankingDetail: document.getElementById("ranking-detail"),
  rankingStatus: document.getElementById("ranking-status"),
  rankingCorpusCount: document.getElementById("ranking-corpus-count"),
  rankingCrawlerState: document.getElementById("ranking-crawler-state"),
  rankingOpCorpus: document.getElementById("ranking-op-corpus"),
  rankingOpQueue: document.getElementById("ranking-op-queue"),
  rankingOpResults: document.getElementById("ranking-op-results"),
  rankingOpMode: document.getElementById("ranking-op-mode"),
  rankingAddCurrent: document.getElementById("ranking-add-current"),
  rankingStartCrawler: document.getElementById("ranking-start-crawler"),
  rankingRunOnce: document.getElementById("ranking-run-once"),
  rankingStopCrawler: document.getElementById("ranking-stop-crawler"),
  rankingImportCrawler: document.getElementById("ranking-import-crawler"),
  rankingSeed: document.getElementById("ranking-seed"),
  rankingExport: document.getElementById("ranking-export"),
  packageSuiteSummary: document.getElementById("package-suite-summary"),
  packageSuiteGrid: document.getElementById("package-suite-grid"),
  webBloombergStatus: document.getElementById("web-bloomberg-status"),
  webBloombergFrequency: document.getElementById("web-bloomberg-frequency"),
  webBloombergFrequencyDetail: document.getElementById("web-bloomberg-frequency-detail"),
  webBloombergStorms: document.getElementById("web-bloomberg-storms"),
  webBloombergStormDetail: document.getElementById("web-bloomberg-storm-detail"),
  webBloombergDeviation: document.getElementById("web-bloomberg-deviation"),
  webBloombergDeviationDetail: document.getElementById("web-bloomberg-deviation-detail"),
  webBloombergRisk: document.getElementById("web-bloomberg-risk"),
  webBloombergRiskDetail: document.getElementById("web-bloomberg-risk-detail"),
  webBloombergDependencyCount: document.getElementById("web-bloomberg-dependency-count"),
  webBloombergDependencies: document.getElementById("web-bloomberg-dependencies"),
  webBloombergWindowCount: document.getElementById("web-bloomberg-window-count"),
  webBloombergWindows: document.getElementById("web-bloomberg-windows"),
  webV2ModuleGrid: document.getElementById("web-v2-module-grid"),
  runtimeEventGrid: document.getElementById("runtime-event-grid"),
  runtimeEventSummary: document.getElementById("runtime-event-summary"),
  factMappingDebug: document.getElementById("fact-mapping-debug"),
  moduleTabs: document.getElementById("module-tabs"),
  moduleDetail: document.getElementById("module-detail"),
  dashboardModeLabel: document.getElementById("dashboard-mode-label"),
  exportStatus: document.getElementById("export-status")
};

let snapshot = null;
let diagnosticsEnabled = true;
let refreshInFlight = false;
let refreshAgain = false;
let captureInFlight = false;
let diagnosticsTickTimer = null;
let lastCaptureErrorStatus = "";
let lastCaptureErrorAt = 0;
let healthTimer = null;
let accountState = loadAccountState();
let entitlementState = accountState.entitlements || null;
let viewMode = localStorage.getItem("runtimeDiagnosticsViewMode") || "normal";
let appView = localStorage.getItem("runtimeDiagnosticsAppView") || "home";
let authMode = localStorage.getItem("runtimeDiagnosticsAuthMode") || "sign-in";
let activeModule = normalizePlanId(localStorage.getItem("runtimeDiagnosticsActiveModule")) || "performance";
let activeRankingBoard = localStorage.getItem("runtimeDiagnosticsRankingBoard") || "overall";
let rankingLedger = [];
let rankingCrawlerStatus = null;
let currentScreenshotModuleSystems = [];
let activeLanguage = normalizeLanguage(localStorage.getItem(globalThis.SIG9_LANGUAGE_STORAGE_KEY || "SIG9WebsiteLanguage") || navigator.language || "en");
let languageObserver = null;
let localizingText = false;
let languagePassTimer = null;
let pendingLanguageRoots = new Set();
let substitutionEntryCache = new Map();
const originalTextNodes = new WeakMap();
const hasExtensionRuntime = Boolean(globalThis.chrome?.runtime?.sendMessage && chrome.storage?.local && chrome.storage?.sync);
const standaloneState = {
  timer: null,
  enabled: true,
  inFlight: false,
  pending: false,
  requestId: 0,
  controller: null,
  stream: null,
  reconnectTimer: null,
  inputDebounce: null,
  source: "secure",
  lastResult: null,
  lastUrl: new URLSearchParams(location.search).get("url") || ""
};
const PACKAGE_DEFINITIONS = Object.freeze([
  {
    id: "devops",
    code: "DOP",
    name: "DevOps",
    pricing: "$99/mo",
    industry: "DevOps, SRE, platform teams",
    promise: "Behavior and frequency monitoring for release health and live runtime operations.",
    unlockCopy: "Unlock behavior frequency, runtime cadence, regression pressure, and operational rhythm evidence.",
    metrics: ["Behavior frequency", "Runtime cadence", "Release pressure"],
    capabilities: ["Behavior frequency graph", "Runtime rhythm", "Regression signals", "Release health view"]
  },
  {
    id: "security",
    code: "SEC",
    name: "Security",
    pricing: "$999/mo",
    industry: "Security, compliance, SOC, government",
    promise: "Behavior-risk intelligence for hostile runtime signal review.",
    unlockCopy: "Unlock malicious/protection frequency, risk storms, and structural behavior evidence.",
    metrics: ["Risk score", "Protection pressure", "Hostile signal cadence"],
    capabilities: ["Behavior risk", "Malicious frequency fingerprints", "Protection signals", "Storm triage"]
  },
  {
    id: "performance",
    code: "PERF",
    name: "Performance",
    pricing: "$499/mo",
    industry: "E-commerce, SaaS, gaming, large websites",
    promise: "Frequency and dependency analysis for performance storms and resource pressure.",
    unlockCopy: "Unlock frame, layout, longtask, JS, network, and dependency-chain pressure.",
    metrics: ["Runtime rhythm", "Dependency pressure", "Storm timeline"],
    capabilities: ["Frequency graph", "Dependency chains", "Layout storms", "Network pressure"]
  },
  {
    id: "ai-governance",
    code: "AIG",
    name: "AI Governance",
    pricing: "$999/mo",
    industry: "Legal, compliance, media, enterprise AI governance",
    promise: "AI-like inference, worker, WASM, GPU, and risk-frequency evidence.",
    unlockCopy: "Unlock AI-like runtime pressure, worker/WASM/GPU signals, and governance risk evidence.",
    metrics: ["AI signal score", "Worker frequency", "WASM / GPU pressure"],
    capabilities: ["AI-like inference signals", "Worker frequency", "WASM pressure", "GPU jitter", "Governance evidence"]
  },
  {
    id: "analytics",
    code: "ANL",
    name: "Analytics",
    pricing: "$199/mo",
    industry: "Product analytics, competitive intelligence, research",
    promise: "Buyer-readable behavior and dependency trends for product teams.",
    unlockCopy: "Unlock behavior/dependency trends, normal summaries, and comparison-ready evidence.",
    metrics: ["Behavior trend", "Dependency trend", "Buyer summary"],
    capabilities: ["Normal insights", "Behavior dependency view", "Trend comparison", "Exportable summaries"]
  },
  {
    id: "oem-platform",
    code: "OEM",
    name: "OEM / Platform",
    pricing: "$50k-$150k/yr",
    industry: "Platforms, data licensing, enterprise integrations",
    promise: "All V1 organs for embedding SIG9 into a platform product.",
    unlockCopy: "Unlock the complete V1 organ model, exports, raw evidence, and platform integration surfaces.",
    metrics: ["All organs", "API/export value", "Platform coverage"],
    capabilities: ["All V1 organs", "Terminal model", "API exports", "Enterprise embedding"]
  }
]);
const WEB_V2_MODULES = Object.freeze([
  {
    id: "web-activity-intelligence",
    marketName: "Web Activity Intelligence",
    sourceUi: "Energy / Supply",
    structuralMapping: "Behavior",
    runtimeEvents: ["Interaction", "Execution", "Resources"],
    metrics: ["Activity Load", "Activity Density", "Activity Intensity", "Activity Anomalies"]
  },
  {
    id: "web-rhythm-engine",
    marketName: "Web Rhythm Engine",
    sourceUi: "Frequency / Frequency Spectrum Graph",
    structuralMapping: "Frequency",
    runtimeEvents: ["Presentation", "Resources", "Execution", "Synchronization"],
    metrics: ["Request Rhythm", "Latency Rhythm", "Error Rhythm", "Burst Rhythm"]
  },
  {
    id: "web-dependency-graph",
    marketName: "Web Dependency Graph",
    sourceUi: "Topology",
    structuralMapping: "Dependency",
    runtimeEvents: ["Communication", "Execution", "Resources"],
    metrics: ["Service Topology", "API Topology", "Resource Topology", "Failure Propagation"]
  },
  {
    id: "web-risk-surface",
    marketName: "Web Risk Surface",
    sourceUi: "Structural Pipeline",
    structuralMapping: "Risk",
    runtimeEvents: ["Security", "Communication", "Execution"],
    metrics: ["Risk Clusters", "Risk Propagation", "Risk Density", "Risk Prediction"]
  },
  {
    id: "web-flow-map",
    marketName: "Web Flow Map",
    sourceUi: "Organ Structural Rendering",
    structuralMapping: "Geometry",
    runtimeEvents: ["Communication", "Presentation", "Interaction"],
    metrics: ["Flow Topology", "Flow Shape", "Flow Anomalies", "Flow Folding"]
  },
  {
    id: "web-time-dynamics",
    marketName: "Web Time Dynamics",
    sourceUi: "Version 2 module",
    structuralMapping: "Time",
    runtimeEvents: ["Synchronization", "Execution", "Resources"],
    metrics: ["Time Density", "Time Folding", "Event Time", "Burst Time"]
  },
  {
    id: "web-influence-map",
    marketName: "Web Influence Map",
    sourceUi: "Version 2 module",
    structuralMapping: "Coupling",
    runtimeEvents: ["Execution", "Communication", "Security"],
    metrics: ["Service Influence", "Latency Influence", "Behavior Influence", "Risk Influence"]
  },
  {
    id: "web-state-evolution",
    marketName: "Web State Evolution",
    sourceUi: "Version 2 module",
    structuralMapping: "Evolution",
    runtimeEvents: ["Synchronization", "Persistence", "Presentation"],
    metrics: ["State Transitions", "State Drift", "State Velocity", "Evolution Prediction"]
  },
  {
    id: "web-signal-compression",
    marketName: "Web Signal Compression",
    sourceUi: "Version 2 module",
    structuralMapping: "Compression",
    runtimeEvents: ["Compute", "Presentation", "Security", "Communication"],
    metrics: ["Behavior Compression", "Risk Compression", "Flow Compression", "Dependency Compression"]
  }
]);
const RUNTIME_EVENT_CATEGORIES = Object.freeze([
  { name: "Interaction", detail: "User and page interaction events: clicks, input, pointer, keyboard, focus, and event dispatch." },
  { name: "Presentation", detail: "Rendered surface events: DOM, layout, CSSOM, Shadow DOM, VDOM, paint, and accessibility structure." },
  { name: "Communication", detail: "Network and cross-context movement: fetch, XHR, WebSocket, frames, postMessage, and channels." },
  { name: "Synchronization", detail: "Timing coordination: timers, rAF, microtasks, Promise chains, lifecycle, and scheduling drift." },
  { name: "Persistence", detail: "Client-held state: storage, cookies, IndexedDB, Cache API, history state, and session markers." },
  { name: "Execution", detail: "Runtime execution: JavaScript, workers, errors, long tasks, scripts, framework hooks, and console facts." },
  { name: "Security", detail: "Protection and risk surface: CAPTCHA, anti-bot, auth, challenge, policy, and suspicious runtime pressure." },
  { name: "Resources", detail: "Assets and supply path: scripts, images, stylesheets, CDN, Service Worker, and resource timing." },
  { name: "Compute", detail: "Heavy local processing: WASM, WebGPU, GPU jitter, AI-like inference, embedding, and model-loading signals." }
]);
const UI_RUNTIME_EVENT_MAP = Object.freeze({
  "Signal Quality": RUNTIME_EVENT_CATEGORIES.map(category => category.name),
  "Layer Coverage": ["Presentation", "Execution", "Resources", "Communication"],
  "Channels Graph": ["Communication"],
  "Technology Profile": ["Execution", "Persistence", "Communication", "Security"],
  "Structural Pipeline": RUNTIME_EVENT_CATEGORIES.map(category => category.name),
  "SIG9 Graph": ["SIG9 organ layer"],
  "Frequency Spectrum": ["Security", "Compute", "Presentation", "Execution"],
  "Commercial Package Suite": ["Resources", "Execution", "Synchronization", "Security", "Communication", "Presentation", "Compute"],
  "Structure Engine": RUNTIME_EVENT_CATEGORIES.map(category => category.name),
  "Recent Facts": RUNTIME_EVENT_CATEGORIES.map(category => category.name)
});
const RUNTIME_EVENT_TO_SIG9_ORGANS = Object.freeze({
  Interaction: ["Behavior"],
  Presentation: ["Rhythm", "Compression"],
  Communication: ["Flow"],
  Synchronization: ["Time", "State"],
  Persistence: ["State"],
  Execution: ["Influence", "Dependency"],
  Security: ["Risk"],
  Resources: ["Dependency", "Rhythm"],
  Compute: ["Influence", "Compression"]
});
const PACKAGE_RUNTIME_EVENT_MAP = Object.freeze({
  DevOps: ["Resources", "Execution", "Synchronization"],
  Security: ["Security", "Communication"],
  Performance: ["Presentation", "Resources", "Execution"],
  "AI Governance": ["Compute", "Execution"],
  Analytics: ["Interaction", "Communication", "Persistence"],
  "OEM / Platform": RUNTIME_EVENT_CATEGORIES.map(category => category.name)
});
const RAW_FACT_MAPPING_REGISTRY_VERSION = "atrinit-raw-fact-registry-v1";
const RAW_FACT_TO_SIG9_ORGAN = Object.freeze({
  layout_shift: ["Value"],
  forced_reflow: ["Rhythm"],
  layout_rhythm: ["Rhythm"],
  layout_dependency: ["Topology"],
  layout_type_change: ["Behavior"],
  paint_order_change: ["Behavior"],
  stacking_context_change: ["Topology"],
  vdom_commit: ["Rhythm"],
  vdom_update: ["Rhythm"],
  vdom_diff: ["Behavior"],
  vdom_break: ["Value"],
  vdom_topology: ["Topology"],
  vdom_state_change: ["Behavior"],
  vdom_props_change: ["Behavior"],
  css_rule_insert: ["Behavior"],
  css_rule_delete: ["Behavior"],
  css_animation: ["Rhythm"],
  css_transition: ["Rhythm"],
  style_recalc: ["Rhythm"],
  forced_style_recalc: ["Value"],
  cascade_conflict: ["Value"],
  selector_conflict: ["Value"],
  specificity_conflict: ["Value"],
  selector_topology: ["Topology"],
  a11y_break: ["Value"],
  a11y_conflict: ["Value"],
  a11y_role_change: ["Behavior"],
  a11y_state_change: ["Behavior"],
  a11y_topology: ["Topology"],
  js_event_loop_render: ["Rhythm"],
  js_event_loop_idle: ["Rhythm"],
  js_microtask: ["Rhythm"],
  js_promise_chain: ["Dependency"],
  js_fetch_start: ["Flow"],
  js_fetch_end: ["Flow"],
  js_ws_send: ["Flow"],
  js_ws_message: ["Flow"],
  js_worker_message: ["Flow", "Dependency"],
  js_block: ["Rhythm"],
  js_error: ["Lifecycle"],
  shadow_root_created: ["Topology"],
  shadow_node: ["Topology"],
  shadow_mapping: ["Topology"],
  shadow_topology: ["Topology"],
  slot_change: ["Behavior"],
  iframe_created: ["Dependency"],
  iframe_loaded: ["Flow"],
  post_message: ["Flow", "Dependency"],
  worker_created: ["Dependency"],
  worker_message: ["Flow"],
  worker_post: ["Flow"],
  sw_register: ["Dependency"],
  sw_activated: ["Flow"],
  sw_fetch: ["Flow", "Dependency"],
  message_channel_created: ["Dependency"],
  message_channel_message: ["Flow"]
});
const RAW_FACT_REGISTRY_ENTRIES = Object.freeze([
  rawFactEntry("layout", ["layout_shift"], ["Presentation"], "Layout", "Layout instability changes visible presentation.", 0.96),
  rawFactEntry("layout", ["forced_reflow", "layout_rhythm"], ["Presentation", "Synchronization"], "Layout", "Layout timing and reflow facts describe rendered timing pressure.", 0.95),
  rawFactEntry("layout", ["layout_dependency", "stacking_context_change"], ["Presentation", "Communication"], "Layout", "Layout dependency facts describe structural relationships between rendered elements.", 0.93),
  rawFactEntry("layout", ["layout_type_change", "paint_order_change"], ["Presentation", "Interaction"], "Layout", "Layout/paint ordering changes affect observable page behavior.", 0.9),
  rawFactEntry("layout", ["layout_tree"], ["Presentation", "Communication"], "Layout", "Layout tree facts describe rendered topology.", 0.9),
  rawFactEntry("vdom", ["vdom_commit", "vdom_update"], ["Presentation", "Synchronization"], "Virtual DOM", "Framework commits and updates are rendered timing events.", 0.92),
  rawFactEntry("vdom", ["vdom_diff", "vdom_state_change", "vdom_props_change"], ["Presentation", "Interaction"], "Virtual DOM", "Framework diff, state, and prop changes alter visible behavior.", 0.92),
  rawFactEntry("vdom", ["vdom_break"], ["Presentation", "Security"], "Virtual DOM", "VDOM breakage is a rendered integrity/value issue.", 0.88),
  rawFactEntry("vdom", ["vdom_topology", "vdom_capability"], ["Presentation", "Communication"], "Virtual DOM", "Framework topology/capability facts describe component structure.", 0.86),
  rawFactEntry("cssom", ["css_rule_insert", "css-rule"], ["Presentation", "Interaction"], "CSSOM", "CSS rule insertions change the visible behavior of the page.", 0.94),
  rawFactEntry("cssom", ["css_rule_delete"], ["Presentation", "Interaction"], "CSSOM", "CSS rule deletions change the visible behavior of the page.", 0.94),
  rawFactEntry("cssom", ["css_animation", "css_transition", "style_recalc", "stylesheet-change"], ["Presentation", "Synchronization"], "CSSOM", "Animation, transition, and style recalculation facts describe visual timing.", 0.93),
  rawFactEntry("cssom", ["forced_style_recalc", "cascade_conflict", "selector_conflict", "specificity_conflict"], ["Presentation", "Security"], "CSSOM", "Style recalculation and cascade conflicts are presentation integrity issues.", 0.9),
  rawFactEntry("cssom", ["selector_topology"], ["Presentation", "Communication"], "CSSOM", "Selector topology connects rendered rules to page structure.", 0.88),
  rawFactEntry("a11y", ["a11y_break", "a11y_conflict"], ["Presentation", "Security"], "Accessibility", "Accessibility break/conflict facts describe user-facing integrity risk.", 0.92),
  rawFactEntry("a11y", ["a11y_role_change", "a11y_state_change"], ["Presentation", "Interaction"], "Accessibility", "ARIA role/state changes alter user interaction semantics.", 0.9),
  rawFactEntry("a11y", ["a11y_topology", "cdp_ax_tree"], ["Presentation", "Communication"], "Accessibility", "Accessibility topology describes relationships in the rendered accessibility tree.", 0.9),
  rawFactEntry("runtime", ["js_event_loop_render", "js_event_loop_idle", "js_microtask", "js_block", "scheduling"], ["Execution", "Synchronization"], "JS Runtime", "Event loop, scheduler, and microtask facts describe execution timing.", 0.94),
  rawFactEntry("runtime", ["js_promise_chain"], ["Execution", "Communication"], "JS Runtime", "Promise chains connect asynchronous execution paths.", 0.9),
  rawFactEntry("runtime", ["js_fetch_start", "js_fetch_end", "js_ws_send", "js_ws_message", "js_worker_message"], ["Communication", "Execution"], "JS Runtime", "Runtime network and worker message facts connect execution to communication.", 0.94),
  rawFactEntry("runtime", ["script-error", "unhandled-rejection", "js_error", "console"], ["Execution", "Security"], "JS Runtime", "Runtime errors and suspicious console states are execution integrity facts.", 0.9),
  rawFactEntry("runtime", ["navigation", "page-lifecycle", "diagnostics_tick", "collector-state", "health-heartbeat", "layer_coverage"], ["Synchronization", "Execution"], "JS Runtime", "Lifecycle, diagnostic tick, and collector health facts describe runtime state coordination.", 0.86),
  rawFactEntry("shadow", ["shadow_root_created", "shadow_node", "shadow_mapping", "shadow_topology", "shadow-root"], ["Presentation", "Communication"], "Shadow DOM", "Shadow DOM structure maps rendered components to hidden host relationships.", 0.9),
  rawFactEntry("shadow", ["slot_change"], ["Presentation", "Interaction"], "Shadow DOM", "Slot changes alter projected component behavior.", 0.9),
  rawFactEntry("multicontext", ["iframe_created", "worker_created", "message_channel_created"], ["Communication", "Execution"], "Frames/workers", "Frame, worker, and channel creation adds cross-context execution paths.", 0.91),
  rawFactEntry("multicontext", ["iframe_loaded", "post_message", "worker_message", "worker_post", "message_channel_message"], ["Communication", "Resources"], "Frames/workers", "Cross-context messages and loaded frames move data/resources across boundaries.", 0.91),
  rawFactEntry("multicontext", ["sw_register", "sw_activated", "sw_fetch", "sw_fetch_capability"], ["Resources", "Synchronization"], "Service Worker", "Service worker facts describe resource lifecycle and timing boundaries.", 0.88),
  rawFactEntry("network", ["document-fetch", "resource-map", "request", "response", "error", "request-failed", "response-status", "resource-observed"], ["Communication", "Resources"], "Network", "Network/resource facts describe request flow and asset supply.", 0.94),
  rawFactEntry("storage", ["storage-change", "storage-snapshot", "indexeddb-open"], ["Persistence"], "Storage", "Storage facts describe client-held state without exposing values.", 0.95),
  rawFactEntry("anti_crawler", ["challenge", "fingerprint", "block", "service-worker"], ["Security"], "Protection", "Crawler/anti-bot markers describe page protection pressure.", 0.95),
  rawFactEntry("crawler", ["crawler-pattern", "crawler-behavior"], ["Security", "Synchronization"], "Crawler cadence", "Crawler-like timing and behavior facts describe suspicious cadence.", 0.88),
  rawFactEntry("browser", ["rendered-dom-snapshot"], ["Presentation"], "Rendered browser", "Rendered browser snapshots describe what the secure runtime saw on the page.", 0.86),
  rawFactEntry("web_bloomberg", ["behavior-window"], ["Synchronization", "Execution", "Communication"], "SIG9 Signal Console", "Behavior windows aggregate timing, execution, and communication pressure.", 0.88),
  rawFactEntry("dom", ["mutation-burst", "element-change", "attribute-change", "text-change", "structure-snapshot", "calendar-structure", "iframe-observed", "shadow-root"], ["Presentation", "Interaction"], "DOM", "DOM facts describe visible structure and user-facing page changes.", 0.93),
  rawFactEntry("performance", ["long-task"], ["Execution", "Synchronization"], "Performance", "Long task facts describe main-thread execution pressure.", 0.92)
]);
const RAW_FACT_MAPPING_BY_KEY = Object.freeze(buildRawFactMappingIndex(RAW_FACT_REGISTRY_ENTRIES));
const RANKING_BOARDS = Object.freeze([
  { id: "overall", name: "Overall", subtitle: "Weighted score across SIG9 commercial packages and Web Version 2 modules." },
  ...PACKAGE_DEFINITIONS.map(definition => ({ id: definition.id, name: definition.name, subtitle: definition.promise, boardKind: "package" })),
  ...WEB_V2_MODULES.map(module => ({ id: module.id, name: module.marketName, subtitle: `${module.structuralMapping} view: ${module.metrics.join(", ")}`, boardKind: "web-v2" }))
]);
const RANKING_SEED_VERSION = "2026-07-04-expanded-01";
const BENCHMARK_SEED_RANKINGS = Object.freeze([
  rankingSeedSample("roblox.com", "Gaming platform benchmark", { "structure-monitor": .72, "performance-spectrum": .67, "update-radar": .76, "risk-score-engine": .58, "ai-activity-detector": .42 }, ["High interactivity", "Frequent resource churn", "Gaming-scale runtime"]),
  rankingSeedSample("github.com", "Developer platform benchmark", { "structure-monitor": .76, "performance-spectrum": .74, "update-radar": .63, "risk-score-engine": .31, "ai-activity-detector": .18 }, ["Structured application shell", "Moderate updates", "Low risk seed"]),
  rankingSeedSample("wikipedia.org", "Reference content benchmark", { "structure-monitor": .55, "performance-spectrum": .86, "update-radar": .24, "risk-score-engine": .18, "ai-activity-detector": .06 }, ["Low runtime churn", "Fast content delivery", "Stable structure"]),
  rankingSeedSample("nytimes.com", "Media site benchmark", { "structure-monitor": .68, "performance-spectrum": .48, "update-radar": .82, "risk-score-engine": .46, "ai-activity-detector": .2 }, ["High content cadence", "Ad/resource pressure", "Frequent layout changes"]),
  rankingSeedSample("amazon.com", "Commerce site benchmark", { "structure-monitor": .79, "performance-spectrum": .52, "update-radar": .88, "risk-score-engine": .52, "ai-activity-detector": .28 }, ["Commerce personalization", "Heavy resource graph", "High update cadence"]),
  rankingSeedSample("bloomberg.com", "Finance media benchmark", { "structure-monitor": .74, "performance-spectrum": .45, "update-radar": .84, "risk-score-engine": .57, "ai-activity-detector": .31 }, ["Paywall/runtime pressure", "Market-content cadence", "Protection signals"]),
  rankingSeedSample("figma.com", "Creative SaaS benchmark", { "structure-monitor": .81, "performance-spectrum": .62, "update-radar": .58, "risk-score-engine": .36, "ai-activity-detector": .35 }, ["Canvas-heavy app", "Worker/runtime signals", "SaaS interaction"]),
  rankingSeedSample("openai.com", "AI product site benchmark", { "structure-monitor": .62, "performance-spectrum": .71, "update-radar": .55, "risk-score-engine": .27, "ai-activity-detector": .39 }, ["Marketing plus app routes", "AI-adjacent signals", "Moderate update cadence"]),
  rankingSeedSample("google.com", "Search platform benchmark", { "structure-monitor": .48, "performance-spectrum": .9, "update-radar": .34, "risk-score-engine": .22, "ai-activity-detector": .18 }, ["Low visible structure", "Highly optimized runtime", "Search surface"]),
  rankingSeedSample("youtube.com", "Video platform benchmark", { "structure-monitor": .78, "performance-spectrum": .44, "update-radar": .86, "risk-score-engine": .49, "ai-activity-detector": .33 }, ["Video-heavy runtime", "Recommendation churn", "High resource pressure"]),
  rankingSeedSample("netflix.com", "Streaming platform benchmark", { "structure-monitor": .66, "performance-spectrum": .58, "update-radar": .52, "risk-score-engine": .35, "ai-activity-detector": .25 }, ["Media runtime", "Personalized shell", "Moderate protection"]),
  rankingSeedSample("spotify.com", "Audio streaming benchmark", { "structure-monitor": .65, "performance-spectrum": .63, "update-radar": .55, "risk-score-engine": .29, "ai-activity-detector": .22 }, ["Streaming shell", "Playback resources", "Account-first UX"]),
  rankingSeedSample("twitch.tv", "Live video community benchmark", { "structure-monitor": .82, "performance-spectrum": .39, "update-radar": .9, "risk-score-engine": .55, "ai-activity-detector": .34 }, ["Live chat churn", "Video pressure", "Community updates"]),
  rankingSeedSample("reddit.com", "Community platform benchmark", { "structure-monitor": .73, "performance-spectrum": .56, "update-radar": .78, "risk-score-engine": .38, "ai-activity-detector": .2 }, ["Feed churn", "Comment trees", "Moderate resource pressure"]),
  rankingSeedSample("x.com", "Social feed benchmark", { "structure-monitor": .76, "performance-spectrum": .5, "update-radar": .91, "risk-score-engine": .44, "ai-activity-detector": .26 }, ["Feed updates", "Realtime cadence", "Social graph"]),
  rankingSeedSample("linkedin.com", "Professional network benchmark", { "structure-monitor": .7, "performance-spectrum": .57, "update-radar": .74, "risk-score-engine": .33, "ai-activity-detector": .2 }, ["Feed plus jobs", "Profile surface", "Business network"]),
  rankingSeedSample("facebook.com", "Large social platform benchmark", { "structure-monitor": .84, "performance-spectrum": .42, "update-radar": .89, "risk-score-engine": .51, "ai-activity-detector": .29 }, ["Large runtime graph", "Realtime feed", "Heavy personalization"]),
  rankingSeedSample("instagram.com", "Media social benchmark", { "structure-monitor": .71, "performance-spectrum": .49, "update-radar": .8, "risk-score-engine": .36, "ai-activity-detector": .24 }, ["Media feed", "Visual runtime", "Interaction cadence"]),
  rankingSeedSample("tiktok.com", "Short video platform benchmark", { "structure-monitor": .8, "performance-spectrum": .4, "update-radar": .88, "risk-score-engine": .53, "ai-activity-detector": .38 }, ["Short-video runtime", "Recommendation pressure", "High media churn"]),
  rankingSeedSample("discord.com", "Realtime communication benchmark", { "structure-monitor": .78, "performance-spectrum": .55, "update-radar": .69, "risk-score-engine": .34, "ai-activity-detector": .3 }, ["Realtime app shell", "Worker-like pressure", "Messaging cadence"]),
  rankingSeedSample("slack.com", "Enterprise collaboration benchmark", { "structure-monitor": .75, "performance-spectrum": .59, "update-radar": .64, "risk-score-engine": .28, "ai-activity-detector": .24 }, ["Workspace app", "Realtime collaboration", "Enterprise UX"]),
  rankingSeedSample("notion.so", "Productivity SaaS benchmark", { "structure-monitor": .83, "performance-spectrum": .5, "update-radar": .62, "risk-score-engine": .3, "ai-activity-detector": .33 }, ["Editor runtime", "Block document graph", "SaaS shell"]),
  rankingSeedSample("docs.google.com", "Collaborative editor benchmark", { "structure-monitor": .88, "performance-spectrum": .46, "update-radar": .7, "risk-score-engine": .32, "ai-activity-detector": .27 }, ["Document editor", "Realtime collaboration", "Complex DOM"]),
  rankingSeedSample("drive.google.com", "Cloud storage app benchmark", { "structure-monitor": .72, "performance-spectrum": .61, "update-radar": .5, "risk-score-engine": .26, "ai-activity-detector": .18 }, ["File manager", "Cloud app shell", "Moderate updates"]),
  rankingSeedSample("dropbox.com", "Cloud storage benchmark", { "structure-monitor": .62, "performance-spectrum": .66, "update-radar": .42, "risk-score-engine": .23, "ai-activity-detector": .15 }, ["Storage UX", "Stable SaaS surface", "Lower churn"]),
  rankingSeedSample("shopify.com", "Commerce platform benchmark", { "structure-monitor": .69, "performance-spectrum": .64, "update-radar": .66, "risk-score-engine": .27, "ai-activity-detector": .19 }, ["Commerce SaaS", "Merchant platform", "Moderate runtime"]),
  rankingSeedSample("etsy.com", "Marketplace benchmark", { "structure-monitor": .71, "performance-spectrum": .5, "update-radar": .83, "risk-score-engine": .4, "ai-activity-detector": .18 }, ["Marketplace search", "Listing churn", "Commerce resources"]),
  rankingSeedSample("ebay.com", "Marketplace benchmark", { "structure-monitor": .69, "performance-spectrum": .52, "update-radar": .79, "risk-score-engine": .41, "ai-activity-detector": .17 }, ["Listings", "Auction/search surface", "Commerce cadence"]),
  rankingSeedSample("walmart.com", "Retail commerce benchmark", { "structure-monitor": .73, "performance-spectrum": .47, "update-radar": .86, "risk-score-engine": .45, "ai-activity-detector": .19 }, ["Retail personalization", "Heavy product graph", "Commerce pressure"]),
  rankingSeedSample("target.com", "Retail commerce benchmark", { "structure-monitor": .7, "performance-spectrum": .51, "update-radar": .81, "risk-score-engine": .39, "ai-activity-detector": .16 }, ["Product grid", "Retail resource graph", "Update cadence"]),
  rankingSeedSample("bestbuy.com", "Electronics retail benchmark", { "structure-monitor": .68, "performance-spectrum": .49, "update-radar": .76, "risk-score-engine": .37, "ai-activity-detector": .15 }, ["Retail search", "Inventory updates", "Commerce scripts"]),
  rankingSeedSample("cnn.com", "News media benchmark", { "structure-monitor": .66, "performance-spectrum": .43, "update-radar": .87, "risk-score-engine": .49, "ai-activity-detector": .18 }, ["News update cadence", "Ad/resource pressure", "Media shell"]),
  rankingSeedSample("theverge.com", "Tech media benchmark", { "structure-monitor": .61, "performance-spectrum": .5, "update-radar": .72, "risk-score-engine": .34, "ai-activity-detector": .16 }, ["Article surface", "Media resources", "Moderate cadence"]),
  rankingSeedSample("weather.com", "Weather utility benchmark", { "structure-monitor": .64, "performance-spectrum": .42, "update-radar": .82, "risk-score-engine": .47, "ai-activity-detector": .17 }, ["Realtime data panels", "Ad pressure", "Forecast updates"]),
  rankingSeedSample("espn.com", "Sports media benchmark", { "structure-monitor": .68, "performance-spectrum": .46, "update-radar": .85, "risk-score-engine": .42, "ai-activity-detector": .18 }, ["Live scores", "Media resources", "Sports cadence"]),
  rankingSeedSample("airbnb.com", "Travel marketplace benchmark", { "structure-monitor": .77, "performance-spectrum": .55, "update-radar": .7, "risk-score-engine": .31, "ai-activity-detector": .16 }, ["Search map UI", "Marketplace filters", "Travel commerce"]),
  rankingSeedSample("booking.com", "Travel commerce benchmark", { "structure-monitor": .79, "performance-spectrum": .43, "update-radar": .84, "risk-score-engine": .44, "ai-activity-detector": .18 }, ["Inventory pressure", "Travel personalization", "Commerce cadence"]),
  rankingSeedSample("uber.com", "Mobility platform benchmark", { "structure-monitor": .58, "performance-spectrum": .72, "update-radar": .42, "risk-score-engine": .22, "ai-activity-detector": .14 }, ["Marketing plus app routes", "Map-adjacent UX", "Moderate runtime"]),
  rankingSeedSample("doordash.com", "Delivery marketplace benchmark", { "structure-monitor": .74, "performance-spectrum": .5, "update-radar": .82, "risk-score-engine": .39, "ai-activity-detector": .17 }, ["Menu inventory", "Marketplace updates", "Delivery commerce"]),
  rankingSeedSample("chase.com", "Banking benchmark", { "structure-monitor": .53, "performance-spectrum": .73, "update-radar": .28, "risk-score-engine": .34, "ai-activity-detector": .12 }, ["Security-first surface", "Lower public churn", "Financial UX"]),
  rankingSeedSample("bankofamerica.com", "Banking benchmark", { "structure-monitor": .55, "performance-spectrum": .7, "update-radar": .3, "risk-score-engine": .35, "ai-activity-detector": .11 }, ["Financial surface", "Security boundary", "Stable public UX"]),
  rankingSeedSample("stripe.com", "Payments platform benchmark", { "structure-monitor": .63, "performance-spectrum": .75, "update-radar": .41, "risk-score-engine": .2, "ai-activity-detector": .16 }, ["Developer docs", "Payments SaaS", "Optimized public pages"]),
  rankingSeedSample("coinbase.com", "Crypto finance benchmark", { "structure-monitor": .69, "performance-spectrum": .56, "update-radar": .6, "risk-score-engine": .45, "ai-activity-detector": .2 }, ["Finance app", "Market data cadence", "Security pressure"]),
  rankingSeedSample("tradingview.com", "Market charting benchmark", { "structure-monitor": .86, "performance-spectrum": .38, "update-radar": .78, "risk-score-engine": .46, "ai-activity-detector": .37 }, ["Chart runtime", "Realtime market data", "Canvas/worker pressure"]),
  rankingSeedSample("canva.com", "Creative SaaS benchmark", { "structure-monitor": .84, "performance-spectrum": .44, "update-radar": .61, "risk-score-engine": .31, "ai-activity-detector": .36 }, ["Editor runtime", "Canvas-heavy app", "Creative workflow"]),
  rankingSeedSample("adobe.com", "Creative platform benchmark", { "structure-monitor": .6, "performance-spectrum": .67, "update-radar": .48, "risk-score-engine": .25, "ai-activity-detector": .26 }, ["Creative product surface", "Marketing plus app routes", "Moderate AI adjacency"]),
  rankingSeedSample("microsoft.com", "Enterprise platform benchmark", { "structure-monitor": .58, "performance-spectrum": .72, "update-radar": .46, "risk-score-engine": .24, "ai-activity-detector": .2 }, ["Enterprise surface", "Docs/product graph", "Optimized public runtime"]),
  rankingSeedSample("apple.com", "Product marketing benchmark", { "structure-monitor": .52, "performance-spectrum": .82, "update-radar": .38, "risk-score-engine": .16, "ai-activity-detector": .1 }, ["Highly controlled pages", "Optimized media", "Low churn"]),
  rankingSeedSample("tesla.com", "Automotive commerce benchmark", { "structure-monitor": .57, "performance-spectrum": .7, "update-radar": .45, "risk-score-engine": .21, "ai-activity-detector": .12 }, ["Product configurator", "Media surface", "Commerce path"]),
  rankingSeedSample("nvidia.com", "Hardware AI platform benchmark", { "structure-monitor": .6, "performance-spectrum": .66, "update-radar": .5, "risk-score-engine": .22, "ai-activity-detector": .32 }, ["AI hardware content", "Developer/product pages", "AI-adjacent signals"]),
  rankingSeedSample("huggingface.co", "AI developer platform benchmark", { "structure-monitor": .77, "performance-spectrum": .55, "update-radar": .74, "risk-score-engine": .29, "ai-activity-detector": .49 }, ["Model pages", "Developer community", "AI platform signals"]),
  rankingSeedSample("vercel.com", "Developer infrastructure benchmark", { "structure-monitor": .66, "performance-spectrum": .76, "update-radar": .45, "risk-score-engine": .19, "ai-activity-detector": .22 }, ["Developer platform", "Optimized frontend", "SaaS docs"]),
  rankingSeedSample("cloudflare.com", "Edge infrastructure benchmark", { "structure-monitor": .64, "performance-spectrum": .78, "update-radar": .43, "risk-score-engine": .21, "ai-activity-detector": .2 }, ["Infrastructure docs", "Edge platform", "Security product surface"]),
  rankingSeedSample("salesforce.com", "Enterprise SaaS benchmark", { "structure-monitor": .61, "performance-spectrum": .58, "update-radar": .54, "risk-score-engine": .27, "ai-activity-detector": .19 }, ["Enterprise product surface", "Marketing complexity", "SaaS routes"]),
  rankingSeedSample("oracle.com", "Enterprise software benchmark", { "structure-monitor": .56, "performance-spectrum": .62, "update-radar": .47, "risk-score-engine": .26, "ai-activity-detector": .15 }, ["Enterprise pages", "Docs/products", "Moderate churn"]),
  rankingSeedSample("stackoverflow.com", "Developer Q&A benchmark", { "structure-monitor": .64, "performance-spectrum": .7, "update-radar": .51, "risk-score-engine": .23, "ai-activity-detector": .12 }, ["Content-heavy forum", "Developer traffic", "Stable document structure"]),
  rankingSeedSample("medium.com", "Publishing platform benchmark", { "structure-monitor": .59, "performance-spectrum": .68, "update-radar": .57, "risk-score-engine": .24, "ai-activity-detector": .11 }, ["Article platform", "Publishing cadence", "Moderate scripts"])
]);
rankingLedger = loadRankingLedger();
ensureBenchmarkSeedCoverage();

if (hasExtensionRuntime) initialize();
else initializeStandalone();

initializeCommercialShell();

function normalizeLanguage(locale) {
  const packets = globalThis.SIG9_LANGUAGE_PACKETS || {};
  const requested = String(locale || "en").toLowerCase();
  if (packets[requested]) return requested;
  const base = requested.split("-")[0];
  return packets[base] ? base : "en";
}

function languagePacket(locale = activeLanguage) {
  if (typeof globalThis.getOrgan9LanguagePacket === "function") return globalThis.getOrgan9LanguagePacket(locale);
  return (globalThis.SIG9_LANGUAGE_PACKETS || {}).en || { meta: { label: "English", dir: "ltr" }, labels: {} };
}

function languageText(key, fallback = "") {
  const current = languagePacket(activeLanguage)?.labels || {};
  const english = languagePacket("en")?.labels || {};
  return current[key] || english[key] || fallback || key;
}

function phraseText(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean || activeLanguage === "en") return clean;
  const current = languagePacket(activeLanguage)?.phrases || {};
  const english = languagePacket("en")?.phrases || {};
  const exact = current[clean] || english[clean];
  if (exact) return exact;
  return substituteLanguageFragments(clean);
}

function substituteLanguageFragments(text) {
  const substitutions = globalThis.SIG9_LANGUAGE_SUBSTITUTIONS?.[activeLanguage] || {};
  let translated = String(text || "");
  let entries = substitutionEntryCache.get(activeLanguage);
  if (!entries) {
    entries = Object.entries(substitutions)
      .sort((a, b) => b[0].length - a[0].length)
      .map(([source, target]) => {
        const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const needsBoundary = /^[A-Za-z0-9 /+-]+$/.test(source);
        return [source, target, needsBoundary
          ? new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, "g")
          : new RegExp(escaped, "g")];
      });
    substitutionEntryCache.set(activeLanguage, entries);
  }
  for (const [, target, pattern] of entries) {
    translated = translated.replace(pattern, target);
  }
  return translated;
}

function localizeVisibleText(root = document.body) {
  if (!root || activeLanguage === "en" || localizingText) return;
  localizingText = true;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.nodeValue || "";
        if (!value.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE", "TEXTAREA", "OPTION"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-no-i18n], input, select, textarea, code, pre")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
      const original = originalTextNodes.get(node);
      const prefix = original.match(/^\s*/)?.[0] || "";
      const suffix = original.match(/\s*$/)?.[0] || "";
      const translated = phraseText(original);
      if (translated && translated !== original.trim()) node.nodeValue = `${prefix}${translated}${suffix}`;
    }
  } finally {
    localizingText = false;
  }
}

function resetVisibleTextToEnglish(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (originalTextNodes.has(node)) node.nodeValue = originalTextNodes.get(node);
  }
}

function scheduleLanguagePass(root = document.body) {
  if (!root) return;
  const elementRoot = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;
  if (!elementRoot) return;
  if (elementRoot === document.body) {
    pendingLanguageRoots = new Set([document.body]);
  } else if (!pendingLanguageRoots.has(document.body)) {
    pendingLanguageRoots.add(elementRoot);
  }
  if (languagePassTimer) return;
  languagePassTimer = setTimeout(() => {
    languagePassTimer = null;
    const roots = [...pendingLanguageRoots];
    pendingLanguageRoots.clear();
    const finalRoots = roots.includes(document.body)
      ? [document.body]
      : roots.filter((rootItem, index) => !roots.some((other, otherIndex) => otherIndex !== index && other.contains?.(rootItem)));
    requestAnimationFrame(() => {
      for (const rootItem of finalRoots.slice(0, 24)) {
        if (activeLanguage === "en") resetVisibleTextToEnglish(rootItem);
        else localizeVisibleText(rootItem);
      }
    });
  }, 120);
}

function ensureLanguageObserver() {
  if (languageObserver || !document.body) return;
  languageObserver = new MutationObserver(mutations => {
    if (localizingText || activeLanguage === "en") return;
    const roots = new Set();
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const parent = node.parentElement;
          if (parent) roots.add(parent);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          roots.add(node);
        }
      }
    }
    for (const root of roots) scheduleLanguagePass(root);
  });
  languageObserver.observe(document.body, { childList: true, subtree: true });
}

function setLocalizedText(element, key) {
  if (!element) return;
  element.textContent = languageText(key, element.textContent);
}

function applyLanguage(locale = activeLanguage) {
  resetVisibleTextToEnglish(document.body);
  activeLanguage = normalizeLanguage(locale);
  const storageKey = globalThis.SIG9_LANGUAGE_STORAGE_KEY || "SIG9WebsiteLanguage";
  localStorage.setItem(storageKey, activeLanguage);
  const packet = languagePacket(activeLanguage);
  document.documentElement.lang = activeLanguage;
  document.documentElement.dir = packet.meta?.dir || "ltr";
  if (elements.languageSelect) {
    const packets = globalThis.SIG9_LANGUAGE_PACKETS || {};
    const safeLabels = { en: "English", zh: "Chinese", es: "Spanish" };
    for (const option of elements.languageSelect.options) {
      option.textContent = safeLabels[option.value] || packets[option.value]?.meta?.label || option.textContent;
    }
    elements.languageSelect.value = activeLanguage;
    elements.languageSelect.setAttribute("aria-label", languageText("languageLabel", "Language"));
  }
  setLocalizedText(elements.skipLink, "skipLink");
  setLocalizedText(elements.languageLabel, "languageLabel");
  setLocalizedText(elements.platformEyebrow, "platformEyebrow");
  setLocalizedText(elements.navHome, "navHome");
  setLocalizedText(elements.navPlatform, "navPlatform");
  setLocalizedText(elements.navProducts, "navProducts");
  setLocalizedText(elements.navResources, "navResources");
  setLocalizedText(elements.navDashboard, "navDashboard");
  setLocalizedText(elements.navModules, "navModules");
  setLocalizedText(elements.navRankings, "navRankings");
  setLocalizedText(elements.navPlans, "navPlans");
  setLocalizedText(elements.navDocs, "navDocs");
  setLocalizedText(elements.navSignIn, "navSignIn");
  setLocalizedText(elements.signOutButton, "signOutButton");
  setLocalizedText(elements.normalMode, "normalMode");
  setLocalizedText(elements.devMode, "devMode");
  if (diagnosticsEnabled) setLocalizedText(elements.toggleDiagnostics, "toggleDiagnostics");
  setLocalizedText(elements.refresh, "refresh");
  setLocalizedText(elements.exportJson, "exportJson");
  setLocalizedText(elements.exportAllJson, "exportAllJson");
  setLocalizedText(elements.clear, "clear");
  setLocalizedText(elements.homeEyebrow, "homeEyebrow");
  setLocalizedText(elements.homeHeadline, "homeHeadline");
  setLocalizedText(elements.homeCopy, "homeCopy");
  setLocalizedText(elements.homeStart, "homeStart");
  setLocalizedText(elements.homePricing, "homePricing");
  setLocalizedText(elements.authEyebrow, "authEyebrow");
  setLocalizedText(elements.authHeadline, "authHeadline");
  setLocalizedText(elements.authBody, "authBody");
  setLocalizedText(elements.authSignIn, "authTabSignIn");
  setLocalizedText(elements.authSignUp, "authTabSignUp");
  setLocalizedText(elements.plansEyebrow, "plansEyebrow");
  setLocalizedText(elements.plansHeadline, "plansHeadline");
  setLocalizedText(elements.plansCopy, "plansCopy");
  setLocalizedText(elements.corePlansHeading, "corePlans");
  setLocalizedText(elements.paidModulesHeading, "paidModules");
  setLocalizedText(elements.addonsHeading, "addons");
  setLocalizedText(elements.buyingFaqHeading, "buyingFaq");
  setLocalizedText(elements.productionChecklistHeading, "productionChecklist");
  setLocalizedText(elements.modulesEyebrow, "modulesEyebrow");
  setLocalizedText(elements.modulesHeadline, "modulesHeadline");
  setLocalizedText(elements.modulesCopy, "modulesCopy");
  setLocalizedText(elements.rankingsEyebrow, "rankingsEyebrow");
  setLocalizedText(elements.rankingsHeadline, "rankingsHeadline");
  setLocalizedText(elements.rankingsCopy, "rankingsCopy");
  setLocalizedText(elements.rankingStartCrawler, "rankingStartCrawler");
  setLocalizedText(elements.rankingRunOnce, "rankingRunOnce");
  setLocalizedText(elements.rankingStopCrawler, "rankingStopCrawler");
  setLocalizedText(elements.rankingAddCurrent, "rankingAddCurrent");
  setLocalizedText(elements.rankingImportCrawler, "rankingImportCrawler");
  setLocalizedText(elements.rankingSeed, "rankingSeed");
  setLocalizedText(elements.rankingExport, "rankingExport");
  setLocalizedText(elements.focusLatest, "dashboardFocus");
  setLocalizedText(elements.footerPricing, "footerPricing");
  setLocalizedText(elements.footerDashboard, "footerDashboard");
  setLocalizedText(elements.footerDocs, "footerDocs");
  elements.accountName?.setAttribute("placeholder", languageText("fullNamePlaceholder", "Full name"));
  elements.accountName?.setAttribute("aria-label", languageText("fullNamePlaceholder", "Full name"));
  elements.accountEmail?.setAttribute("placeholder", languageText("emailPlaceholder", "you@example.com"));
  elements.accountEmail?.setAttribute("aria-label", languageText("emailPlaceholder", "Email address"));
  elements.accountPassword?.setAttribute("placeholder", languageText("passwordPlaceholder", "Password"));
  elements.accountPassword?.setAttribute("aria-label", languageText("passwordPlaceholder", "Password"));
  const allChannels = elements.channelFilter?.querySelector('option[value=""]');
  if (allChannels) allChannels.textContent = languageText("allChannels", "All channels");
  applyAuthMode(authMode);
  renderAccountState();
  ensureLanguageObserver();
  scheduleLanguagePass(document.body);
}

function initialize() {
  wireCommercialShell();
  elements.toggleDiagnostics.addEventListener("click", toggleDiagnostics);
  elements.refresh.addEventListener("click", refresh);
  elements.exportJson.addEventListener("click", exportJson);
  elements.exportAllJson.addEventListener("click", exportAllJson);
  elements.clear.addEventListener("click", clearDiagnostics);
  elements.openUrl.addEventListener("click", openPortalUrl);
  elements.focusLatest.addEventListener("click", focusLatestTab);
  elements.frequencyWindow.addEventListener("change", saveFrequencySettings);
  elements.channelFilter.addEventListener("change", renderFacts);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (
      changes.runtimeFactChannels ||
      changes.runtimeFactStatus ||
      changes.crawlerSignalHistory ||
      changes.structuralPipelineLatest ||
      changes.updateClassificationHistory ||
      changes.organPipelineState ||
      changes.organPipelineLatest ||
      changes.organFrequencySpectrumState ||
      changes.organFrequencySpectrumLatest
    )) refresh();
  });
  diagnosticsTickTimer = setInterval(diagnosticsTick, 1000);
  loadRuntimeTarget();
  diagnosticsTick();
}

function initializeStandalone() {
  wireCommercialShell();
  document.body.classList.add("standalone-diagnostics");
  elements.toggleDiagnostics.addEventListener("click", toggleStandaloneDiagnostics);
  elements.refresh.addEventListener("click", refreshStandalone);
  elements.exportJson.addEventListener("click", exportStandaloneJson);
  elements.exportAllJson.addEventListener("click", exportStandaloneJson);
  elements.clear.addEventListener("click", clearStandaloneDiagnostics);
  elements.openUrl.addEventListener("click", analyzeStandaloneUrl);
  elements.portalUrl.addEventListener("input", handleStandaloneTargetInput);
  elements.focusLatest.addEventListener("click", focusLatestTab);
  elements.frequencyWindow.addEventListener("change", saveFrequencySettings);
  elements.channelFilter.addEventListener("change", renderFacts);
  elements.focusLatest.textContent = "Focus target";
  elements.toggleDiagnostics.textContent = "Live on";
  elements.toggleDiagnostics.setAttribute("aria-pressed", "true");
  loadStandaloneTarget();
  loadFrequencySettings();
  connectStandaloneDiagnosticsStream();
  loadOperationalStatus();
  healthTimer = setInterval(loadOperationalStatus, 15000);
  standaloneState.timer = setInterval(() => {
    if (canRunStandaloneDiagnostics() && isValidStandaloneTarget(elements.portalUrl.value.trim())) analyzeStandaloneUrl({ quiet: true });
  }, 1000);
}

function initializeCommercialShell() {
  applyLanguage(activeLanguage);
  applyViewMode(viewMode);
  applyAuthMode(authMode);
  renderAccountState();
  applyAppView(accountState.email ? (appView === "sign-in" || appView === "home" ? "dashboard" : appView) : (appView === "dashboard" || appView === "modules" ? "home" : appView));
  renderRankings();
  loadBillingStatus();
  loadFrequencySettings();
}

function wireCommercialShell() {
  elements.languageSelect?.addEventListener("change", () => applyLanguage(elements.languageSelect.value));
  elements.navHome?.addEventListener("click", () => applyAppView("home"));
  elements.navDocs?.addEventListener("click", () => applyAppView("docs"));
  elements.navDashboard?.addEventListener("click", () => applyAppView(accountState.email ? "dashboard" : "sign-in"));
  elements.navModules?.addEventListener("click", () => applyAppView(accountState.email ? "modules" : "sign-in"));
  elements.navRankings?.addEventListener("click", () => applyAppView("rankings"));
  elements.navPlans?.addEventListener("click", () => applyAppView("plans"));
  elements.navSignIn?.addEventListener("click", () => applyAppView(accountState.email ? "dashboard" : "sign-in"));
  document.querySelectorAll(".nav-menu-trigger").forEach(trigger => {
    trigger.addEventListener("click", event => {
      event.stopPropagation();
      const menu = trigger.closest(".nav-menu");
      const willOpen = !menu?.classList.contains("open");
      closeNavigationMenus();
      if (menu && willOpen) {
        menu.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.querySelectorAll(".nav-menu-panel button").forEach(button => {
    button.addEventListener("click", closeNavigationMenus);
  });
  document.addEventListener("click", event => {
    if (!event.target.closest?.(".nav-menu")) closeNavigationMenus();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNavigationMenus();
  });
  elements.homeStart?.addEventListener("click", () => applyAppView(accountState.email ? "dashboard" : "sign-in"));
  elements.homePricing?.addEventListener("click", () => applyAppView("plans"));
  elements.footerPricing?.addEventListener("click", () => applyAppView("plans"));
  elements.footerDashboard?.addEventListener("click", () => applyAppView(accountState.email ? "dashboard" : "sign-in"));
  elements.footerDocs?.addEventListener("click", () => applyAppView("docs"));
  elements.rankingAddCurrent?.addEventListener("click", addCurrentTargetToRankings);
  elements.rankingStartCrawler?.addEventListener("click", startRankingCrawler);
  elements.rankingRunOnce?.addEventListener("click", runRankingCrawlerBatch);
  elements.rankingStopCrawler?.addEventListener("click", stopRankingCrawler);
  elements.rankingImportCrawler?.addEventListener("click", importRankingCrawlerResults);
  elements.rankingSeed?.addEventListener("click", seedRankingLedger);
  elements.rankingExport?.addEventListener("click", exportRankingLedger);
  elements.authSignIn?.addEventListener("click", () => applyAuthMode("sign-in"));
  elements.authSignUp?.addEventListener("click", () => applyAuthMode("sign-up"));
  elements.normalMode?.addEventListener("click", () => applyViewMode("normal"));
  elements.devMode?.addEventListener("click", () => applyViewMode("dev"));
  elements.loginButton?.addEventListener("click", signInDemoAccount);
  [elements.accountName, elements.accountEmail, elements.accountPassword].forEach(input => {
    input?.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      signInDemoAccount();
    });
  });
  elements.signOutButton?.addEventListener("click", signOutAccount);
  elements.planButtons?.forEach(button => {
    button.addEventListener("click", () => choosePlan(button.dataset.billingItem || button.dataset.plan, button));
  });
  elements.moduleTabs?.addEventListener("click", event => {
    const button = event.target.closest("[data-module]");
    if (!button) return;
    selectModule(button.dataset.module);
  });
  elements.moduleDetail?.addEventListener("click", event => {
    const button = event.target.closest("[data-module-action]");
    if (!button) return;
    const plan = button.dataset.moduleAction;
    if (button.dataset.actionKind === "view-plans") {
      activeModule = normalizePlanId(plan) || activeModule;
      localStorage.setItem("runtimeDiagnosticsActiveModule", activeModule);
      applyAppView("plans");
      setPlanStatus(`${readablePlanName(activeModule)} is selected. Choose the package to unlock its module page.`, "");
      return;
    }
    selectModule(plan);
  });
}

function closeNavigationMenus() {
  document.querySelectorAll(".nav-menu.open").forEach(menu => {
    menu.classList.remove("open");
    menu.querySelector(".nav-menu-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function loadAccountState() {
  try {
    return JSON.parse(localStorage.getItem("runtimeDiagnosticsAccount") || "{}");
  } catch {
    return {};
  }
}

function saveAccountState() {
  localStorage.setItem("runtimeDiagnosticsAccount", JSON.stringify(accountState));
}

function signInDemoAccount() {
  const name = elements.accountName?.value.trim() || "";
  const email = elements.accountEmail?.value.trim();
  const password = elements.accountPassword?.value || "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return setAccountStatus("Enter a valid email address to open a workspace session.", "error");
  }
  if (authMode === "sign-up" && name.length < 2) {
    return setAccountStatus("Enter your name to create a workspace.", "error");
  }
  if (password.length < 6) {
    return setAccountStatus("Use at least 6 characters for the sandbox preview password.", "error");
  }
  accountState = {
    name: authMode === "sign-up" ? name : accountState.name || "",
    email,
    plan: accountState.plan || "starter",
    entitlements: accountState.entitlements || null,
    signedInAt: new Date().toISOString(),
    createdAt: accountState.createdAt || (authMode === "sign-up" ? new Date().toISOString() : "")
  };
  saveAccountState();
  renderAccountState();
  applyAppView("dashboard");
  maybeResumeStandaloneDiagnostics();
    setAccountStatus(`${authMode === "sign-up" ? "Workspace created" : "Signed in"} as ${maskEmail(email)}. Subscription access is ready for Authorize.Net hosted checkout configuration.`, "success");
  loadBillingStatus();
}

function signOutAccount() {
  accountState = {};
  entitlementState = null;
  localStorage.removeItem("runtimeDiagnosticsAccount");
  standaloneState.requestId += 1;
  standaloneState.controller?.abort();
  standaloneState.inFlight = false;
  standaloneState.pending = false;
  renderAccountState();
  applyAppView("sign-in");
  setPortalHelp("Signed out. Runtime Diagnostics paused live website analysis.");
}

function renderAccountState() {
  if (!elements.accountStatus) return;
  document.body.classList.toggle("signed-out", !accountState.email);
  document.body.classList.toggle("signed-in", Boolean(accountState.email));
  if (elements.accountChip) {
    elements.accountChip.textContent = accountState.email ? `${maskEmail(accountState.email)} - ${readableBillingName(entitlementState?.plan || accountState.plan || "starter")}` : "Signed out";
  elements.accountChip.title = accountState.email ? `Signed in as ${maskEmail(accountState.email)}` : "Signed out";
    elements.accountChip.setAttribute("aria-label", accountState.email
      ? `Signed in as ${maskEmail(accountState.email)} on ${readableBillingName(entitlementState?.plan || accountState.plan || "starter")}`
      : "Signed out");
  }
  if (accountState.email) {
    elements.accountName.value = accountState.name || "";
    elements.accountEmail.value = accountState.email;
    setAccountStatus(`Signed in as ${maskEmail(accountState.email)}. Access: ${readableBillingName(entitlementState?.plan || accountState.plan || "starter")}. Dev mode ${hasDevModeAccess() ? "unlocked" : "requires Dev Mode Pro"}.`, "success");
  } else {
    setAccountStatus("Signed out. Create or sign into a workspace to open the dashboard.", "");
  }
  renderModulePages(snapshot || buildSnapshot({}));
}

function maskEmail(value) {
  const text = String(value || "");
  const [name, domain] = text.split("@");
  if (!name || !domain) return "Signed in";
  const visible = name.length <= 2 ? `${name[0] || ""}*` : `${name.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}

function setAccountStatus(message, state = "") {
  if (!elements.accountStatus) return;
  elements.accountStatus.textContent = message;
  elements.accountStatus.className = `status-message ${state}`.trim();
}

function setPlanStatus(message, state = "") {
  if (!elements.planStatus) return;
  elements.planStatus.textContent = message;
  elements.planStatus.className = `status-message ${state}`.trim();
}

async function loadBillingStatus() {
  try {
    const response = await fetch("/api/billing/status", { headers: accountState.email ? { "X-Organ9-Account-Email": accountState.email } : {} });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Billing status unavailable.");
    entitlementState = payload.entitlements || payload.billing?.entitlements || entitlementState;
    accountState.entitlements = entitlementState;
    if (entitlementState?.plan) accountState.plan = entitlementState.plan;
    saveAccountState();
    for (const plan of [...(payload.billing?.plans || []), ...(payload.billing?.modules || []), ...(payload.billing?.addons || [])]) {
      const button = [...elements.planButtons].find(item => (item.dataset.billingItem || item.dataset.plan) === plan.id);
      const price = [...elements.planPrices].find(item => (item.dataset.billingPrice || item.dataset.planPrice) === plan.id);
      if (price) {
        price.textContent = plan.available ? plan.priceLabel || "Checkout available" : "Sandbox preview";
        price.classList.toggle("available", Boolean(plan.available));
        price.classList.toggle("demo", !plan.available);
      }
      if (button) {
        button.disabled = false;
        button.title = plan.available ? `Open hosted checkout for ${plan.name}.` : `${plan.name} checkout is not configured; this will request sandbox preview access only.`;
        button.dataset.checkoutAvailable = plan.available ? "true" : "false";
        button.setAttribute("aria-label", plan.available
          ? `Open Authorize.Net hosted checkout for ${plan.name}${plan.priceLabel ? `, ${plan.priceLabel}` : ""}`
          : `Request ${plan.name} in sandbox preview mode because hosted checkout is not configured`);
        if (!plan.available && !button.textContent.includes("Request")) button.textContent = button.textContent.replace(/^Choose|^Discuss/, "Request");
      }
    }
    if (!payload.billing?.configured) {
      setPlanStatus("Authorize.Net Accept Hosted checkout is not configured yet. Buttons are clearly marked as sandbox preview requests.", "success");
      setAccountStatus(accountState.email
        ? `Signed in as ${maskEmail(accountState.email)}. Authorize.Net checkout is not configured yet.`
        : "Signed out. Sandbox access is available after sign-in. Authorize.Net checkout is not configured yet.",
        accountState.email ? "success" : "");
    }
    renderAccountState();
  } catch {
    setPackageButtonsForLocalSelection();
    setPlanStatus("Billing API unavailable in this environment. Package buttons request sandbox preview access only.", "error");
    setAccountStatus(accountState.email
      ? `Signed in as ${maskEmail(accountState.email)}. Billing API unavailable in this environment.`
      : "Signed out. Billing API unavailable in this environment.",
      accountState.email ? "success" : "");
  }
}

function setPackageButtonsForLocalSelection() {
  elements.planButtons?.forEach(button => {
    const planName = readableBillingName(button.dataset.billingItem || button.dataset.plan);
    button.disabled = false;
    button.dataset.checkoutAvailable = "false";
    button.title = `${planName} checkout is unavailable; this will request sandbox preview access.`;
    button.setAttribute("aria-label", `Select ${planName} in sandbox preview mode because hosted checkout is unavailable`);
    if (!button.textContent.includes("Request")) button.textContent = button.textContent.replace(/^Choose|^Discuss/, "Request");
  });
  elements.planPrices?.forEach(price => {
    price.textContent = "Sandbox preview / request access";
    price.classList.remove("available");
    price.classList.add("demo");
  });
}

async function choosePlan(plan, button = null) {
  const normalizedPlan = normalizeBillingItemId(plan);
  if (!normalizedPlan) {
    setPlanStatus("Unknown SIG9 plan, module, or add-on. Refresh the page and try again.", "error");
    return;
  }
  if (!accountState.email) {
    setPlanStatus("Sign in before choosing an SIG9 package.", "error");
    setAccountStatus("Sign in before choosing an SIG9 package.", "error");
    applyAppView("sign-in");
    elements.accountEmail?.focus();
    return;
  }
  if (button?.dataset.checkoutAvailable === "false") {
    applyLocalDemoEntitlement(normalizedPlan);
    saveAccountState();
    renderAccountState();
    if (normalizePlanId(normalizedPlan)) applyAppView("dashboard");
    if (normalizeModuleId(normalizedPlan)) selectModule(normalizedPlan);
    setPlanStatus(`${readableBillingName(normalizedPlan)} added as sandbox preview access. Connect Authorize.Net credentials and item amounts before selling this plan.`, "success");
    return;
  }
  try {
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(accountState.email ? { "X-Organ9-Account-Email": accountState.email } : {}) },
      body: JSON.stringify({ priceId: normalizedPlan, email: accountState.email })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      const error = new Error(payload.error || "Checkout is not configured.");
      error.status = response.status;
      throw error;
    }
    if (!isAuthorizeNetHostedPaymentUrl(payload.url)) throw new Error("Checkout did not return a valid Authorize.Net hosted payment URL.");
    saveAccountState();
    renderAccountState();
    submitAuthorizeNetHostedPayment(payload);
  } catch (error) {
    if (error.status === 503 || /checkout is not configured|not configured/i.test(error.message || "")) {
      applyLocalDemoEntitlement(normalizedPlan);
      saveAccountState();
      renderAccountState();
      if (normalizeModuleId(normalizedPlan)) selectModule(normalizedPlan);
      setPlanStatus(`${readableBillingName(normalizedPlan)} added as sandbox preview access because checkout is not configured.`, "success");
      return;
    }
    setPlanStatus(`Authorize.Net checkout failed for ${readableBillingName(normalizedPlan)}: ${error.message || String(error)} Check the API Login ID, Transaction Key, and sandbox/production environment in Render.`, "error");
  }
}

function isAuthorizeNetHostedPaymentUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && ["accept.authorize.net", "test.authorize.net"].includes(url.hostname.toLowerCase()) && url.pathname === "/payment/payment";
  } catch {
    return false;
  }
}

function submitAuthorizeNetHostedPayment(payload) {
  const token = String(payload.formFields?.token || payload.token || "").trim();
  if (!token) throw new Error("Authorize.Net hosted payment token was missing.");
  const form = document.createElement("form");
  form.method = String(payload.method || "POST").toUpperCase() === "POST" ? "POST" : "POST";
  form.action = payload.url;
  form.style.display = "none";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token";
  input.value = token;
  form.append(input);
  document.body.append(form);
  form.submit();
}

function normalizePlanId(plan) {
  const id = String(plan || "").trim().toLowerCase();
  const aliases = {
    pro: "performance",
    team: "security",
    "structure-monitor": "security",
    "performance-spectrum": "performance",
    "update-radar": "analytics",
    "risk-score-engine": "security",
    "ai-activity-detector": "ai-governance"
  };
  const normalized = aliases[id] || id;
  return [
    "devops",
    "security",
    "performance",
    "ai-governance",
    "analytics",
    "oem-platform"
  ].includes(normalized) ? normalized : "";
}

function normalizeCorePlanId(plan) {
  const id = String(plan || "").trim().toLowerCase();
  return ["starter", "professional", "enterprise"].includes(id) ? id : "";
}

function normalizeModuleId(plan) {
  return normalizePlanId(plan);
}

function normalizeAddonId(plan) {
  const id = String(plan || "").trim().toLowerCase();
  return ["dev-mode-pro", "extended-retention", "team-seats", "exports-api"].includes(id) ? id : "";
}

function normalizeBillingItemId(plan) {
  return normalizeCorePlanId(plan) || normalizeModuleId(plan) || normalizeAddonId(plan);
}

function readablePlanName(plan) {
  return ({
    devops: "DevOps",
    security: "Security",
    performance: "Performance",
    "ai-governance": "AI Governance",
    analytics: "Analytics",
    "oem-platform": "OEM / Platform"
  })[normalizePlanId(plan)] || "No package selected";
}

function readableBillingName(plan) {
  return ({
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
    "dev-mode-pro": "Dev Mode Pro",
    "extended-retention": "Extended Retention",
    "team-seats": "Team Seats",
    "exports-api": "Exports + API Access"
  })[normalizeBillingItemId(plan)] || readablePlanName(plan);
}

function applyLocalDemoEntitlement(itemId) {
  const item = normalizeBillingItemId(itemId);
  const entitlements = entitlementState || { plan: "starter", modules: [], addons: [], status: "demo", limits: {} };
  if (normalizeCorePlanId(item)) entitlements.plan = item;
  if (normalizeModuleId(item)) entitlements.modules = [...new Set([...(entitlements.modules || []), item])];
  if (normalizeAddonId(item)) entitlements.addons = [...new Set([...(entitlements.addons || []), item])];
  if (item === "enterprise") {
    entitlements.modules = PACKAGE_DEFINITIONS.map(definition => definition.id);
    entitlements.addons = [...new Set([...(entitlements.addons || []), "dev-mode-pro", "extended-retention", "team-seats", "exports-api"])];
  }
  if (item === "professional") {
    entitlements.modules = [...new Set([...(entitlements.modules || []), "devops", "performance", "analytics"])];
    entitlements.addons = [...new Set([...(entitlements.addons || []), "exports-api"])];
  }
  if (item === "starter") entitlements.modules = [...new Set([...(entitlements.modules || []), "devops", "analytics"])];
  entitlements.status = "demo";
  entitlements.source = "local_demo";
  entitlementState = entitlements;
  accountState.entitlements = entitlements;
  accountState.plan = entitlements.plan || accountState.plan || "starter";
}

function applyViewMode(mode) {
  if (mode === "dev" && !hasDevModeAccess()) {
    viewMode = "normal";
    localStorage.setItem("runtimeDiagnosticsViewMode", viewMode);
    setPlanStatus("Dev Mode Pro is a paid add-on. Unlock it to access raw ledgers, SIG9 internals, signatures, and developer exports.", "error");
    applyAppView(accountState.email ? "plans" : "sign-in");
  } else {
    viewMode = mode === "dev" ? "dev" : "normal";
    localStorage.setItem("runtimeDiagnosticsViewMode", viewMode);
  }
  document.body.classList.toggle("dev-mode", viewMode === "dev");
  document.body.classList.toggle("normal-mode", viewMode !== "dev");
  elements.normalMode?.classList.toggle("active", viewMode !== "dev");
  elements.devMode?.classList.toggle("active", viewMode === "dev");
  elements.normalMode?.setAttribute("aria-pressed", String(viewMode !== "dev"));
  elements.devMode?.setAttribute("aria-pressed", String(viewMode === "dev"));
  if (elements.dashboardModeLabel) elements.dashboardModeLabel.textContent = viewMode === "dev" ? "Dev" : "Normal";
}

function hasDevModeAccess() {
  const entitlements = entitlementState || accountState.entitlements || {};
  return entitlements.plan === "enterprise" || (entitlements.addons || []).includes("dev-mode-pro");
}

function applyAuthMode(mode) {
  authMode = mode === "sign-up" ? "sign-up" : "sign-in";
  localStorage.setItem("runtimeDiagnosticsAuthMode", authMode);
  document.body.classList.toggle("auth-sign-up-mode", authMode === "sign-up");
  elements.authSignIn?.classList.toggle("active", authMode === "sign-in");
  elements.authSignUp?.classList.toggle("active", authMode === "sign-up");
  elements.authSignIn?.classList.toggle("secondary", authMode !== "sign-in");
  elements.authSignUp?.classList.toggle("secondary", authMode !== "sign-up");
  elements.authSignIn?.setAttribute("aria-selected", String(authMode === "sign-in"));
  elements.authSignUp?.setAttribute("aria-selected", String(authMode === "sign-up"));
  elements.authTitle.textContent = authMode === "sign-up"
    ? languageText("authTitleSignUp", "Create your workspace")
    : languageText("authTitleSignIn", "Sign in to your workspace");
  elements.authCopy.textContent = authMode === "sign-up"
    ? languageText("authCopySignUp", "Create a workspace session, then connect Authorize.Net hosted checkout when you deploy.")
    : languageText("authCopySignIn", "Sign in first. The live website data dashboard stays locked until a workspace session is active.");
  elements.loginButton.textContent = authMode === "sign-up" ? languageText("loginSignUp", "Create account") : languageText("loginSignIn", "Sign in");
  elements.accountPassword?.setAttribute("autocomplete", authMode === "sign-up" ? "new-password" : "current-password");
}

function applyAppView(view) {
  const requested = view === "plans" ? "plans" : view === "modules" ? "modules" : view === "rankings" ? "rankings" : view === "docs" ? "docs" : view === "sign-in" ? "sign-in" : view === "home" ? "home" : "dashboard";
  appView = (requested === "dashboard" || requested === "modules") && !accountState.email ? "sign-in" : requested;
  localStorage.setItem("runtimeDiagnosticsAppView", appView);
  elements.homeView?.classList.toggle("active", appView === "home");
  elements.docsView?.classList.toggle("active", appView === "docs");
  elements.signInView?.classList.toggle("active", appView === "sign-in");
  elements.plansView?.classList.toggle("active", appView === "plans");
  elements.modulesView?.classList.toggle("active", appView === "modules");
  elements.rankingsView?.classList.toggle("active", appView === "rankings");
  elements.dashboardView?.classList.toggle("active", appView === "dashboard");
  elements.navHome?.classList.toggle("active", appView === "home");
  elements.navDocs?.classList.toggle("active", appView === "docs");
  elements.navDashboard?.classList.toggle("active", appView === "dashboard");
  elements.navModules?.classList.toggle("active", appView === "modules");
  elements.navRankings?.classList.toggle("active", appView === "rankings");
  elements.navPlans?.classList.toggle("active", appView === "plans");
  elements.navSignIn?.classList.toggle("active", appView === "sign-in");
  elements.navHome?.setAttribute("aria-current", appView === "home" ? "page" : "false");
  elements.navDocs?.setAttribute("aria-current", appView === "docs" ? "page" : "false");
  elements.navDashboard?.setAttribute("aria-current", appView === "dashboard" ? "page" : "false");
  elements.navModules?.setAttribute("aria-current", appView === "modules" ? "page" : "false");
  elements.navRankings?.setAttribute("aria-current", appView === "rankings" ? "page" : "false");
  elements.navPlans?.setAttribute("aria-current", appView === "plans" ? "page" : "false");
  elements.navSignIn?.setAttribute("aria-current", appView === "sign-in" ? "page" : "false");
  if (appView === "sign-in") {
    elements.navHome?.classList.remove("active");
    elements.navDocs?.classList.remove("active");
    elements.navDashboard?.classList.remove("active");
    elements.navModules?.classList.remove("active");
    elements.navRankings?.classList.remove("active");
    elements.navPlans?.classList.remove("active");
    elements.navHome?.setAttribute("aria-current", "false");
    elements.navDocs?.setAttribute("aria-current", "false");
    elements.navDashboard?.setAttribute("aria-current", "false");
    elements.navModules?.setAttribute("aria-current", "false");
    elements.navRankings?.setAttribute("aria-current", "false");
    elements.navPlans?.setAttribute("aria-current", "false");
  }
  if (appView === "dashboard" && !snapshot) renderEmptyRuntimeDashboard();
  if (appView === "modules") renderModulePages(snapshot || buildSnapshot({}));
  if (appView === "rankings") renderRankings();
}

function renderEmptyRuntimeDashboard() {
  snapshot = buildSnapshot({});
  renderSummary(snapshot);
  renderPlainEnglishSummary(snapshot);
  renderChannels(snapshot);
  renderTechnologyProfile(snapshot);
  renderStructuralPipeline(snapshot);
  renderOrganPresentation(snapshot);
  renderFrequencySpectrum(snapshot);
  renderCommercialPackageSuite(snapshot);
  renderModulePages(snapshot);
  renderStructureEngine(snapshot);
  renderFacts();
}

async function loadFrequencySettings() {
  const fallback = localStorage.getItem("runtimeDiagnosticsFrequencyWindowMs") || "100";
  if (!hasExtensionRuntime) {
    elements.frequencyWindow.value = normalizeFrequencyWindow(fallback);
    return;
  }
  const { runtimeDiagnosticsSettings } = await chrome.storage.sync.get("runtimeDiagnosticsSettings");
  elements.frequencyWindow.value = normalizeFrequencyWindow(runtimeDiagnosticsSettings?.frequencyWindowMs || fallback);
}

async function saveFrequencySettings() {
  const frequencyWindowMs = Number(normalizeFrequencyWindow(elements.frequencyWindow.value));
  localStorage.setItem("runtimeDiagnosticsFrequencyWindowMs", String(frequencyWindowMs));
  if (hasExtensionRuntime) {
    const { runtimeDiagnosticsSettings } = await chrome.storage.sync.get("runtimeDiagnosticsSettings");
    await chrome.storage.sync.set({ runtimeDiagnosticsSettings: { enabled: diagnosticsEnabled, notifyHighSeverity: true, ...(runtimeDiagnosticsSettings || {}), frequencyWindowMs } });
  }
  if (snapshot) {
    snapshot.organFrequencySpectrum = buildFrequencySpectrumFromFacts(snapshot.facts);
    renderFrequencySpectrum(snapshot);
    renderCommercialPackageSuite(snapshot);
    renderPlainEnglishSummary(snapshot);
  }
}

function normalizeFrequencyWindow(value) {
  const allowed = ["100", "250", "1000", "5000"];
  const text = String(value || "100");
  return allowed.includes(text) ? text : "100";
}

function loadStandaloneTarget() {
  const savedTarget = localStorage.getItem("runtimeDiagnosticsStandaloneTarget") || "";
  const initialTarget = standaloneState.lastUrl || savedTarget || "";
  elements.portalUrl.value = isOwnStandaloneAppUrl(initialTarget) ? "" : initialTarget;
  if (initialTarget && !elements.portalUrl.value) localStorage.removeItem("runtimeDiagnosticsStandaloneTarget");
  setPortalHelp(accountState.email
    ? "Runtime diagnostics analyzes only the URL typed here. It runs every second through the secure browser collector bridge and never analyzes this diagnostics page."
    : "Sign in to start live website analysis. Runtime Diagnostics will not monitor targets while the workspace is locked.");
  if (elements.portalUrl.value && canRunStandaloneDiagnostics()) analyzeStandaloneUrl();
}

async function toggleStandaloneDiagnostics() {
  standaloneState.enabled = !standaloneState.enabled;
  elements.toggleDiagnostics.textContent = standaloneState.enabled ? "Live on" : "Live off";
  elements.toggleDiagnostics.classList.toggle("danger", !standaloneState.enabled);
  elements.toggleDiagnostics.setAttribute("aria-pressed", String(standaloneState.enabled));
  if (!accountState.email && standaloneState.enabled) {
    setPortalHelp("Runtime Diagnostics is ready, but live website analysis starts only after sign-in.");
    return;
  }
  setPortalHelp(standaloneState.enabled ? "Live analysis enabled. The target URL is sampled every second." : "Live analysis paused.");
  maybeResumeStandaloneDiagnostics();
}

async function refreshStandalone() {
  if (elements.portalUrl.value.trim()) return analyzeStandaloneUrl();
  if (standaloneState.lastResult) renderStandaloneResult(standaloneState.lastResult);
}

async function analyzeStandaloneUrl(options = {}) {
  if (!canRunStandaloneDiagnostics() && !options.ignoreAuth) {
    if (!options.quiet) applyAppView("sign-in");
    return setStandaloneTargetStatus("Workspace locked", "Sign in to start live website analysis.", "warning");
  }
  if (!standaloneState.enabled && !options.force) return;
  const value = elements.portalUrl.value.trim();
  if (!value) return setStandaloneTargetStatus("No target URL", "Enter the website URL Runtime Diagnostics should analyze.", "warning");
  const validation = validateStandaloneTarget(value);
  if (!validation.ok) return setStandaloneTargetStatus("Target rejected", validation.message, "warning");
  if (isOwnStandaloneAppUrl(value)) return setStandaloneTargetStatus("Target rejected", "Runtime Diagnostics will not analyze the Ticket Sniper UI itself. Enter the external website you want to monitor.", "warning");
  if (standaloneState.inFlight && !options.force) {
    standaloneState.pending = true;
    return;
  }
  standaloneState.controller?.abort();
  standaloneState.controller = new AbortController();
  const requestId = ++standaloneState.requestId;
  standaloneState.inFlight = true;
  standaloneState.pending = false;
  try {
    localStorage.setItem("runtimeDiagnosticsStandaloneTarget", validation.url);
    if (!options.quiet) setPortalHelp(`Analyzing ${validation.url} every second through the runtime collector bridge...`);
    const response = await fetch(`/api/runtime-browser/analyze?url=${encodeURIComponent(validation.url)}`, { signal: standaloneState.controller.signal });
    const result = await readJsonResponse(response);
    if (!response.ok || !result.ok) throw new Error(result.error || `Analysis failed with HTTP ${response.status}`);
    if (requestId !== standaloneState.requestId || normalizeUrlForComparison(elements.portalUrl.value.trim()) !== validation.url) return;
    standaloneState.lastUrl = validation.url || result.finalUrl || "";
    standaloneState.lastResult = result;
    saveStandaloneSummary(result);
    renderStandaloneResult(result);
  } catch (error) {
    if (error.name !== "AbortError") {
      setPortalHelp(describeStandaloneAnalyzeError(error, validation.url));
      const closedBrowser = isRuntimeBrowserClosedError(error);
      elements.latestHost.textContent = closedBrowser ? "Runtime browser relaunching" : "Runtime bridge unavailable";
      elements.latestTime.textContent = closedBrowser
        ? "The target browser window was closed. The next sample will reopen it automatically."
        : "No runtime facts received from the target.";
      if (closedBrowser && canRunStandaloneDiagnostics()) {
        clearTimeout(standaloneState.reconnectTimer);
        standaloneState.reconnectTimer = setTimeout(() => {
          if (canRunStandaloneDiagnostics() && isValidStandaloneTarget(elements.portalUrl.value.trim())) analyzeStandaloneUrl({ quiet: true, force: true });
        }, 1200);
      }
    }
  } finally {
    if (requestId === standaloneState.requestId) {
      standaloneState.inFlight = false;
      standaloneState.controller = null;
      if (standaloneState.pending && canRunStandaloneDiagnostics()) analyzeStandaloneUrl({ quiet: true });
    }
  }
}

function canRunStandaloneDiagnostics() {
  return Boolean(accountState.email) && standaloneState.enabled;
}

function maybeResumeStandaloneDiagnostics() {
  if (!hasExtensionRuntime && canRunStandaloneDiagnostics() && isValidStandaloneTarget(elements.portalUrl.value.trim())) {
    analyzeStandaloneUrl({ quiet: true, force: true });
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Runtime analyzer returned a non-JSON response (${response.status}).`);
  }
}

function describeStandaloneAnalyzeError(error, targetUrl) {
  const message = String(error?.message || error || "");
  if (isRuntimeBrowserClosedError(error)) {
    return `The runtime browser window was closed while checking ${targetUrl}. Runtime Diagnostics will relaunch it automatically on the next sample.`;
  }
  if (/failed to fetch|load failed|networkerror/i.test(message)) {
    if (location.protocol === "file:") {
      return "Runtime Diagnostics is open as a file, so the analyzer API cannot be reached. Open it through the local Runtime Diagnostics server instead of directly from disk.";
    }
    return `Runtime Diagnostics could not reach its local analyzer bridge while checking ${targetUrl}. Make sure the standalone server is still running and refresh this page.`;
  }
  if (/browser|executable|playwright|edge|chrom/i.test(message)) {
    return `The runtime browser bridge could not inspect ${targetUrl}. Check that the local browser runtime can launch, then try again. Details: ${message}`;
  }
  return `Runtime analyzer could not inspect ${targetUrl}. ${message}`;
}

function isRuntimeBrowserClosedError(error) {
  return /target page, context or browser has been closed|browser has been closed|context.*closed|page.*closed|target closed|runtime browser.*closed/i.test(String(error?.message || error || ""));
}

function handleStandaloneTargetInput() {
  const value = elements.portalUrl.value.trim();
  localStorage.setItem("runtimeDiagnosticsStandaloneTarget", value);
  standaloneState.requestId += 1;
  standaloneState.controller?.abort();
  standaloneState.inFlight = false;
  standaloneState.pending = false;
  standaloneState.lastResult = null;
  snapshot = buildSnapshot({});
  renderSummary(snapshot);
  renderPlainEnglishSummary(snapshot);
  renderChannels(snapshot);
  renderTechnologyProfile(snapshot);
  renderStructuralPipeline(snapshot);
  renderOrganPresentation(snapshot);
  renderFrequencySpectrum(snapshot);
  renderCommercialPackageSuite(snapshot);
  renderLiveSignalConsole(result.webBloomberg?.terminal || result.diagnostics?.webBloombergTerminal || null);
  renderStructureEngine(snapshot);
  renderFacts();
  elements.latestHost.textContent = value ? "Switching target" : "No portal observed";
  elements.latestTime.textContent = value ? "Waiting for new target sample" : "No runtime facts yet";
  const validation = value ? validateStandaloneTarget(value) : { ok: false, message: "Enter the website URL Runtime Diagnostics should analyze." };
  setPortalHelp(value ? validation.ok ? `Target changed to ${validation.url}. Waiting for a fresh structural sample...` : validation.message : validation.message);
  clearTimeout(standaloneState.inputDebounce);
  standaloneState.inputDebounce = setTimeout(() => {
    if (canRunStandaloneDiagnostics() && isValidStandaloneTarget(elements.portalUrl.value.trim())) analyzeStandaloneUrl({ quiet: true, force: true });
    else if (isOwnStandaloneAppUrl(elements.portalUrl.value.trim())) setPortalHelp("Runtime Diagnostics will not analyze the Ticket Sniper UI itself. Enter an external website URL.");
  }, 450);
}

function isValidStandaloneTarget(value) {
  return validateStandaloneTarget(value).ok;
}

function validateStandaloneTarget(value) {
  if (!value) return { ok: false, message: "Enter the website URL Runtime Diagnostics should analyze." };
  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, message: "Enter a complete HTTP or HTTPS URL, for example https://www.roblox.com/." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, message: "Runtime Diagnostics supports HTTP and HTTPS websites only." };
  }
  if (isOwnStandaloneAppUrl(url.href)) {
    return { ok: false, message: "Runtime Diagnostics will not analyze the Ticket Sniper UI itself. Enter an external website URL." };
  }
  return { ok: true, url: url.href };
}

function normalizeUrlForComparison(value) {
  try {
    return new URL(value).href;
  } catch {
    return "";
  }
}

function isOwnStandaloneAppUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname === location.hostname && url.port === location.port && [
      "/",
      "/visa-monitor.html",
      "/runtime-diagnostics.html",
      "/options.html"
    ].includes(url.pathname);
  } catch {
    return false;
  }
}

function renderStandaloneResult(result) {
  snapshot = buildSnapshot(result.diagnostics || {});
  upsertRankingSampleFromResult(result, snapshot, "live-analysis");
  renderSummary(snapshot);
  renderPlainEnglishSummary(snapshot);
  renderChannels(snapshot);
  renderTechnologyProfile(snapshot);
  renderStructuralPipeline(snapshot);
  renderOrganPresentation(snapshot);
  renderFrequencySpectrum(snapshot);
  renderCommercialPackageSuite(snapshot);
  renderLiveSignalConsole(null);
  renderStructureEngine(snapshot);
  renderFacts();
  renderRankings();
  elements.latestHost.textContent = result.diagnostics?.runtimeFactStatus?.host || result.finalUrl || "Standalone target";
  elements.latestTime.textContent = `Analyzed ${new Date(result.analyzedAt || Date.now()).toLocaleString()}`;
  setPortalHelp(`Analyzing ${result.finalUrl || result.requestedUrl || "target"} every second through the runtime collector bridge.`);
}

function setStandaloneTargetStatus(title, detail, state = "") {
  elements.latestHost.textContent = title;
  elements.latestTime.textContent = detail;
  elements.streamState.dataset.state = state;
  setPortalHelp(detail);
}

async function exportStandaloneJson() {
  try {
    const response = await fetch("/api/runtime-diagnostics/export");
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || `Export failed with HTTP ${response.status}`);
    payload.rawFactMapping = snapshot ? buildFactMappingDebugReport(snapshot) : null;
    downloadJson(payload, "standalone-runtime-diagnostics");
    setExportStatus("Standalone diagnostics JSON exported from backend memory.", "success");
  } catch (error) {
    setExportStatus(`Export failed: ${error.message || String(error)}`, "error");
  }
}

async function clearStandaloneDiagnostics() {
  await fetch("/api/runtime-diagnostics/clear", { method: "POST" }).catch(() => null);
  localStorage.removeItem("runtimeDiagnosticsStandaloneSummary");
  standaloneState.lastResult = null;
  snapshot = buildSnapshot({});
  renderSummary(snapshot);
  renderPlainEnglishSummary(snapshot);
  renderChannels(snapshot);
  renderTechnologyProfile(snapshot);
  renderStructuralPipeline(snapshot);
  renderOrganPresentation(snapshot);
  renderFrequencySpectrum(snapshot);
  renderCommercialPackageSuite(snapshot);
  renderStructureEngine(snapshot);
  renderFacts();
  setPortalHelp("Standalone diagnostics cleared.");
}

function saveStandaloneSummary(result) {
  const summary = {
    analyzedAt: result.analyzedAt,
    requestedUrl: result.requestedUrl,
    finalUrl: result.finalUrl,
    status: result.status ? {
      state: result.status.state,
      severity: result.status.severity,
      host: result.status.host,
      channel: result.status.channel
    } : null,
    factCount: Object.values(result.diagnostics?.runtimeFactChannels || {}).reduce((sum, items) => sum + (items?.length || 0), 0),
    channelCount: Object.keys(result.diagnostics?.runtimeFactChannels || {}).length
  };
  safeLocalSet("runtimeDiagnosticsStandaloneSummary", summary);
}

function connectStandaloneDiagnosticsStream() {
  if (hasExtensionRuntime || typeof EventSource === "undefined" || standaloneState.stream) return;
  setStreamState("Connecting live fact stream...", "connecting");
  standaloneState.stream = new EventSource("/api/runtime-diagnostics/stream");
  standaloneState.stream.onopen = () => setStreamState("Live fact stream connected", "connected");
  standaloneState.stream.addEventListener("ready", event => {
    const payload = safeJson(event.data, {});
    if (canRenderStandaloneStreamResult(payload.latest)) renderStandaloneResult(payload.latest);
  });
  standaloneState.stream.addEventListener("diagnostics", event => {
    const payload = safeJson(event.data, {});
    if (payload.kind === "runtime-diagnostics-cleared") {
      snapshot = buildSnapshot({});
      renderSummary(snapshot);
      renderPlainEnglishSummary(snapshot);
      renderChannels(snapshot);
      renderTechnologyProfile(snapshot);
      renderStructuralPipeline(snapshot);
      renderOrganPresentation(snapshot);
      renderFrequencySpectrum(snapshot);
      renderCommercialPackageSuite(snapshot);
      renderLiveSignalConsole(null);
      renderStructureEngine(snapshot);
      renderFacts();
      return;
    }
    if (payload.kind === "web-bloomberg-update") {
      renderLiveSignalConsole(payload.terminal || null);
      return;
    }
    if (canRenderStandaloneStreamResult(payload.result)) {
      standaloneState.lastResult = payload.result;
      renderStandaloneResult(payload.result);
    }
  });
  standaloneState.stream.onerror = () => {
    setStreamState("Live fact stream reconnecting...", "reconnecting");
    standaloneState.stream?.close();
    standaloneState.stream = null;
    clearTimeout(standaloneState.reconnectTimer);
    standaloneState.reconnectTimer = setTimeout(connectStandaloneDiagnosticsStream, 2000);
  };
}

function setStreamState(message, state = "") {
  if (!elements.streamState) return;
  elements.streamState.textContent = message;
  elements.streamState.dataset.state = state;
}

async function loadOperationalStatus() {
  if (hasExtensionRuntime || !elements.systemHealth) return;
  try {
    const response = await fetch("/api/health");
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || `Health check failed with HTTP ${response.status}`);
    const health = payload.health || "unknown";
    const runtime = payload.runtimeDiagnostics || {};
    const billing = payload.billing || {};
    const warnings = payload.warnings || [];
    const parts = [
      `System ${health}`,
      `${runtime.historyCount || 0} samples`,
      `${runtime.streamClients || 0} live stream${runtime.streamClients === 1 ? "" : "s"}`,
      billing.configured ? "billing connected" : "demo billing"
    ];
    elements.systemHealth.textContent = parts.join(" - ");
    elements.systemHealth.dataset.state = health === "healthy" ? "connected" : warnings.length ? "warning" : "";
    elements.systemHealth.title = warnings.join("\n") || "All local Runtime Diagnostics systems are responding.";
  } catch (error) {
    elements.systemHealth.textContent = "Analyzer bridge offline";
    elements.systemHealth.dataset.state = "reconnecting";
    elements.systemHealth.title = `${error.message || String(error)}. Start the local Runtime Diagnostics server and refresh this page.`;
  }
}

function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage is only for small UI state; backend memory keeps full diagnostics.
  }
}

function safeJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function shouldRenderStandaloneStreamResult(result) {
  const current = elements.portalUrl.value.trim();
  if (!current) return true;
  const currentNormalized = normalizeUrlForComparison(current);
  const resultUrl = normalizeUrlForComparison(result?.finalUrl || result?.requestedUrl || "");
  if (!currentNormalized || !resultUrl) return false;
  try {
    const currentUrl = new URL(currentNormalized);
    const analyzedUrl = new URL(resultUrl);
    return currentUrl.origin === analyzedUrl.origin && currentUrl.pathname === analyzedUrl.pathname;
  } catch {
    return false;
  }
}

function canRenderStandaloneStreamResult(result) {
  return Boolean(accountState.email && result && shouldRenderStandaloneStreamResult(result));
}

async function diagnosticsTick() {
  await captureRuntimeTarget();
  await refresh();
}

async function refresh() {
  if (!hasExtensionRuntime) return refreshStandalone();
  if (refreshInFlight) {
    refreshAgain = true;
    return;
  }
  refreshInFlight = true;
  refreshAgain = false;
  try {
  const [{ runtimeDiagnosticsSettings }, data] = await Promise.all([
    chrome.storage.sync.get("runtimeDiagnosticsSettings"),
    chrome.storage.local.get([
      "runtimeFactChannels",
      "runtimeFactHistory",
      "runtimeFactStatus",
      "crawlerSignalHistory",
      "crawlerSignalStatus",
      "structuralMonitorStatus",
      "structuralPipelineState",
      "structuralPipelineLatest",
      "normalizedFactHistory",
      "structuralEventHistory",
      "featureVectorHistory",
      "scoreResultHistory",
      "updateClassificationHistory",
      "organPipelineState",
      "organPipelineLatest",
      "organAssignmentHistory",
      "organRenderBlockHistory",
      "organPipelineErrorHistory",
      "organFrequencySpectrumState",
      "organFrequencySpectrumLatest"
    ])
  ]);
  diagnosticsEnabled = runtimeDiagnosticsSettings?.enabled !== false;
  renderDiagnosticsToggle();
  snapshot = buildSnapshot(data);
  renderSummary(snapshot);
  renderPlainEnglishSummary(snapshot);
  renderChannels(snapshot);
  renderTechnologyProfile(snapshot);
  renderStructuralPipeline(snapshot);
  renderOrganPresentation(snapshot);
  renderFrequencySpectrum(snapshot);
  renderCommercialPackageSuite(snapshot);
  renderStructureEngine(snapshot);
  renderFacts();
  } finally {
    refreshInFlight = false;
    if (refreshAgain) refresh();
  }
}

async function toggleDiagnostics() {
  if (!hasExtensionRuntime) return toggleStandaloneDiagnostics();
  diagnosticsEnabled = !diagnosticsEnabled;
  await chrome.storage.sync.set({ runtimeDiagnosticsSettings: { enabled: diagnosticsEnabled, notifyHighSeverity: true } });
  renderDiagnosticsToggle();
  setPortalHelp(diagnosticsEnabled ? "Diagnostics enabled. Reload existing website tabs to attach collectors if they were opened while diagnostics was off." : "Diagnostics disabled. Existing collectors will stop on the next settings update.");
}

function renderDiagnosticsToggle() {
  elements.toggleDiagnostics.textContent = diagnosticsEnabled ? "Live on" : "Live off";
  elements.toggleDiagnostics.classList.toggle("danger", !diagnosticsEnabled);
  elements.toggleDiagnostics.setAttribute("aria-pressed", String(diagnosticsEnabled));
}

function buildSnapshot(data) {
  const runtimeFactChannels = data.runtimeFactChannels || {};
  const facts = Object.entries(runtimeFactChannels).flatMap(([channel, items]) => (items || []).map(fact => ({ channel, fact })));
  const crawlerFacts = [
    ...(data.crawlerSignalHistory || []).map(status => ({ channel: `crawler/${status.fact?.type || "signal"}`, fact: status.fact, status })),
    ...(data.crawlerSignalStatus?.fact ? [{ channel: `crawler/${data.crawlerSignalStatus.fact.type || "signal"}`, fact: data.crawlerSignalStatus.fact, status: data.crawlerSignalStatus }] : [])
  ].filter(item => item.fact);
  const all = [...facts, ...crawlerFacts]
    .map(item => ({ ...item, severity: factSeverity(item.fact), time: Number(item.fact.timestamp) || 0 }))
    .sort((left, right) => right.time - left.time);
  const runtimeEventSummary = summarizeRuntimeEvents(all);
  const latest = data.runtimeFactStatus || data.crawlerSignalStatus || data.structuralMonitorStatus || null;
  const pipeline = {
    state: data.structuralPipelineState || null,
    latest: data.structuralPipelineLatest || null,
    normalizedFacts: data.normalizedFactHistory || [],
    events: data.structuralEventHistory || [],
    features: data.featureVectorHistory || [],
    scores: data.scoreResultHistory || [],
    classifications: data.updateClassificationHistory || []
  };
  const organPipeline = {
    state: data.organPipelineState || null,
    latest: data.organPipelineLatest || null,
    assignments: data.organAssignmentHistory || [],
    renderBlocks: data.organRenderBlockHistory || [],
    errors: data.organPipelineErrorHistory || []
  };
  const organFrequencySpectrum = {
    state: data.organFrequencySpectrumState || null,
    latest: data.organFrequencySpectrumLatest || null
  };
  if (!organFrequencySpectrum.state && all.length) organFrequencySpectrum.state = buildFrequencySpectrumFromFacts(all);
  return { data, channels: runtimeFactChannels, facts: all, latest, pipeline, organPipeline, organFrequencySpectrum, runtimeEventSummary, layerCoverage: normalizeLayerCoverage(data.runtimeLayerCoverage, all) };
}

function summarizeRuntimeEvents(items = []) {
  const byCategory = Object.fromEntries(RUNTIME_EVENT_CATEGORIES.map(category => [category.name, { ...category, count: 0, latest: 0, channels: new Set(), rawFacts: new Map(), subcategories: new Map() }]));
  const mappedFacts = [];
  const unmappedFacts = [];
  for (const item of items) {
    const mapping = mapRawRuntimeFact(item);
    mappedFacts.push(mapping);
    if (mapping.status !== "mapped") unmappedFacts.push(mapping);
    for (const category of mapping.categories) {
      if (!byCategory[category]) continue;
      byCategory[category].count += 1;
      byCategory[category].latest = Math.max(byCategory[category].latest, Number(item.time || item.fact?.timestamp) || 0);
      if (item.channel) byCategory[category].channels.add(item.channel);
      const existing = byCategory[category].rawFacts.get(mapping.key) || {
        key: mapping.key,
        channel: mapping.channel,
        source: mapping.source,
        type: mapping.type,
        sourceModule: mapping.sourceModule,
        organs: mapping.organs,
        status: mapping.status,
        reason: mapping.reason,
        confidence: mapping.confidence,
        count: 0,
        latest: 0
      };
      existing.count += 1;
      existing.latest = Math.max(existing.latest, Number(item.time || item.fact?.timestamp) || 0);
      byCategory[category].rawFacts.set(mapping.key, existing);
      const subcategoryName = runtimeFactSubcategory(mapping);
      const subcategory = byCategory[category].subcategories.get(subcategoryName) || {
        name: subcategoryName,
        count: 0,
        latest: 0,
        channels: new Set(),
        rawFacts: new Map()
      };
      subcategory.count += 1;
      subcategory.latest = Math.max(subcategory.latest, Number(item.time || item.fact?.timestamp) || 0);
      if (item.channel) subcategory.channels.add(item.channel);
      const subFact = subcategory.rawFacts.get(mapping.key) || {
        key: mapping.key,
        channel: mapping.channel,
        source: mapping.source,
        type: mapping.type,
        status: mapping.status,
        count: 0,
        latest: 0
      };
      subFact.count += 1;
      subFact.latest = Math.max(subFact.latest, Number(item.time || item.fact?.timestamp) || 0);
      subcategory.rawFacts.set(mapping.key, subFact);
      byCategory[category].subcategories.set(subcategoryName, subcategory);
    }
  }
  const categories = Object.values(byCategory).map(category => ({
    ...category,
    channels: [...category.channels].slice(0, 8),
    subcategories: [...category.subcategories.values()]
      .map(subcategory => ({
        name: subcategory.name,
        count: subcategory.count,
        latest: subcategory.latest,
        channels: [...subcategory.channels].slice(0, 6)
      }))
      .sort((left, right) => right.count - left.count || right.latest - left.latest),
    rawFacts: [...category.rawFacts.values()]
      .sort((left, right) => right.count - left.count || right.latest - left.latest)
      .slice(0, 8)
  }));
  return {
    registryVersion: RAW_FACT_MAPPING_REGISTRY_VERSION,
    categories,
    activeCount: categories.filter(category => category.count > 0).length,
    totalFacts: items.length,
    mappedFacts,
    unmappedFacts,
    sourceTypeCoverage: summarizeRawFactCoverage(mappedFacts)
  };
}

function runtimeFactSubcategory(mapping = {}) {
  if (mapping.sourceModule) return mapping.sourceModule;
  const source = String(mapping.source || "").toLowerCase();
  if (source === "dom") return "DOM";
  if (source === "layout") return "Layout";
  if (source === "cssom") return "CSSOM";
  if (source === "vdom") return "Virtual DOM";
  if (source === "a11y" || source === "accessibility") return "Accessibility";
  if (source === "runtime" || source === "performance") return "JS Runtime";
  if (source === "shadow") return "Shadow DOM";
  if (source === "multicontext") return "Frames / Workers";
  if (source === "network") return "Network";
  if (source === "storage") return "Storage";
  if (source === "anti_crawler" || source === "crawler") return "Security / Crawler";
  if (source === "browser") return "Rendered Browser";
  if (source === "web_bloomberg") return "Signal Windows";
  return source ? readableChannel(source) : "Unknown";
}

function runtimeEventCategoriesForFact(item = {}) {
  const mapping = mapRawRuntimeFact(item);
  return mapping.categories;
}

function mapRawRuntimeFact(item = {}) {
  const fact = item.fact || item;
  const source = String(fact.source || "").toLowerCase();
  const type = String(fact.type || "").toLowerCase();
  const channel = String(item.channel || fact.channel || `${source}/${type}`).toLowerCase();
  const normalizedType = normalizeRawFactType(type);
  const key = `${source}/${normalizedType}`;
  const registryEntry = RAW_FACT_MAPPING_BY_KEY[key] || RAW_FACT_MAPPING_BY_KEY[normalizedType] || RAW_FACT_MAPPING_BY_KEY[channel];
  if (registryEntry) {
    return {
      registryVersion: RAW_FACT_MAPPING_REGISTRY_VERSION,
      status: "mapped",
      key,
      channel,
      source,
      type: normalizedType,
      categories: registryEntry.categories,
      organs: registryEntry.organs,
      sourceModule: registryEntry.sourceModule,
      screenshotModuleLayer: registryEntry.screenshotModuleLayer,
      confidence: registryEntry.confidence,
      reason: registryEntry.reason
    };
  }
  const fallback = fallbackRuntimeFactCategories(item);
  return {
    registryVersion: RAW_FACT_MAPPING_REGISTRY_VERSION,
    status: "unmapped",
    key,
    channel,
    source,
    type: normalizedType,
    categories: fallback.categories,
    organs: fallback.organs,
    sourceModule: source || "unknown",
    screenshotModuleLayer: "Unmapped Recent Facts fallback",
    confidence: fallback.confidence,
    reason: fallback.reason
  };
}

function fallbackRuntimeFactCategories(item = {}) {
  const fact = item.fact || item;
  const source = String(fact.source || "").toLowerCase();
  const type = String(fact.type || "").toLowerCase();
  const channel = String(item.channel || fact.channel || `${source}/${type}`).toLowerCase();
  const payloadText = `${source} ${type} ${channel} ${JSON.stringify(fact.value || {})} ${JSON.stringify(fact.metadata || {})}`.toLowerCase();
  const categories = new Set();
  if (/interaction|click|input|pointer|mouse|keyboard|focus|blur|submit|touch|gesture|event-listener/.test(payloadText)) categories.add("Interaction");
  if (/dom|layout|cssom|style|paint|render|shadow|vdom|accessibility|a11y|aria|slot|component|presentation/.test(payloadText)) categories.add("Presentation");
  if (/network|fetch|xhr|websocket|ws|sendbeacon|iframe|frame|post_message|messagechannel|channel|request|response|communication/.test(payloadText)) categories.add("Communication");
  if (/timer|interval|timeout|raf|animationframe|microtask|promise|scheduler|lifecycle|navigation|visibility|sync|heartbeat/.test(payloadText)) categories.add("Synchronization");
  if (/storage|cookie|indexeddb|cache|session|localstorage|persistence|history-state/.test(payloadText)) categories.add("Persistence");
  if (/runtime|javascript|script|worker|console|error|rejection|long.?task|task|execution|framework|vue|react|svelte/.test(payloadText)) categories.add("Execution");
  if (/security|captcha|challenge|bot|protection|cloudflare|akamai|perimeterx|datadome|imperva|auth|policy|risk/.test(payloadText)) categories.add("Security");
  if (/resource|asset|image|stylesheet|font|cdn|service-worker|sw_fetch|supply|script-src|preload/.test(payloadText)) categories.add("Resources");
  if (/compute|wasm|webassembly|webgpu|gpu|ai|inference|embedding|model|tensor|ml/.test(payloadText)) categories.add("Compute");
  if (!categories.size) categories.add("Execution");
  return {
    categories: [...categories],
    organs: [inferFallbackOrgan(source, type)],
    confidence: 0.42,
    reason: "No canonical registry entry matched this source/type; regex fallback kept it visible for debugging."
  };
}

function rawFactEntry(source, types, categories, sourceModule, reason, confidence = 0.85) {
  const sourceKey = String(source || "").toLowerCase();
  const cleanCategories = uniqueRuntimeNames(categories, RUNTIME_EVENT_CATEGORIES.map(category => category.name));
  const entries = [];
  for (const rawType of types) {
    const type = normalizeRawFactType(rawType);
    const organs = RAW_FACT_TO_SIG9_ORGAN[type] || [inferFallbackOrgan(sourceKey, type)];
    entries.push({
      key: `${sourceKey}/${type}`,
      source: sourceKey,
      type,
      aliases: [type, `${sourceKey}/${type}`],
      categories: cleanCategories,
      organs,
      sourceModule,
      screenshotModuleLayer: `${sourceModule} raw fact layer`,
      confidence,
      reason
    });
  }
  return entries;
}

function buildRawFactMappingIndex(groups) {
  const index = {};
  for (const group of groups.flat()) {
    index[group.key] = group;
    for (const alias of group.aliases || []) index[String(alias).toLowerCase()] = group;
  }
  return index;
}

function normalizeRawFactType(value) {
  return String(value || "fact").trim().toLowerCase().replace(/-/g, "_");
}

function uniqueRuntimeNames(values, allowed) {
  const allowedSet = new Set(allowed);
  return [...new Set(values)].filter(value => allowedSet.has(value));
}

function inferFallbackOrgan(source, type) {
  const text = `${source}/${type}`;
  if (/network|fetch|xhr|websocket|request|response|flow/.test(text)) return "Flow";
  if (/resource|supply|cdn|script|image|stylesheet/.test(text)) return "Supply";
  if (/a11y|cascade|specificity|selector|layout_shift|break|conflict/.test(text)) return "Value";
  if (/behavior|event|click|pointer|input|post_message|change/.test(text)) return "Behavior";
  if (/navigation|lifecycle|storage|worker|service|sw_|reload|error|rejection/.test(text)) return "Lifecycle";
  if (/dom|shadow|topology|layout_tree|layout_dependency|structure|iframe/.test(text)) return "Topology";
  if (/dependency|message_channel|promise|vdom/.test(text)) return "Dependency";
  if (/rhythm|microtask|animation|transition|reflow|recalc|frame|tick/.test(text)) return "Rhythm";
  return "Energy";
}

function summarizeRawFactCoverage(mappings = []) {
  const byKey = new Map();
  for (const mapping of mappings) {
    const current = byKey.get(mapping.key) || { key: mapping.key, channel: mapping.channel, status: mapping.status, categories: mapping.categories, organs: mapping.organs, count: 0 };
    current.count += 1;
    current.status = current.status === "mapped" ? mapping.status : current.status;
    byKey.set(mapping.key, current);
  }
  return [...byKey.values()].sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function runtimeEventCount(model, names = []) {
  const summary = model.runtimeEventSummary || summarizeRuntimeEvents(model.facts || []);
  const lookup = Object.fromEntries(summary.categories.map(category => [category.name, category]));
  return names.reduce((sum, name) => sum + (lookup[name]?.count || 0), 0);
}

function renderSummary(model) {
  const high = model.facts.filter(item => item.severity === "high").length;
  const medium = model.facts.filter(item => item.severity === "medium").length;
  elements.totalFacts.textContent = String(model.facts.length);
  elements.channelCount.textContent = String(Object.keys(model.channels).length);
  elements.highCount.textContent = String(high);
  elements.mediumCount.textContent = String(medium);
  elements.latestHost.textContent = model.latest?.host || model.facts[0]?.fact?.context?.pageUrl || "No portal observed";
  elements.latestTime.textContent = model.latest?.checkedAt ? `Latest fact ${new Date(model.latest.checkedAt).toLocaleString()}` : "No runtime facts yet";
  renderOperatingStrip(model, { high, medium });
}

function renderPlainEnglishSummary(model) {
  const total = model.facts.length;
  const high = model.facts.filter(item => item.severity === "high").length;
  const medium = model.facts.filter(item => item.severity === "medium").length;
  const channels = Object.keys(model.channels).length;
  const latest = model.facts[0];
  const pressureFacts = model.facts.filter(item => /performance|long-task|layout|frame|resource|network/.test(item.channel)).length;
  const mutationFacts = model.facts.filter(item => /dom|layout|cssom|vdom|shadow/.test(item.channel)).length;
  const spectrum = model.organFrequencySpectrum?.state || model.generatedFrequencySpectrum || buildFrequencySpectrumFromFacts(model.facts);
  const riskScore = spectrum?.products?.websiteRiskScore?.score || 0;
  const aiScore = spectrum?.products?.aiActivityDetection?.score || 0;
  const health = high ? "Needs attention" : medium ? "Watch closely" : total ? "Stable enough" : "Waiting for data";
  elements.plainHealth.textContent = health;
  elements.plainHealthDetail.textContent = total
    ? `${total} redacted facts across ${channels} channels. Risk ${formatScore(riskScore)}; automation/protection signal ${formatScore(aiScore)}.`
    : "Enter a website URL and Runtime Diagnostics will sample it every second.";
  elements.plainChange.textContent = latest ? readableChannel(latest.channel) : "No changes yet";
  elements.plainChangeDetail.textContent = latest ? factSummary(latest.fact) : "No structural, resource, or runtime facts have been collected yet.";
  elements.plainPressure.textContent = pressureFacts > 20 ? "High" : pressureFacts > 5 ? "Moderate" : total ? "Low" : "Unknown";
  elements.plainPressureDetail.textContent = total
    ? `${pressureFacts} pressure-related signals and ${mutationFacts} structure-related signals were observed.`
    : "Performance pressure is estimated from observable browser runtime facts.";
  elements.plainAction.textContent = high ? "Inspect high severity facts" : medium ? "Review recent changes" : total ? "Keep monitoring" : "Start monitoring";
  elements.plainActionDetail.textContent = high
    ? "Open Dev mode and inspect the channels with high severity before trusting the page state."
    : "Normal view summarizes the site for non-technical users; Dev mode exposes the full diagnostic ledger.";
  renderNormalInsights(model, { total, high, medium, channels, pressureFacts, mutationFacts, spectrum });
  renderLayerCoverageMatrix(model);
  renderWebV2Taxonomy(model);
}

function renderOperatingStrip(model, counts = {}) {
  const facts = model.facts || [];
  const total = facts.length;
  const high = counts.high ?? facts.filter(item => item.severity === "high").length;
  const medium = counts.medium ?? facts.filter(item => item.severity === "medium").length;
  const target = elements.portalUrl?.value?.trim() || model.latest?.host || facts[0]?.fact?.context?.pageUrl || "";
  const coverage = model.layerCoverage || normalizeLayerCoverage(null, facts);
  const coverageValues = Object.values(coverage);
  const full = coverageValues.filter(layer => layer.status === "full").length;
  const evidence = coverageValues.filter(layer => layer.evidenceCount > 0).length;
  const limited = coverageValues.filter(layer => layer.status === "first_party_only" || layer.status === "blocked_by_browser").length;
  const latestTime = facts[0]?.time || model.latest?.checkedAt || 0;

  elements.targetSummary.textContent = target ? readableTarget(target) : "Not monitoring";
  elements.targetDetail.textContent = target
    ? `Sampling ${target} without mixing Visa Monitor data into Runtime Diagnostics.`
    : "Enter a website URL to start a live structural read.";
  elements.signalSummary.textContent = high ? "High risk" : medium ? "Watch" : total ? "Healthy" : "Waiting";
  elements.signalDetail.textContent = total
    ? `${total} facts, ${Object.keys(model.channels || {}).length} channels, latest ${latestTime ? new Date(latestTime).toLocaleTimeString() : "recently"}.`
    : "No runtime facts have been received yet.";
  elements.coverageStatus.textContent = `${full} full / ${evidence} active layers`;
  elements.coverageDetail.textContent = evidence
    ? `${limited} browser-limited layer${limited === 1 ? "" : "s"} labeled honestly.`
    : "Coverage appears after the first collector sample.";
  elements.boundaryStatus.textContent = limited ? "Limits labeled" : "Browser-safe";
  elements.boundaryDetail.textContent = limited
    ? "Protected browser internals are shown as first-party-only or best-effort instead of guessed."
    : "No browser boundary issues have been reported for this sample.";
}

function renderLayerCoverageMatrix(model) {
  if (!elements.coverageGrid) return;
  const unlocked = canViewLayerEvidence();
  if (elements.layerEvidenceLock) elements.layerEvidenceLock.textContent = unlocked ? "Unlocked evidence" : "Locked evidence";
  const coverage = model.layerCoverage || normalizeLayerCoverage(null, model.facts || []);
  const entries = Object.entries(coverage);
  if (!unlocked) {
    elements.coverageGrid.innerHTML = `
      <article class="coverage-card locked-evidence">
        <span>Paid evidence</span>
        <strong>Runtime Layer Coverage is locked</strong>
        <p>This detailed collector matrix belongs under Structure Monitor or Dev Mode Pro. Normal Diagnostics still shows a readable coverage summary.</p>
        <small>${entries.length} collector layers available after upgrade</small>
        <button class="secondary" type="button" data-layer-upgrade="security">Unlock Security</button>
      </article>
    `;
    elements.coverageGrid.querySelector("[data-layer-upgrade]")?.addEventListener("click", () => {
      activeModule = "security";
      localStorage.setItem("runtimeDiagnosticsActiveModule", activeModule);
      applyAppView("plans");
      setPlanStatus("Security unlocks Runtime Layer Coverage evidence.", "");
    });
    return;
  }
  elements.coverageGrid.innerHTML = entries.map(([name, layer]) => {
    const status = readableCoverageStatus(layer.status);
    const active = layer.evidenceCount > 0 || layer.status === "full";
    return `
      <article class="coverage-card ${escapeHtml(layer.status || "unknown")} ${active ? "active" : ""}">
        <span>${escapeHtml(readableCoverageName(name))}</span>
        <strong>${escapeHtml(status)}</strong>
        <p>${escapeHtml(layer.reason || "No coverage reason reported.")}</p>
        <small>${escapeHtml(layer.captureMode || "unknown capture")} - ${layer.evidenceCount || 0} evidence ${layer.evidenceCount === 1 ? "fact" : "facts"}</small>
      </article>
    `;
  }).join("");
}

function canViewLayerEvidence() {
  return hasPackageAccess("security") || hasDevModeAccess();
}

function renderNormalInsights(model, context = {}) {
  const systems = buildScreenshotModuleSystems(model, context);
  currentScreenshotModuleSystems = systems;
  if (!elements.normalInsightGrid) return;
  elements.normalCoverage.textContent = `${systems.filter(system => system.active).length} / ${systems.length} systems active`;
  elements.normalInsightGrid.innerHTML = systems.map(system => renderScreenshotModuleRawCard(system)).join("");
}

function buildScreenshotModuleSystems(model, context = {}) {
  const total = context.total ?? model.facts.length;
  const channelEntries = Object.entries(model.channels || {}).map(([channel, items]) => [channel, items?.length || 0]).sort((left, right) => right[1] - left[1]);
  const topChannels = channelEntries.slice(0, 4).map(([channel, count]) => `${readableChannel(channel)} (${count})`).join(", ") || "No active channels yet";
  const technologySignals = inferTechnologySignals(model.facts);
  const pipeline = model.pipeline || {};
  const pipelineLatest = pipeline.latest || {};
  const graph = pipeline.state?.summary || pipelineLatest.graph || {};
  const organState = model.organPipeline?.state || model.generatedOrganState || buildOrganStateFromFacts(model.facts);
  const organSummary = organState?.summary || {};
  const spectrum = context.spectrum || model.organFrequencySpectrum?.state || model.generatedFrequencySpectrum || buildFrequencySpectrumFromFacts(model.facts);
  const closure = spectrum?.closure || {};
  const products = spectrum?.products || {};
  const packageSuite = spectrum?.commercialPackages || products.commercialPackages || buildCommercialPackageSuiteFromState(spectrum);
  const activePackages = Array.isArray(packageSuite?.packages) ? packageSuite.packages.filter(item => item.status !== "quiet") : [];
  const structureEngine = organState?.structureEngine || {};
  const signature = structureEngine.signature?.finalSignature || closure.signature || "No stable signature yet";
  const latestFacts = model.facts.slice(0, 4).map(item => `${readableChannel(item.channel)}: ${factSummary(item.fact)}`);
  const coverage = model.layerCoverage || normalizeLayerCoverage(null, model.facts);
  const coverageValues = Object.values(coverage);
  const strongCoverage = coverageValues.filter(layer => layer.status === "full").length;
  const limitedCoverage = coverageValues.filter(layer => layer.status === "first_party_only" || layer.status === "blocked_by_browser").length;
  const systems = [
    {
      label: "Signal Quality",
      eventCategories: UI_RUNTIME_EVENT_MAP["Signal Quality"],
      title: model.facts.length ? `${model.facts.length} runtime facts arrived` : "No runtime events yet",
      detail: model.facts.length
        ? `Runtime event arrival is active across ${model.runtimeEventSummary?.activeCount || 0} of ${RUNTIME_EVENT_CATEGORIES.length} web-native categories.`
        : "The system has not yet received Interaction, Presentation, Communication, Synchronization, Persistence, Execution, Security, Resources, or Compute events.",
      active: model.facts.length > 0
    },
    {
      label: "Layer Coverage",
      eventCategories: UI_RUNTIME_EVENT_MAP["Layer Coverage"],
      title: `${strongCoverage} full layers, ${limitedCoverage} browser-limited`,
      detail: Object.entries(coverage).map(([name, layer]) => `${readableCoverageName(name)}: ${readableCoverageStatus(layer.status)}`).join(" | "),
      active: coverageValues.some(layer => layer.evidenceCount > 0 || layer.status === "full")
    },
    {
      label: "Channels Graph",
      eventCategories: UI_RUNTIME_EVENT_MAP["Channels Graph"],
      title: `${channelEntries.length} data channels`,
      detail: topChannels,
      active: channelEntries.length > 0
    },
    {
      label: "Technology Profile",
      eventCategories: UI_RUNTIME_EVENT_MAP["Technology Profile"],
      title: technologySignals.length ? `${technologySignals.length} technology signals` : "No technology profile yet",
      detail: technologySignals.slice(0, 3).map(signal => `${signal.name}: ${signal.detail}`).join(" ") || "Runtime Diagnostics will infer frameworks, storage, network behavior, and security signals as facts arrive.",
      active: technologySignals.length > 0
    },
    {
      label: "Structural Pipeline",
      eventCategories: UI_RUNTIME_EVENT_MAP["Structural Pipeline"],
      title: pipelineLatest.classification || "No structural classification yet",
      detail: pipelineLatest.classification
        ? `${pipelineLatest.category}/${pipelineLatest.signal} scored ${formatScore(pipelineLatest.score)}. Graph has ${graph.nodeCount || 0} keys and ${graph.edgeCount || 0} links.`
        : `${pipeline.normalizedFacts?.length || 0} normalized facts and ${pipeline.events?.length || 0} structural events are retained.`,
      active: Boolean(pipelineLatest.classification || pipeline.normalizedFacts?.length || pipeline.events?.length)
    },
    {
      label: "SIG9 Graph",
      eventCategories: ["Layer-1 organ projection"],
      title: `${organSummary.nodeCount || 0} organ facts`,
      detail: `${organSummary.edgeCount || 0} structural edges, ${organSummary.errorCount || 0} dispatch errors, ${organSummary.organCount || 9} fixed organ lanes represented.`,
      active: Boolean(organSummary.nodeCount)
    },
    {
      label: "Frequency Spectrum",
      eventCategories: UI_RUNTIME_EVENT_MAP["Frequency Spectrum"],
      title: `Risk ${formatScore(products.websiteRiskScore?.score || 0)}`,
      detail: `Closure ${signature}; coherence ${formatScore(closure.coherence)}; AI/protection signal ${formatScore(products.aiActivityDetection?.score || 0)}.`,
      active: Boolean(spectrum && total)
    },
    {
      label: "Commercial Package Suite",
      eventCategories: UI_RUNTIME_EVENT_MAP["Commercial Package Suite"],
      title: `${activePackages.length} SIG9 packages active`,
      detail: activePackages.length
        ? activePackages.map(item => `${item.name}: ${formatScore(item.score)}`).join(" ")
        : "Structure Monitor, Performance Spectrum, Update Radar, Risk Score Engine, and AI Activity Detector will score as evidence appears.",
      active: activePackages.length > 0
    },
    {
      label: "Structure Engine",
      eventCategories: UI_RUNTIME_EVENT_MAP["Structure Engine"],
      title: structureEngine.prediction?.label || "No prediction yet",
      detail: structureEngine.prediction
        ? `${structureEngine.prediction.label} with confidence ${formatScore(structureEngine.prediction.confidence)}. Signature ${signature}.`
        : `Signature ${signature}. Reconstruction and prediction become meaningful after more runtime facts are collected.`,
      active: Boolean(total && (structureEngine.signature || closure.signature))
    },
    {
      label: "Recent Facts",
      eventCategories: UI_RUNTIME_EVENT_MAP["Recent Facts"],
      title: latestFacts.length ? `${latestFacts.length} newest facts` : "No recent facts yet",
      detail: latestFacts.join(" ") || "The live ledger will summarize recent page behavior here without requiring Dev mode.",
      active: latestFacts.length > 0
    }
  ];
  return systems;
}

function renderScreenshotModuleRawCard(system) {
  return `
    <article class="normal-insight-card ${system.active ? "active" : ""}">
      <span>${escapeHtml(system.label)}</span>
      <strong>${escapeHtml(system.title)}</strong>
      <p>${escapeHtml(system.detail)}</p>
      <small>${escapeHtml((system.eventCategories || []).join(" / "))}</small>
    </article>
  `;
}

function screenshotModulesForRuntimeEvent(categoryName) {
  return currentScreenshotModuleSystems
    .filter(system => (system.eventCategories || []).includes(categoryName))
    .map(system => system.label);
}

function screenshotModuleSystemsForRuntimeEvent(categoryName, model) {
  const systems = currentScreenshotModuleSystems.length ? currentScreenshotModuleSystems : buildScreenshotModuleSystems(model || snapshot || buildSnapshot({}));
  return systems.filter(system => (system.eventCategories || []).includes(categoryName));
}

function renderWebV2Taxonomy(model) {
  if (!elements.webV2ModuleGrid || !elements.runtimeEventGrid) return;
  const summary = model.runtimeEventSummary || summarizeRuntimeEvents(model.facts || []);
  if (elements.runtimeEventSummary) {
    elements.runtimeEventSummary.textContent = `${summary.activeCount} / ${RUNTIME_EVENT_CATEGORIES.length} runtime event categories active`;
  }
  elements.webV2ModuleGrid.innerHTML = WEB_V2_MODULES.map(module => {
    const count = runtimeEventCount(model, module.runtimeEvents);
    const active = count > 0;
    return `
      <article class="web-v2-card ${active ? "active" : ""}">
        <span>${escapeHtml(module.structuralMapping)}</span>
        <strong>${escapeHtml(module.marketName)}</strong>
        <p>${escapeHtml(module.metrics.join(" / "))}</p>
        <small>From ${escapeHtml(module.sourceUi)} - ${count} mapped runtime ${count === 1 ? "event" : "events"}</small>
        <div class="event-tags">${module.runtimeEvents.map(name => `<code>${escapeHtml(name)}</code>`).join("")}</div>
      </article>
    `;
  }).join("");
  elements.runtimeEventGrid.innerHTML = summary.categories.map(category => {
    const organs = RUNTIME_EVENT_TO_SIG9_ORGANS[category.name] || [];
    const subcategories = category.subcategories || [];
    const mappedSystems = screenshotModuleSystemsForRuntimeEvent(category.name, model);
    const mappedModules = mappedSystems.map(system => system.label);
    const active = category.count > 0;
    return `
      <article class="runtime-event-card ${active ? "active" : ""}">
        <span>${escapeHtml(organs.join(" / ") || "Runtime")}</span>
        <strong>${escapeHtml(category.name)}</strong>
        <p class="runtime-profile-total"><b>${category.count}</b> total ${category.count === 1 ? "fact" : "facts"}${category.latest ? ` - latest ${escapeHtml(new Date(category.latest).toLocaleTimeString())}` : ""}</p>
        <div class="mapped-module-list"><b>Raw evidence:</b> ${mappedModules.map(name => `<code>${escapeHtml(name)}</code>`).join("") || "<code>Waiting</code>"}</div>
        <div class="runtime-subcategory-stack">
          ${subcategories.map(renderRuntimeFactSubcategory).join("") || `<div class="runtime-raw-card empty-raw">No Recent Facts have mapped into this profile category yet.</div>`}
        </div>
        <div class="event-tags">${(category.channels || []).slice(0, 4).map(channel => `<code>${escapeHtml(readableChannel(channel))}</code>`).join("") || "<code>Waiting</code>"}</div>
      </article>
    `;
  }).join("");
  renderFactMappingDebug(model, summary);
}

function renderRuntimeMappedRawData(system) {
  return `
    <div class="runtime-raw-card ${system.active ? "active" : ""}">
      <span>${escapeHtml(system.label)}</span>
      <strong>${escapeHtml(system.title)}</strong>
      <p>${escapeHtml(system.detail)}</p>
    </div>
  `;
}

function renderRuntimeFactSubcategory(subcategory) {
  const latest = subcategory.latest ? new Date(subcategory.latest).toLocaleTimeString() : "not seen yet";
  return `
    <div class="runtime-subcategory-card">
      <div class="runtime-subcategory-head">
        <strong>${escapeHtml(subcategory.name)}</strong>
        <span>${subcategory.count} ${subcategory.count === 1 ? "fact" : "facts"}</span>
      </div>
      <small>latest ${escapeHtml(latest)}</small>
    </div>
  `;
}

function renderFactMappingDebug(model, summary = null) {
  if (!elements.factMappingDebug) return;
  const report = buildFactMappingDebugReport(model, summary);
  const coverageRows = report.sourceTypeCoverage.slice(0, 36).map(item => `
    <tr>
      <td><code>${escapeHtml(item.key)}</code></td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml((item.categories || []).join(" / "))}</td>
      <td>${escapeHtml((item.organs || []).join(" / "))}</td>
      <td>${item.count}</td>
    </tr>
  `).join("");
  elements.factMappingDebug.innerHTML = `
    <article class="mapping-debug-card">
      <span>Registry</span>
      <strong>${escapeHtml(report.registryVersion)}</strong>
      <p>${report.totalFacts} facts checked, ${report.unmappedFacts.length} unmapped fallback facts, ${report.mappedFacts.length} total mapping decisions.</p>
    </article>
    <article class="mapping-debug-card">
      <span>Category totals</span>
      <strong>${report.categoryTotals.map(item => `${item.name}:${item.count}`).join("  ")}</strong>
      <p>Counts can exceed total facts because multi-category facts are intentionally preserved.</p>
    </article>
    <div class="table-wrap mapping-debug-table">
      <table>
        <thead><tr><th>Raw fact</th><th>Status</th><th>Atrinit categories</th><th>SIG9 organ</th><th>Count</th></tr></thead>
        <tbody>${coverageRows || `<tr><td colspan="5" class="empty">No raw facts have arrived yet.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function buildFactMappingDebugReport(model, summary = null) {
  const runtimeSummary = summary || model.runtimeEventSummary || summarizeRuntimeEvents(model.facts || []);
  return {
    registryVersion: RAW_FACT_MAPPING_REGISTRY_VERSION,
    totalFacts: model.facts?.length || 0,
    categoryTotals: (runtimeSummary.categories || []).map(category => ({ name: category.name, count: category.count })),
    mappedFacts: runtimeSummary.mappedFacts || [],
    unmappedFacts: runtimeSummary.unmappedFacts || [],
    sourceTypeCoverage: runtimeSummary.sourceTypeCoverage || []
  };
}

function normalizeLayerCoverage(rawCoverage, facts = []) {
  const base = {
    dom: coverageEntry("best_effort", "standalone_html_or_page_injection", 0.72, "DOM structure is available from fetched HTML or rendered page facts."),
    layout: coverageEntry("best_effort", "page_injection", 0.7, "Layout requires rendered page instrumentation; fetched HTML cannot expose final layout."),
    cssom: coverageEntry("best_effort", "standalone_html_or_page_injection", 0.72, "Stylesheet links are visible from HTML; full CSSOM requires page injection."),
    accessibility: coverageEntry("best_effort", "page_injection_or_cdp", 0.72, "DOM-derived accessibility is available; secure browser can add CDP AX-tree facts."),
    javascript: coverageEntry("best_effort", "page_injection", 0.7, "Runtime JavaScript facts require injected collector hooks."),
    shadow: coverageEntry("best_effort", "page_injection", 0.68, "Open shadow roots require rendered page access."),
    multicontext: coverageEntry("best_effort", "page_injection", 0.68, "Iframes and Workers require runtime page access."),
    vdom: coverageEntry("best_effort", "framework_runtime_hooks", 0.62, "Framework internals are captured only when hooks are exposed."),
    serviceWorkerFetch: coverageEntry("first_party_only", "first_party_helper", 0.6, "Arbitrary third-party Service Worker fetch handlers are browser-protected.")
  };
  if (rawCoverage && typeof rawCoverage === "object") {
    for (const [name, value] of Object.entries(rawCoverage)) base[name] = { ...base[name], ...value };
  }
  for (const item of facts) {
    const fact = item.fact || item;
    if (fact.source === "runtime" && fact.type === "layer_coverage" && fact.value?.layers) {
      for (const [name, value] of Object.entries(fact.value.layers)) {
        base[name] = { ...base[name], ...value, lastFactAt: fact.timestamp || 0, evidenceCount: (base[name]?.evidenceCount || 0) + 1 };
      }
    }
    const layer = layerNameForFact(`${fact.source || ""}/${fact.type || ""}`.toLowerCase());
    if (!layer || !base[layer]) continue;
    base[layer].evidenceCount = (base[layer].evidenceCount || 0) + 1;
    base[layer].lastFactAt = Math.max(base[layer].lastFactAt || 0, fact.timestamp || 0);
    if (fact.captureMode === "chrome_devtools_protocol") base[layer].status = "full";
  }
  return base;
}

function coverageEntry(status, captureMode, confidence, reason) {
  return { status, captureMode, confidence, reason, evidenceCount: 0, lastFactAt: 0 };
}

function layerNameForFact(channel) {
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

function readableCoverageName(name) {
  return ({
    dom: "DOM",
    layout: "Layout",
    cssom: "CSSOM",
    accessibility: "Accessibility",
    javascript: "JS runtime",
    shadow: "Shadow DOM",
    multicontext: "Frames/workers",
    vdom: "VDOM",
    serviceWorkerFetch: "SW fetch"
  })[name] || name;
}

function readableCoverageStatus(status) {
  return ({
    full: "full",
    best_effort: "best effort",
    first_party_only: "first-party only",
    blocked_by_browser: "browser-blocked",
    unsupported: "unsupported"
  })[status] || status || "unknown";
}

function readableTarget(value) {
  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return String(value || "").replace(/^https?:\/\//, "").split("/")[0] || "Current target";
  }
}

function renderChannels(model) {
  const channelCounts = new Map();
  for (const item of model.facts) channelCounts.set(item.channel, (channelCounts.get(item.channel) || 0) + 1);
  const entries = [...channelCounts.entries()].sort((left, right) => right[1] - left[1]);
  elements.channels.innerHTML = entries.length ? entries.map(([channel, count]) => (
    `<button class="channel-item" type="button" data-channel="${escapeHtml(channel)}" aria-label="Filter recent facts to ${escapeHtml(channel)}">${escapeHtml(channel)}<span>${count}</span></button>`
  )).join("") : `<div class="empty">No channels collected yet.</div>`;
  elements.channelFilter.innerHTML = `<option value="">All channels</option>${entries.map(([channel]) => `<option value="${escapeHtml(channel)}">${escapeHtml(channel)}</option>`).join("")}`;
  elements.channels.querySelectorAll(".channel-item").forEach(button => {
    button.addEventListener("click", () => {
      elements.channelFilter.value = button.dataset.channel || "";
      renderFacts();
    });
  });
}

function renderTechnologyProfile(model) {
  const signals = inferTechnologySignals(model.facts);
  elements.profileCount.textContent = `${signals.length} ${signals.length === 1 ? "signal" : "signals"}`;
  elements.technologyProfile.innerHTML = signals.length ? signals.map(signal => `
    <article class="profile-card ${escapeHtml(signal.category)}">
      <strong>${escapeHtml(signal.name)}</strong>
      <p>${escapeHtml(signal.detail)}</p>
    </article>
  `).join("") : `<div class="empty">Open a website while monitoring is enabled to build a technology profile.</div>`;
}

function renderStructuralPipeline(model) {
  const pipeline = model.pipeline || {};
  const latest = pipeline.latest || {};
  const graph = pipeline.state?.summary || latest.graph || {};
  const classifications = pipeline.classifications || [];
  elements.pipelineCount.textContent = `${classifications.length} ${classifications.length === 1 ? "classification" : "classifications"}`;
  const cards = [
    {
      name: latest.classification || "No classification yet",
      category: "runtime",
      detail: latest.classification ? `${latest.category}/${latest.signal} scored ${formatScore(latest.score)} with ${latest.eventCount || 0} structural events.` : "Process runtime or crawler facts to produce structural update classifications."
    },
    {
      name: "Frequency Graph",
      category: "network",
      detail: `${graph.nodeCount || 0} structural keys and ${graph.edgeCount || 0} co-occurrence edges tracked across normalized facts.`
    },
    {
      name: "Normalized Facts",
      category: "storage",
      detail: `${pipeline.normalizedFacts?.length || 0} normalized facts, ${pipeline.events?.length || 0} events, ${pipeline.features?.length || 0} feature vectors, and ${pipeline.scores?.length || 0} scores retained.`
    }
  ];
  elements.pipelineProfile.innerHTML = cards.map(card => `
    <article class="profile-card ${escapeHtml(card.category)}">
      <strong>${escapeHtml(card.name)}</strong>
      <p>${escapeHtml(card.detail)}</p>
    </article>
  `).join("");
}

function renderOrganPresentation(model) {
  const state = model.organPipeline?.state || buildOrganStateFromFacts(model.facts);
  model.generatedOrganState = state;
  const summary = state.summary || { organCount: 9, nodeCount: 0, edgeCount: 0, errorCount: 0, organs: [] };
  const definitions = state.definitions || window.TicketSniperOrganPipeline?.ORGAN_DEFINITIONS || {};
  const order = window.TicketSniperOrganPipeline?.ORGAN_ORDER || Object.keys(definitions);
  elements.organCount.textContent = `${summary.nodeCount || 0} organ ${summary.nodeCount === 1 ? "fact" : "facts"}`;
  elements.organSummary.innerHTML = `
    <div><strong>${summary.organCount || order.length}</strong><span>fixed organs</span></div>
    <div><strong>${summary.nodeCount || 0}</strong><span>graph nodes</span></div>
    <div><strong>${summary.edgeCount || 0}</strong><span>structural edges</span></div>
    <div><strong>${summary.errorCount || 0}</strong><span>dispatch errors</span></div>
  `;
  elements.organPanels.innerHTML = order.map(organ => renderOrganPanel(organ, state.graphs?.[organ], state.renderBlocks?.[organ], definitions[organ])).join("");
  const errors = state.errors || model.organPipeline?.errors || [];
  elements.organErrors.innerHTML = errors.length ? `
    <details>
      <summary>${errors.length} dispatch ${errors.length === 1 ? "error" : "errors"}</summary>
      <ul>${errors.slice(0, 12).map(error => `<li><code>${escapeHtml(error.code || "ERROR")}</code> ${escapeHtml(error.fact_type || error.reason || "")}</li>`).join("")}</ul>
    </details>
  ` : "";
}

function renderFrequencySpectrum(model) {
  const state = model.organFrequencySpectrum?.state || buildFrequencySpectrumFromFacts(model.facts);
  model.generatedFrequencySpectrum = state;
  const closure = state?.closure || {};
  const spectra = state?.spectra || {};
  const products = state?.products || {};
  const nodeCount = Array.isArray(state?.nodes) ? state.nodes.length : 0;
  const edgeCount = Array.isArray(state?.edges) ? state.edges.length : 0;
  elements.spectrumCount.textContent = `${nodeCount} nodes / ${edgeCount} edges`;
  const productCards = [
    ["Website Behavior", products.websiteBehaviorMonitoring, `Active organs ${products.websiteBehaviorMonitoring?.activeOrgans || 0}; structural facts ${products.websiteBehaviorMonitoring?.structuralFacts || 0}.`],
    ["Performance Spectrum", products.performanceFrequencySpectrum, `Energy frequency ${products.performanceFrequencySpectrum?.energyFrequency || 0}; rhythm ${products.performanceFrequencySpectrum?.rhythmFrequency || 0}; supply ${products.performanceFrequencySpectrum?.supplyFrequency || 0}.`],
    ["Update Tracking", products.updateFrequencyTracking, `Topology delta ${products.updateFrequencyTracking?.topologyDelta || 0}; lifecycle delta ${products.updateFrequencyTracking?.lifecycleDelta || 0}.`],
    ["Risk Score", products.websiteRiskScore, `Risk ${formatScore(products.websiteRiskScore?.score)} from value, flow, and lifecycle pressure.`],
    ["AI Activity", products.aiActivityDetection, `Score ${formatScore(products.aiActivityDetection?.score)} from ${products.aiActivityDetection?.evidenceCount || 0} automation/protection signals.`]
  ];
  const spectrumCards = Object.values(spectra).map(item => ({
    name: `${item.organ} Spectrum`,
    category: item.organ === "Value" ? "security" : item.organ === "Flow" ? "network" : item.organ === "Lifecycle" ? "storage" : "runtime",
    detail: `Frequency ${item.frequency || 0}, delta ${item.delta || 0}, energy ${formatScore(item.energy)}, volatility ${formatScore(item.volatility)}.`
  }));
  const cards = [
    {
      name: "Spectrum Closure",
      category: "security",
      detail: `Signature ${closure.signature || "none"}; active organs ${closure.activeOrgans || 0}; coherence ${formatScore(closure.coherence)}; energy ${formatScore(closure.energy)}.`
    },
    ...productCards.map(([name, product, detail]) => ({ name, category: "network", detail: product?.useful === false ? "Disabled." : detail })),
    ...spectrumCards
  ];
  elements.spectrumProfile.innerHTML = cards.map(card => `
    <article class="profile-card ${escapeHtml(card.category)}">
      <strong>${escapeHtml(card.name)}</strong>
      <p>${escapeHtml(card.detail || "No spectrum data yet.")}</p>
    </article>
  `).join("");
}

function renderCommercialPackageSuite(model) {
  if (!elements.packageSuiteGrid) return;
  const state = model.organFrequencySpectrum?.state || model.generatedFrequencySpectrum || buildFrequencySpectrumFromFacts(model.facts);
  model.generatedFrequencySpectrum = state;
  const suite = state?.commercialPackages || state?.products?.commercialPackages || buildCommercialPackageSuiteFromState(state);
  const packages = packageDefinitionsWithRuntimeData(suite);
  const summary = suite?.summary || {};
  const unlockedCount = packages.filter(item => hasPackageAccess(item.id)).length;
  elements.packageSuiteSummary.textContent = `${unlockedCount} / ${packages.length || 5} unlocked`;
  if (!packages.length) {
    elements.packageSuiteGrid.innerHTML = `
      <article class="package-card quiet">
        <span>Waiting</span>
        <strong>No commercial package evidence yet</strong>
        <p>Analyze a website to score Structure Monitor, Performance Spectrum, Update Radar, Risk Score Engine, and AI Activity Detector.</p>
      </article>
    `;
    return;
  }
  elements.packageSuiteGrid.innerHTML = packages.map(item => `
    <article class="package-card ${escapeHtml(item.status || "quiet")} ${hasPackageAccess(item.id) ? "unlocked" : "locked"}">
      <span>Package ${escapeHtml(item.code || "")} - ${hasPackageAccess(item.id) ? "unlocked" : "locked"}</span>
      <strong>${escapeHtml(item.name || "SIG9 Package")}</strong>
      <p>${escapeHtml(item.promise || item.coreValue || item.explanation || "")}</p>
      <div class="package-score">
        <meter min="0" max="1" value="${hasPackageAccess(item.id) ? Number(item.score) || 0 : 0}"></meter>
        <b>${hasPackageAccess(item.id) ? formatScore(item.score) : "Locked"}</b>
      </div>
      <div class="package-meta">
        <small><b>Industry:</b> ${escapeHtml(item.industry || "General")}</small>
        <small><b>Pricing:</b> ${escapeHtml(item.pricing || "Commercial")}</small>
        <small><b>Access:</b> ${hasPackageAccess(item.id) ? "Included in current package" : "Requires package unlock"}</small>
        <small><b>Evidence:</b> ${hasPackageAccess(item.id) ? Number(item.evidenceCount) || 0 : 0} matched signals - Suite ${escapeHtml(summary.suiteSignature || "pending")}</small>
      </div>
      <p>${escapeHtml(hasPackageAccess(item.id) ? item.explanation || item.unlockCopy || "" : item.unlockCopy || "Unlock this module to view live evidence.")}</p>
      <div class="package-evidence">
        ${hasPackageAccess(item.id)
          ? ((item.evidence || []).slice(0, 5).map(evidence => `<code>${escapeHtml(evidence)}</code>`).join("") || "<code>No direct evidence yet</code>")
          : "<code>Locked evidence</code><code>Upgrade required</code>"}
      </div>
      <ul class="package-capabilities">
        ${(item.capabilities || []).slice(0, 4).map(capability => `<li>${escapeHtml(capability)}</li>`).join("")}
      </ul>
      <div class="event-tags">${(item.runtimeEvents || []).map(name => `<code>${escapeHtml(name)}</code>`).join("")}</div>
      <button class="${hasPackageAccess(item.id) ? "" : "secondary"}" type="button" data-module-action="${escapeHtml(item.id)}" data-action-kind="${hasPackageAccess(item.id) ? "open-module" : "view-plans"}">
        ${hasPackageAccess(item.id) ? "Open module" : "View pricing"}
      </button>
    </article>
  `).join("");
  elements.packageSuiteGrid.querySelectorAll("[data-module-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.actionKind === "view-plans") {
        activeModule = normalizePlanId(button.dataset.moduleAction) || activeModule;
        localStorage.setItem("runtimeDiagnosticsActiveModule", activeModule);
        applyAppView("plans");
        setPlanStatus(`${readablePlanName(activeModule)} is locked. Choose the package to unlock its module page.`, "");
      } else {
        selectModule(button.dataset.moduleAction);
        applyAppView("modules");
      }
    });
  });
  renderModulePages(model);
}

function renderLiveSignalConsole(terminal) {
  if (!elements.webBloombergStatus) return;
  const model = terminal && terminal.ok !== false ? terminal : null;
  if (!model) {
    elements.webBloombergStatus.textContent = "No windows";
    elements.webBloombergFrequency.textContent = "0 events/s";
    elements.webBloombergFrequencyDetail.textContent = "Waiting for compact behavior windows.";
    elements.webBloombergStorms.textContent = "0 storms";
    elements.webBloombergStormDetail.textContent = "No storm pressure yet.";
    elements.webBloombergDeviation.textContent = "0%";
    elements.webBloombergDeviationDetail.textContent = "No deviation baseline yet.";
    elements.webBloombergRisk.textContent = "Calm";
    elements.webBloombergRiskDetail.textContent = "Risk will update as windows arrive.";
    elements.webBloombergDependencyCount.textContent = "0 edges";
    elements.webBloombergDependencies.textContent = "No dependency chains yet.";
    elements.webBloombergWindowCount.textContent = "0 windows";
    elements.webBloombergWindows.textContent = "No compact windows have been ingested.";
    return;
  }
  const frequency = model.frequency || {};
  const storms = model.storms || [];
  const deviations = model.deviations || [];
  const risk = model.risk || {};
  const dependencies = model.dependencies || {};
  const windows = model.windows || [];
  const latestDeviation = deviations.at(-1);
  elements.webBloombergStatus.textContent = `${model.summary?.windowCount || windows.length || 0} windows`;
  elements.webBloombergFrequency.textContent = `${Math.round(Number(frequency.latestTotal) || 0)} events/s`;
  elements.webBloombergFrequencyDetail.textContent = readableMetricSummary(frequency.latestMetrics || {});
  elements.webBloombergStorms.textContent = `${storms.length} ${storms.length === 1 ? "storm" : "storms"}`;
  elements.webBloombergStormDetail.textContent = storms.at(-1)?.summary || "No storm pressure in the current window.";
  elements.webBloombergDeviation.textContent = `${Math.round((latestDeviation?.score || 0) * 100)}%`;
  elements.webBloombergDeviationDetail.textContent = latestDeviation?.summary || "Deviation baseline is still forming.";
  elements.webBloombergRisk.textContent = `${risk.label || "Calm"} ${Math.round((risk.score || 0) * 100)}%`;
  elements.webBloombergRiskDetail.textContent = (risk.drivers || []).map(item => `${item.label}: ${Math.round((item.value || 0) * 100)}%`).join(" | ") || "No risk drivers yet.";
  elements.webBloombergDependencyCount.textContent = `${dependencies.edgeCount || 0} edges`;
  elements.webBloombergDependencies.innerHTML = (dependencies.chains || []).length
    ? `<ul>${dependencies.chains.slice(0, 8).map(chain => `<li>${escapeHtml(chain)}</li>`).join("")}</ul>`
    : "No dependency chains yet.";
  elements.webBloombergWindowCount.textContent = `${windows.length} windows`;
  elements.webBloombergWindows.innerHTML = hasDevModeAccess()
    ? renderTerminalWindowRows(windows)
    : `<div class="locked-evidence"><strong>Dev Mode Pro locked</strong><p>Upgrade to inspect raw compact windows, aggregation inputs, and dependency edges. Normal mode still shows storm, deviation, and risk summaries.</p></div>`;
}

function readableMetricSummary(metrics = {}) {
  const entries = Object.entries(metrics)
    .filter(([key]) => key !== "behavior" || Object.keys(metrics).length === 1)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .slice(0, 4);
  if (!entries.length) return "No frequency metrics in the latest window.";
  return entries.map(([key, value]) => `${key.replace(/_/g, " ")} ${Math.round(Number(value) || 0)}`).join(" | ");
}

function renderTerminalWindowRows(windows = []) {
  if (!windows.length) return "No compact windows have been ingested.";
  return `<table><thead><tr><th>Time</th><th>Bucket</th><th>Metrics</th></tr></thead><tbody>${
    windows.slice(-12).reverse().map(window => `
      <tr>
        <td>${escapeHtml(new Date(window.end_ts || Date.now()).toLocaleTimeString())}</td>
        <td>${escapeHtml(`${window.bucket_ms || 0}ms`)}</td>
        <td>${escapeHtml(readableMetricSummary(window.metrics || {}))}</td>
      </tr>
    `).join("")
  }</tbody></table>`;
}

function renderRankings() {
  if (!elements.rankingTabs || !elements.rankingList || !elements.rankingDetail) return;
  if (!rankingLedger.length) rankingLedger = loadRankingLedger();
  const board = RANKING_BOARDS.find(item => item.id === activeRankingBoard) || RANKING_BOARDS[0];
  activeRankingBoard = board.id;
  localStorage.setItem("runtimeDiagnosticsRankingBoard", activeRankingBoard);
  const rows = rankWebsiteSamples(rankingLedger, board.id);
  elements.rankingTabs.innerHTML = RANKING_BOARDS.map(item => `
    <button class="ranking-tab ${item.id === board.id ? "active" : ""}" type="button" role="tab" aria-selected="${item.id === board.id}" data-ranking-board="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.name)}</span>
      <small>${item.id === "overall" ? "All scores" : item.boardKind === "web-v2" ? "Web V2 score" : "Package score"}</small>
    </button>
  `).join("");
  elements.rankingTitle.textContent = `${board.name} Ranking`;
  elements.rankingSubtitle.textContent = board.subtitle;
  elements.rankingCount.textContent = `${rows.length} ${rows.length === 1 ? "website" : "websites"}`;
  renderRankingOperations();
  elements.rankingList.innerHTML = rows.length ? rows.map((row, index) => renderRankingRow(row, index, board.id)).join("") : `
    <div class="empty">No ranking data yet. Seed the benchmark set or add the current analyzed target.</div>
  `;
  elements.rankingTabs.querySelectorAll("[data-ranking-board]").forEach(button => {
    button.addEventListener("click", () => {
      activeRankingBoard = button.dataset.rankingBoard || "overall";
      renderRankings();
    });
  });
  elements.rankingList.querySelectorAll("[data-ranking-site]").forEach(button => {
    button.addEventListener("click", () => renderRankingDetail(button.dataset.rankingSite || "", board.id));
  });
  if (!elements.rankingDetail.dataset.site && rows[0]) renderRankingDetail(rows[0].id, board.id);
  else if (elements.rankingDetail.dataset.site) renderRankingDetail(elements.rankingDetail.dataset.site, board.id);
  refreshRankingCrawlerStatus();
}

function renderRankingOperations() {
  const crawler = rankingCrawlerStatus?.crawler || {};
  const sourceKinds = new Set(rankingLedger.map(item => item.sourceKind || "seed-benchmark"));
  const crawlerSamples = rankingLedger.filter(item => item.sourceKind === "local-scheduled-crawler").length;
  const mode = crawlerSamples ? "Crawler-backed" : sourceKinds.has("local-runtime-sample") ? "Mixed" : "Seed";
  if (elements.rankingCorpusCount) elements.rankingCorpusCount.textContent = `${rankingLedger.length} websites`;
  if (elements.rankingCrawlerState) {
    elements.rankingCrawlerState.textContent = crawler.running
      ? `Crawler running: ${crawler.successCount || 0} successful samples, ${crawler.failureCount || 0} failures, next ${crawler.nextUrl || "queued URL"}.`
      : crawler.resultCount
        ? `Crawler idle with ${crawler.resultCount} measured samples ready to import.`
        : "Crawler idle. Start scheduled collection to replace seed assumptions with measured samples.";
  }
  if (elements.rankingOpCorpus) elements.rankingOpCorpus.textContent = String(rankingLedger.length);
  if (elements.rankingOpQueue) elements.rankingOpQueue.textContent = String(crawler.queueSize || rankingLedger.length);
  if (elements.rankingOpResults) elements.rankingOpResults.textContent = String(crawler.resultCount || 0);
  if (elements.rankingOpMode) elements.rankingOpMode.textContent = mode;
}

async function refreshRankingCrawlerStatus() {
  try {
    const response = await fetch("/api/rankings/crawler/status");
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Crawler status unavailable.");
    rankingCrawlerStatus = payload;
    renderRankingOperations();
  } catch {
    rankingCrawlerStatus = { crawler: { running: false, queueSize: rankingLedger.length, resultCount: 0 } };
    renderRankingOperations();
  }
}

async function startRankingCrawler() {
  try {
    const response = await fetch("/api/rankings/crawler/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: rankingCrawlerUrls(), intervalMs: 90000, batchSize: 3 })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to start crawler.");
    rankingCrawlerStatus = payload;
    renderRankingOperations();
    setRankingStatus("Local ranking crawler started. It will collect scheduled samples from the ranking corpus.", "success");
  } catch (error) {
    setRankingStatus(`Crawler start failed: ${error.message || String(error)}`, "error");
  }
}

async function stopRankingCrawler() {
  try {
    const response = await fetch("/api/rankings/crawler/stop", { method: "POST" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to stop crawler.");
    rankingCrawlerStatus = payload;
    renderRankingOperations();
    setRankingStatus("Local ranking crawler stopped.", "success");
  } catch (error) {
    setRankingStatus(`Crawler stop failed: ${error.message || String(error)}`, "error");
  }
}

async function runRankingCrawlerBatch() {
  try {
    setRankingStatus("Running one crawler batch...", "");
    const response = await fetch("/api/rankings/crawler/run-once", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: rankingCrawlerUrls(), batchSize: 5 })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Crawler batch failed.");
    rankingCrawlerStatus = payload;
    mergeCrawlerSamples(payload.results || []);
    renderRankings();
    setRankingStatus(`Crawler batch finished: ${(payload.results || []).filter(item => item.ok !== false).length} measured samples imported.`, "success");
  } catch (error) {
    setRankingStatus(`Crawler batch failed: ${error.message || String(error)}`, "error");
  }
}

async function importRankingCrawlerResults() {
  try {
    const response = await fetch("/api/rankings/crawler/results");
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Crawler results unavailable.");
    rankingCrawlerStatus = payload;
    const count = mergeCrawlerSamples(payload.results || []);
    renderRankings();
    setRankingStatus(count ? `${count} crawler samples imported into rankings.` : "No new crawler samples to import.", count ? "success" : "");
  } catch (error) {
    setRankingStatus(`Crawler import failed: ${error.message || String(error)}`, "error");
  }
}

function mergeCrawlerSamples(samples = []) {
  let imported = 0;
  for (const sample of samples) {
    if (!sample?.ok || !sample.host || !sample.packageScores) continue;
    mergeRankingSample({
      ...sample,
      id: normalizeRankingId(sample.host),
      sourceLabel: sample.sourceLabel || "Crawler sample",
      sourceKind: "local-scheduled-crawler"
    });
    imported += 1;
  }
  if (imported) saveRankingLedger();
  return imported;
}

function rankingCrawlerUrls() {
  return rankingLedger.map(item => item.url || `https://${item.host}/`).filter(Boolean).slice(0, 120);
}

function renderRankingRow(row, index, boardId) {
  const score = rankingScoreForBoard(row, boardId);
  return `
    <button class="ranking-row" type="button" data-ranking-site="${escapeHtml(row.id)}" aria-label="Open SIG9 ranking analysis for ${escapeHtml(row.host)}">
      <span class="ranking-position">${index + 1}</span>
      <span class="ranking-site">
        <strong>${escapeHtml(row.host)}</strong>
        <small>${escapeHtml(row.category || row.sourceLabel || "Website sample")}</small>
      </span>
      <meter min="0" max="1" value="${score}"></meter>
      <b>${formatScore(score)}</b>
    </button>
  `;
}

function renderRankingDetail(siteId, boardId = activeRankingBoard) {
  const sample = rankingLedger.find(item => item.id === siteId) || rankingLedger[0];
  if (!sample) {
    elements.rankingDetail.innerHTML = `
      <p class="eyebrow">No ranking selected</p>
      <h2>Seed or collect website data.</h2>
      <p>Rankings need benchmark samples or analyzed targets before they can show useful comparisons.</p>
    `;
    return;
  }
  elements.rankingDetail.dataset.site = sample.id;
  const score = rankingScoreForBoard(sample, boardId);
  const activeBoard = RANKING_BOARDS.find(item => item.id === boardId) || RANKING_BOARDS[0];
  const packageRows = PACKAGE_DEFINITIONS.map(definition => {
    const unlocked = hasPackageAccess(definition.id);
    const packageScore = sample.packageScores?.[definition.id] ?? 0;
    return `
      <article class="ranking-package ${unlocked ? "unlocked" : "locked"}">
        <span>Package ${escapeHtml(definition.code)} - ${escapeHtml(definition.name)}</span>
        <strong>${unlocked ? formatScore(packageScore) : "Locked"}</strong>
        <p>${escapeHtml(unlocked ? packageInsight(sample, definition.id) : "Upgrade this package to view deeper evidence, matched channels, and package-specific reasoning.")}</p>
        ${unlocked ? `<small>${escapeHtml((sample.evidence?.[definition.id] || []).slice(0, 3).join(" | ") || "No package evidence yet")}</small>` : `<button class="secondary" type="button" data-ranking-upgrade="${escapeHtml(definition.id)}">Unlock package</button>`}
      </article>
    `;
  }).join("");
  const webV2Rows = WEB_V2_MODULES.map(module => {
    const moduleScore = sample.webV2Scores?.[module.id] ?? 0;
    const evidence = sample.webV2Evidence?.[module.id] || [];
    const active = activeBoard.id === module.id;
    return `
      <article class="ranking-package ${active ? "unlocked" : ""}">
        <span>${escapeHtml(module.structuralMapping)} - ${escapeHtml(module.marketName)}</span>
        <strong>${formatScore(moduleScore)}</strong>
        <p>${escapeHtml(webV2Insight(sample, module.id))}</p>
        <small>${escapeHtml(evidence.slice(0, 3).join(" | ") || module.runtimeEvents.join(" / "))}</small>
      </article>
    `;
  }).join("");
  elements.rankingDetail.innerHTML = `
    <p class="eyebrow">${escapeHtml(sample.sourceLabel || "Benchmark sample")}</p>
    <h2>${escapeHtml(sample.host)}</h2>
    <p>${escapeHtml(sample.normal?.healthDetail || "No normal diagnostic summary has been collected yet.")}</p>
    <div class="ranking-detail-score">
      <span>${escapeHtml(RANKING_BOARDS.find(item => item.id === boardId)?.name || "Overall")}</span>
      <strong>${formatScore(score)}</strong>
      <small>${sample.sampleCount || 1} sample${sample.sampleCount === 1 ? "" : "s"} - confidence ${formatScore(sample.confidence || 0)}</small>
    </div>
    <div class="ranking-normal-grid">
      <article><span>Website health</span><strong>${escapeHtml(sample.normal?.health || "Unknown")}</strong><p>${escapeHtml(sample.normal?.healthDetail || "Run a live analysis to collect health data.")}</p></article>
      <article><span>What changed</span><strong>${escapeHtml(sample.normal?.change || "No change sample")}</strong><p>${escapeHtml(sample.normal?.changeDetail || "Structural changes appear after runtime facts are collected.")}</p></article>
      <article><span>Pressure</span><strong>${escapeHtml(sample.normal?.pressure || "Unknown")}</strong><p>${escapeHtml(sample.normal?.pressureDetail || "Pressure is estimated from runtime evidence.")}</p></article>
      <article><span>Recommended action</span><strong>${escapeHtml(sample.normal?.action || "Monitor")}</strong><p>${escapeHtml(sample.normal?.actionDetail || "Use Normal view first; unlock paid packages for evidence.")}</p></article>
    </div>
    <div class="section-title compact">
      <h3>Web Version 2 Scores</h3>
      <span>${escapeHtml(activeBoard.boardKind === "web-v2" ? activeBoard.name : "All market modules")}</span>
    </div>
    <div class="ranking-package-grid">${webV2Rows}</div>
    <div class="section-title compact">
      <h3>Commercial Package Scores</h3>
      <span>Paid package surfaces</span>
    </div>
    <div class="ranking-package-grid">${packageRows}</div>
  `;
  elements.rankingDetail.querySelectorAll("[data-ranking-upgrade]").forEach(button => {
    button.addEventListener("click", () => {
      activeModule = normalizePlanId(button.dataset.rankingUpgrade) || activeModule;
      localStorage.setItem("runtimeDiagnosticsActiveModule", activeModule);
      applyAppView("plans");
      setPlanStatus(`${readablePlanName(activeModule)} unlocks deeper ranking evidence for ${sample.host}.`, "");
    });
  });
}

function addCurrentTargetToRankings() {
  if (!snapshot || !snapshot.facts.length) {
    setRankingStatus("Analyze a website first, then add the current target to rankings.", "error");
    return;
  }
  const result = standaloneState.lastResult || { diagnostics: snapshot.data || {}, finalUrl: elements.portalUrl?.value || "", analyzedAt: Date.now() };
  upsertRankingSampleFromResult(result, snapshot, "manual-current-target");
  renderRankings();
  setRankingStatus("Current analyzed target added to the ranking ledger.", "success");
}

function seedRankingLedger() {
  let added = 0;
  for (const sample of BENCHMARK_SEED_RANKINGS) {
    const before = rankingLedger.length;
    mergeRankingSample(sample);
    if (rankingLedger.length > before) added += 1;
  }
  saveRankingLedger();
  renderRankings();
  setRankingStatus(added ? `${added} benchmark samples added.` : "Benchmark samples are already in the ranking ledger.", "success");
}

function ensureBenchmarkSeedCoverage() {
  const storedVersion = localStorage.getItem("SIG9RankingSeedVersion") || "";
  const missingSeeds = BENCHMARK_SEED_RANKINGS.filter(seed => !rankingLedger.some(item => item.id === seed.id));
  if (storedVersion === RANKING_SEED_VERSION && !missingSeeds.length) return;
  for (const sample of missingSeeds) mergeRankingSample(sample);
  localStorage.setItem("SIG9RankingSeedVersion", RANKING_SEED_VERSION);
  saveRankingLedger();
}

function exportRankingLedger() {
  downloadJson({
    exportedAt: new Date().toISOString(),
    note: "SIG9 ranking ledger contains benchmark seed samples and locally collected website analyses. It is not global internet telemetry unless connected to a crawler fleet.",
    boards: RANKING_BOARDS,
    samples: rankWebsiteSamples(rankingLedger, activeRankingBoard)
  }, "SIG9-website-rankings");
  setRankingStatus("Ranking JSON exported.", "success");
}

function setRankingStatus(message, state = "") {
  if (!elements.rankingStatus) return;
  elements.rankingStatus.textContent = message;
  elements.rankingStatus.className = `status-message ${state}`.trim();
}

function upsertRankingSampleFromResult(result = {}, model = snapshot, sourceLabel = "live-analysis") {
  const target = result.finalUrl || result.requestedUrl || model?.latest?.host || elements.portalUrl?.value || "";
  const host = readableTarget(target);
  if (!host || host === "Current target") return;
  const sample = buildRankingSampleFromSnapshot({ host, url: target, model, result, sourceLabel });
  mergeRankingSample(sample);
  saveRankingLedger();
}

function buildRankingSampleFromSnapshot({ host, url, model, result, sourceLabel }) {
  const state = model?.organFrequencySpectrum?.state || model?.generatedFrequencySpectrum || buildFrequencySpectrumFromFacts(model?.facts || []);
  const packages = packageDefinitionsWithRuntimeData(state?.commercialPackages || state?.products?.commercialPackages || buildCommercialPackageSuiteFromState(state));
  const packageScores = Object.fromEntries(PACKAGE_DEFINITIONS.map(definition => {
    const runtime = packages.find(item => item.id === definition.id) || {};
    return [definition.id, clamp01(Number(runtime.score) || inferredPackageScore(model, definition.id))];
  }));
  const webV2Analysis = buildWebV2AnalysisFromModel(model, packageScores);
  const normal = buildNormalSummaryForRanking(model);
  return {
    id: normalizeRankingId(host),
    host,
    url,
    category: "Live analyzed target",
    sourceLabel,
    sourceKind: "local-runtime-sample",
    sampleCount: 1,
    confidence: Math.min(.95, .35 + Math.min(1, (model?.facts?.length || 0) / 80) * .55),
    packageScores,
    webV2Scores: webV2Analysis.scores,
    overallScore: computeOverallRankingScore(packageScores, webV2Analysis.scores),
    normal,
    evidence: Object.fromEntries(packages.map(item => [item.id, item.evidence || []])),
    webV2Evidence: webV2Analysis.evidence,
    factCount: model?.facts?.length || 0,
    channelCount: Object.keys(model?.channels || {}).length,
    lastAnalyzedAt: result.analyzedAt || new Date().toISOString()
  };
}

function buildNormalSummaryForRanking(model = buildSnapshot({})) {
  const total = model.facts?.length || 0;
  const high = model.facts?.filter(item => item.severity === "high").length || 0;
  const medium = model.facts?.filter(item => item.severity === "medium").length || 0;
  const channels = Object.keys(model.channels || {}).length;
  const pressureFacts = model.facts?.filter(item => /performance|long-task|layout|frame|resource|network/.test(item.channel)).length || 0;
  const mutationFacts = model.facts?.filter(item => /dom|layout|cssom|vdom|shadow/.test(item.channel)).length || 0;
  const latest = model.facts?.[0];
  return {
    health: high ? "Needs attention" : medium ? "Watch closely" : total ? "Stable enough" : "Seed baseline",
    healthDetail: total ? `${total} facts across ${channels} channels.` : "Seed benchmark sample; run live analysis for direct evidence.",
    change: latest ? readableChannel(latest.channel) : "Benchmark baseline",
    changeDetail: latest ? factSummary(latest.fact) : "No live structural facts in this seed sample.",
    pressure: pressureFacts > 20 ? "High" : pressureFacts > 5 ? "Moderate" : total ? "Low" : "Benchmark",
    pressureDetail: total ? `${pressureFacts} pressure signals and ${mutationFacts} structure signals.` : "Seed pressure is estimated from benchmark assumptions.",
    action: high ? "Inspect paid evidence" : medium ? "Review package scores" : "Compare ranking",
    actionDetail: "Normal ranking analysis is visible; paid packages unlock deeper evidence."
  };
}

function inferredPackageScore(model = {}, packageId) {
  const facts = model.facts || [];
  const channels = Object.keys(model.channels || {});
  const channelText = channels.join(" ").toLowerCase();
  const base = Math.min(.9, facts.length / 140);
  if (packageId === "devops") return base + (/runtime|behavior|frequency|diagnostics|timer|heartbeat/.test(channelText) ? .18 : .04);
  if (packageId === "security") return base + (/risk|protect|auth|captcha|challenge|malicious|fingerprint|webdriver/.test(channelText) ? .24 : .04);
  if (packageId === "performance") return base + (/performance|long-task|layout|resource|network|dependency|frame/.test(channelText) ? .22 : .05);
  if (packageId === "ai-governance") return base + (/wasm|worker|microtask|gpu|ai|model|inference/.test(channelText) ? .24 : .02);
  if (packageId === "analytics") return base + (/dom|mutation|resource|vdom|dependency|structure/.test(channelText) ? .18 : .05);
  if (packageId === "oem-platform") return base + Math.min(.28, Object.keys(model.channels || {}).length / 100);
  return base;
}

function mergeRankingSample(sample) {
  const normalized = normalizeRankingSample(sample);
  const existingIndex = rankingLedger.findIndex(item => item.id === normalized.id);
  if (existingIndex === -1) {
    rankingLedger = [normalized, ...rankingLedger].slice(0, 500);
    return;
  }
  const existing = rankingLedger[existingIndex];
  const sampleCount = (existing.sampleCount || 1) + (normalized.sampleCount || 1);
  const packageScores = {};
  for (const definition of PACKAGE_DEFINITIONS) {
    const oldScore = Number(existing.packageScores?.[definition.id]) || 0;
    const newScore = Number(normalized.packageScores?.[definition.id]) || 0;
    packageScores[definition.id] = clamp01(((oldScore * (existing.sampleCount || 1)) + newScore) / sampleCount);
  }
  const webV2Scores = {};
  for (const module of WEB_V2_MODULES) {
    const oldScore = Number(existing.webV2Scores?.[module.id]) || 0;
    const newScore = Number(normalized.webV2Scores?.[module.id]) || 0;
    webV2Scores[module.id] = clamp01(((oldScore * (existing.sampleCount || 1)) + newScore) / sampleCount);
  }
  rankingLedger[existingIndex] = {
    ...existing,
    ...normalized,
    packageScores,
    webV2Scores,
    overallScore: computeOverallRankingScore(packageScores, webV2Scores),
    confidence: Math.max(existing.confidence || 0, normalized.confidence || 0),
    sampleCount,
    evidence: { ...(existing.evidence || {}), ...(normalized.evidence || {}) },
    webV2Evidence: { ...(existing.webV2Evidence || {}), ...(normalized.webV2Evidence || {}) },
    normal: normalized.normal || existing.normal
  };
}

function rankWebsiteSamples(samples, boardId = "overall") {
  return [...samples]
    .map(normalizeRankingSample)
    .sort((left, right) => rankingScoreForBoard(right, boardId) - rankingScoreForBoard(left, boardId));
}

function rankingScoreForBoard(sample, boardId = "overall") {
  if (boardId === "overall") return clamp01(sample.overallScore ?? computeOverallRankingScore(sample.packageScores || {}, sample.webV2Scores || {}));
  if (WEB_V2_MODULES.some(module => module.id === boardId)) return clamp01(sample.webV2Scores?.[boardId] || 0);
  return clamp01(sample.packageScores?.[boardId] || 0);
}

function computeOverallRankingScore(scores = {}, webV2Scores = {}) {
  const weights = {
    devops: .16,
    security: .18,
    performance: .18,
    "ai-governance": .16,
    analytics: .16,
    "oem-platform": .16
  };
  const packageScore = Object.entries(weights).reduce((sum, [id, weight]) => sum + (Number(scores[id]) || 0) * weight, 0);
  const webV2Values = WEB_V2_MODULES.map(module => Number(webV2Scores[module.id]) || 0).filter(value => value > 0);
  const webV2Score = webV2Values.length ? webV2Values.reduce((sum, value) => sum + value, 0) / webV2Values.length : 0;
  return clamp01(webV2Values.length ? packageScore * .62 + webV2Score * .38 : packageScore);
}

function packageInsight(sample, packageId) {
  const score = rankingScoreForBoard(sample, packageId);
  if (score >= .75) return "Strong package signal. This website ranks highly for this SIG9 module.";
  if (score >= .5) return "Moderate package signal. There is enough evidence for comparison, but not enough for a top-tier score.";
  if (score > 0) return "Low package signal. The site is relatively quiet or the current sample lacks this evidence.";
  return "No package signal in this ranking sample.";
}

function webV2Insight(sample, moduleId) {
  const module = WEB_V2_MODULES.find(item => item.id === moduleId);
  const score = rankingScoreForBoard(sample, moduleId);
  if (!module) return "Unknown Web Version 2 module.";
  if (score >= .75) return `${module.marketName} is strongly represented in this sample.`;
  if (score >= .5) return `${module.marketName} is present with enough evidence for comparison.`;
  if (score > 0) return `${module.marketName} has a weak signal; collect more live facts before trusting it.`;
  return `${module.marketName} has no direct signal in this sample yet.`;
}

function rankingSeedSample(host, category, packageScores, evidence = []) {
  const normalizedScores = normalizeCommercialScoreMap(packageScores);
  const webV2Analysis = synthesizeWebV2ScoresFromPackages(normalizedScores, evidence);
  return {
    id: normalizeRankingId(host),
    host,
    url: `https://${host}/`,
    category,
    sourceLabel: "Benchmark seed",
    sourceKind: "seed-benchmark",
    sampleCount: 1,
    confidence: .42,
    packageScores: normalizedScores,
    webV2Scores: webV2Analysis.scores,
    overallScore: computeOverallRankingScore(normalizedScores, webV2Analysis.scores),
    evidence: Object.fromEntries(PACKAGE_DEFINITIONS.map(definition => [definition.id, evidence])),
    webV2Evidence: webV2Analysis.evidence,
    normal: {
      health: "Benchmark baseline",
      healthDetail: `${host} is included as seed data for ranking UX and comparison workflows.`,
      change: "Seed sample",
      changeDetail: "Run live analysis to replace this baseline with collected runtime facts.",
      pressure: "Benchmark",
      pressureDetail: "Pressure is estimated until live samples are collected.",
      action: "Collect live sample",
      actionDetail: "Use Analyze on the dashboard to add measured evidence."
    },
    lastAnalyzedAt: new Date(0).toISOString()
  };
}

function normalizeCommercialScoreMap(scores = {}) {
  const next = {};
  for (const definition of PACKAGE_DEFINITIONS) next[definition.id] = clamp01(scores[definition.id] || 0);
  if (!Object.values(next).some(Boolean)) {
    next.devops = clamp01(((scores["update-radar"] || 0) + (scores["performance-spectrum"] || 0)) / 2);
    next.security = clamp01(((scores["structure-monitor"] || 0) + (scores["risk-score-engine"] || 0)) / 2);
    next.performance = clamp01(scores["performance-spectrum"] || 0);
    next["ai-governance"] = clamp01(((scores["ai-activity-detector"] || 0) + (scores["risk-score-engine"] || 0)) / 2);
    next.analytics = clamp01(((scores["update-radar"] || 0) + (scores["structure-monitor"] || 0)) / 2);
    next["oem-platform"] = computeOverallRankingScore(next);
  }
  return next;
}

function normalizeRankingSample(sample = {}) {
  const packageScores = normalizeCommercialScoreMap(sample.packageScores || {});
  const synthesized = synthesizeWebV2ScoresFromPackages(packageScores, []);
  const webV2Scores = {};
  for (const module of WEB_V2_MODULES) webV2Scores[module.id] = clamp01(sample.webV2Scores?.[module.id] ?? synthesized.scores[module.id] ?? 0);
  return {
    ...sample,
    id: normalizeRankingId(sample.host || sample.id),
    packageScores,
    webV2Scores,
    webV2Evidence: sample.webV2Evidence || synthesized.evidence,
    overallScore: computeOverallRankingScore(packageScores, webV2Scores)
  };
}

function buildWebV2AnalysisFromModel(model = {}, packageScores = {}) {
  const summary = model.runtimeEventSummary || summarizeRuntimeEvents(model.facts || []);
  const lookup = Object.fromEntries(summary.categories.map(category => [category.name, category]));
  const total = Math.max(1, summary.totalFacts || (model.facts || []).length || 0);
  const scores = {};
  const evidence = {};
  for (const module of WEB_V2_MODULES) {
    const eventCount = module.runtimeEvents.reduce((sum, name) => sum + (lookup[name]?.count || 0), 0);
    const activeEvents = module.runtimeEvents.filter(name => (lookup[name]?.count || 0) > 0).length;
    const eventDensity = Math.min(1, eventCount / Math.max(8, total * .45));
    const eventCoverage = activeEvents / Math.max(1, module.runtimeEvents.length);
    const packagePull = relatedPackageScoreForWebV2(module.id, packageScores);
    scores[module.id] = clamp01(eventDensity * .5 + eventCoverage * .3 + packagePull * .2);
    evidence[module.id] = module.runtimeEvents.map(name => `${name}: ${lookup[name]?.count || 0}`).concat(module.metrics.slice(0, 2));
  }
  return { scores, evidence };
}

function synthesizeWebV2ScoresFromPackages(packageScores = {}, evidence = []) {
  const scores = {};
  const v = id => Number(packageScores[id]) || 0;
  const formulas = {
    "web-activity-intelligence": () => v("devops") * .45 + v("analytics") * .35 + v("performance") * .2,
    "web-rhythm-engine": () => v("performance") * .55 + v("devops") * .3 + v("oem-platform") * .15,
    "web-dependency-graph": () => v("performance") * .4 + v("analytics") * .3 + v("oem-platform") * .3,
    "web-risk-surface": () => v("security") * .5 + v("ai-governance") * .25 + v("oem-platform") * .25,
    "web-flow-map": () => v("analytics") * .35 + v("devops") * .25 + v("performance") * .25 + v("oem-platform") * .15,
    "web-time-dynamics": () => v("devops") * .4 + v("performance") * .35 + v("oem-platform") * .25,
    "web-influence-map": () => v("security") * .3 + v("analytics") * .3 + v("ai-governance") * .25 + v("oem-platform") * .15,
    "web-state-evolution": () => v("analytics") * .4 + v("devops") * .25 + v("security") * .2 + v("oem-platform") * .15,
    "web-signal-compression": () => v("ai-governance") * .4 + v("security") * .25 + v("analytics") * .2 + v("oem-platform") * .15
  };
  for (const module of WEB_V2_MODULES) scores[module.id] = clamp01(formulas[module.id]?.() || 0);
  const evidenceMap = Object.fromEntries(WEB_V2_MODULES.map(module => [module.id, evidence.length ? evidence : module.runtimeEvents]));
  return { scores, evidence: evidenceMap };
}

function relatedPackageScoreForWebV2(moduleId, packageScores = {}) {
  return synthesizeWebV2ScoresFromPackages(packageScores, []).scores[moduleId] || 0;
}

function loadRankingLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem("SIG9RankingLedger") || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed.slice(0, 500) : BENCHMARK_SEED_RANKINGS.map(sample => ({ ...sample }));
  } catch {
    return BENCHMARK_SEED_RANKINGS.map(sample => ({ ...sample }));
  }
}

function saveRankingLedger() {
  localStorage.setItem("SIG9RankingLedger", JSON.stringify(rankingLedger.slice(0, 500)));
}

function normalizeRankingId(value) {
  return String(value || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[^a-z0-9.-]/g, "-") || "unknown-site";
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function packageDefinitionsWithRuntimeData(suite = {}) {
  const runtimePackages = new Map((suite?.packages || []).map(item => [normalizePlanId(item.id || item.slug || item.name), item]));
  const legacyPackages = new Map((suite?.packages || []).map(item => [String(item.id || item.slug || item.name || "").toLowerCase(), item]));
  return PACKAGE_DEFINITIONS.map(definition => {
    const runtime = runtimePackages.get(definition.id) || legacyRuntimePackageFor(definition.id, legacyPackages);
    return { ...definition, ...runtime, id: definition.id, name: definition.name, code: definition.code, runtimeEvents: PACKAGE_RUNTIME_EVENT_MAP[definition.name] || [] };
  });
}

function legacyRuntimePackageFor(packageId, legacyPackages) {
  const groups = {
    devops: ["update-radar", "performance-spectrum"],
    security: ["structure-monitor", "risk-score-engine"],
    performance: ["performance-spectrum"],
    "ai-governance": ["ai-activity-detector", "risk-score-engine"],
    analytics: ["update-radar", "structure-monitor"],
    "oem-platform": ["structure-monitor", "performance-spectrum", "update-radar", "risk-score-engine", "ai-activity-detector"]
  };
  const matches = (groups[packageId] || []).map(id => legacyPackages.get(id)).filter(Boolean);
  if (!matches.length) return {};
  const score = matches.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / matches.length;
  return {
    score,
    status: matches.some(item => item.status === "high" || item.status === "active") ? "active" : matches[0].status,
    evidenceCount: matches.reduce((sum, item) => sum + (Number(item.evidenceCount) || item.evidence?.length || 0), 0),
    evidence: matches.flatMap(item => item.evidence || []).slice(0, 12),
    explanation: matches.map(item => item.explanation || item.coreValue || "").filter(Boolean).slice(0, 2).join(" ")
  };
}

function hasPackageAccess(packageId) {
  const moduleId = normalizeModuleId(packageId);
  const entitlements = entitlementState || accountState.entitlements || {};
  return Boolean(accountState.email && moduleId && ((entitlements.modules || []).includes(moduleId) || entitlements.plan === "enterprise"));
}

function selectModule(packageId) {
  const normalized = normalizePlanId(packageId);
  if (!normalized) return;
  activeModule = normalized;
  localStorage.setItem("runtimeDiagnosticsActiveModule", activeModule);
  renderModulePages(snapshot || buildSnapshot({}));
}

function renderModulePages(model) {
  if (!elements.moduleTabs || !elements.moduleDetail) return;
  const state = model?.organFrequencySpectrum?.state || model?.generatedFrequencySpectrum || buildFrequencySpectrumFromFacts(model?.facts || []);
  const suite = state?.commercialPackages || state?.products?.commercialPackages || buildCommercialPackageSuiteFromState(state);
  const packages = packageDefinitionsWithRuntimeData(suite);
  if (!normalizePlanId(activeModule)) activeModule = packages[0]?.id || "performance";
  const selected = packages.find(item => item.id === activeModule) || packages[0];
  elements.moduleTabs.innerHTML = packages.map(item => {
    const unlocked = hasPackageAccess(item.id);
    return `
      <button class="module-tab ${item.id === selected.id ? "active" : ""} ${unlocked ? "unlocked" : "locked"}" type="button" role="tab" data-module="${escapeHtml(item.id)}" aria-selected="${item.id === selected.id}" aria-label="${escapeHtml(`${item.name} ${unlocked ? "unlocked" : "locked"}`)}">
        <span>Package ${escapeHtml(item.code)}</span>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${unlocked ? "Unlocked" : "Locked"}</small>
      </button>
    `;
  }).join("");
  if (!selected) {
    elements.moduleDetail.innerHTML = `<div class="empty">No package modules are configured.</div>`;
    return;
  }
  const unlocked = hasPackageAccess(selected.id);
  const evidence = unlocked ? (selected.evidence || []).slice(0, 6) : [];
  elements.moduleDetail.innerHTML = `
    <div class="module-hero ${unlocked ? "unlocked" : "locked"}">
      <div>
        <p class="eyebrow">Package ${escapeHtml(selected.code)} - ${unlocked ? "Unlocked" : "Locked"}</p>
        <h2>${escapeHtml(selected.name)}</h2>
        <p>${escapeHtml(selected.promise || selected.coreValue || "")}</p>
      </div>
      <div class="module-access-badge">
        <span>${unlocked ? "Active package" : "Payment required"}</span>
        <strong>${unlocked ? "Live module" : "Locked"}</strong>
      </div>
    </div>
    <div class="module-business-row">
      <article>
        <span>Industry</span>
        <strong>${escapeHtml(selected.industry)}</strong>
      </article>
      <article>
        <span>Pricing</span>
        <strong>${escapeHtml(selected.pricing)}</strong>
      </article>
      <article>
        <span>Runtime score</span>
        <strong>${unlocked ? formatScore(selected.score) : "Locked"}</strong>
      </article>
    </div>
    <div class="module-grid">
      <article>
        <span>What this unlocks</span>
        <p>${escapeHtml(selected.unlockCopy || selected.explanation || "")}</p>
        <ul>${(selected.capabilities || []).map(capability => `<li>${escapeHtml(capability)}</li>`).join("")}</ul>
      </article>
      <article>
        <span>Module metrics</span>
        <ul>${(selected.metrics || []).map(metric => `<li>${escapeHtml(metric)}</li>`).join("")}</ul>
        <div class="event-tags">${(selected.runtimeEvents || []).map(name => `<code>${escapeHtml(name)}</code>`).join("")}</div>
      </article>
      <article class="${unlocked ? "" : "locked-preview"}">
        <span>Live evidence</span>
        ${unlocked
          ? `<div class="package-evidence">${evidence.map(item => `<code>${escapeHtml(item)}</code>`).join("") || "<code>No direct evidence yet</code>"}</div>`
          : `<p>This package page is intentionally locked. Select ${escapeHtml(selected.name)} on the Plans page to expose live evidence and scoring.</p>`}
      </article>
    </div>
    <div class="module-actions">
      <button type="button" data-module-action="${escapeHtml(selected.id)}" data-action-kind="${unlocked ? "open-module" : "view-plans"}">${unlocked ? "Refresh module evidence" : "Unlock on Plans"}</button>
      <button class="secondary" type="button" data-module-action="dashboard" data-action-kind="open-dashboard">Return to Dashboard</button>
    </div>
  `;
  elements.moduleDetail.querySelectorAll("[data-module-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.actionKind === "open-dashboard") applyAppView("dashboard");
      else if (button.dataset.actionKind === "view-plans") {
        activeModule = normalizePlanId(button.dataset.moduleAction) || activeModule;
        localStorage.setItem("runtimeDiagnosticsActiveModule", activeModule);
        applyAppView("plans");
      } else renderModulePages(snapshot || buildSnapshot({}));
    });
  });
}

function buildCommercialPackageSuiteFromState(state) {
  if (!window.TicketSniperOrganFrequency?.buildCommercialPackageSuite) return null;
  return window.TicketSniperOrganFrequency.buildCommercialPackageSuite(state?.nodes || [], state?.edges || [], state?.spectra, state?.closure);
}

function buildFrequencySpectrumFromFacts(facts = []) {
  if (!window.TicketSniperOrganFrequency?.OrganFrequencySpectrumEngine) return null;
  const engine = new window.TicketSniperOrganFrequency.OrganFrequencySpectrumEngine({}, {
    windowMs: Number(normalizeFrequencyWindow(elements.frequencyWindow?.value || localStorage.getItem("runtimeDiagnosticsFrequencyWindowMs") || "100"))
  });
  engine.ingestMany([...facts].reverse().map(item => item.fact || item), { source: "runtime-diagnostics-ui" });
  return engine.snapshot();
}

function renderStructureEngine(model) {
  const state = model.organPipeline?.state || model.generatedOrganState || buildOrganStateFromFacts(model.facts);
  const engine = state?.structureEngine;
  if (!engine) {
    elements.structureSignature.textContent = "No signature";
    elements.structureEngine.innerHTML = `<div class="empty">Collect runtime facts to build SIG9, Frequency4, Closure, Hexagram, Signature, reconstruction, and prediction.</div>`;
    return;
  }
  const signature = engine.signature || {};
  elements.structureSignature.textContent = signature.finalSignature || "Unsigned";
  const frequency = engine.frequency4 || {};
  const closure = engine.closure || {};
  const cards = [
    {
      name: "SIG9",
      category: "runtime",
      detail: Object.entries(engine.SIG9 || {}).map(([organ, value]) => `${organ}:${formatScore(value.level)}/${formatScore(value.stability)}`).join("  ")
    },
    {
      name: "Frequency4",
      category: "network",
      detail: Object.entries(frequency).map(([name, layer]) => `${name} value ${formatScore(layer.value)}, trend ${formatScore(layer.trend)}, volatility ${formatScore(layer.volatility)}`).join(" | ")
    },
    {
      name: `Hexagram ${signature.hexagram?.lines?.join("") || engine.hexagram?.lines?.join("") || "------"}`,
      category: "storage",
      detail: `Closure fingerprint ${closure.fingerprint?.hash || "none"}; topology connectivity ${formatScore(closure.topology?.connectivity)}; depth ${formatScore(closure.topology?.depth)}.`
    },
    {
      name: "Closure Signature",
      category: "security",
      detail: `Stability ${formatScore(signature.stability)}, volatility ${formatScore(signature.volatility)}, topology ${signature.topologyCode || "none"}. Verification ${engine.verification?.ok ? "passed" : "failed"}.`
    },
    {
      name: "Signature Distance",
      category: "storage",
      detail: `Hexagram ${engine.comparison?.hexagramDiff ?? 0}, transitions ${engine.comparison?.transitionDiff ?? 0}, topology ${engine.comparison?.topologyDiff ?? 0}, total ${formatScore(engine.comparison?.total)}.`
    },
    {
      name: "Sovereignty",
      category: "security",
      detail: `Chain tip ${engine.sovereignty?.chain?.tip || "none"}; sovereign signature ${engine.sovereignty?.sovereignSignature?.finalSignature || "none"}.`
    },
    {
      name: "Reconstruction",
      category: "runtime",
      detail: `${engine.reconstruction?.events?.length || 0} historical transition hints; estimated fact sequence ${engine.reconstruction?.factSequenceEstimate || 0}.`
    },
    {
      name: "Prediction",
      category: "network",
      detail: Object.entries(engine.prediction?.next || {}).map(([name, value]) => `${name}:${value.risk}/${formatScore(value.expectedValue)}`).join(" | ")
    }
  ];
  elements.structureEngine.innerHTML = cards.map(card => `
    <article class="profile-card ${escapeHtml(card.category)}">
      <strong>${escapeHtml(card.name)}</strong>
      <p>${escapeHtml(card.detail || "No data yet.")}</p>
    </article>
  `).join("");
}

function renderOrganPanel(organ, graph = {}, block = null, definition = {}) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const components = block?.components || [];
  const recentTypes = [...new Set(nodes.slice(-5).map(node => node.fact_type))];
  return `
    <article class="organ-card" data-organ="${escapeHtml(organ)}">
      <header>
        <div>
          <h3>${escapeHtml(organ)}</h3>
          <p>${escapeHtml(definition?.boundary || "")}</p>
        </div>
        <span>${nodes.length}/${edges.length}</span>
      </header>
      <div class="organ-spark" aria-label="${escapeHtml(organ)} waveform">${renderSparkline(nodes)}</div>
      <div class="organ-components">
        ${components.map(component => renderOrganComponent(component, nodes, edges)).join("")}
      </div>
      <p class="organ-types">${recentTypes.length ? recentTypes.map(type => `<code>${escapeHtml(type)}</code>`).join(" ") : "No dispatched facts yet."}</p>
    </article>
  `;
}

function renderOrganComponent(component, nodes, edges) {
  const count = component.data?.nodes?.length ?? nodes.length;
  const edgeCount = component.data?.edges?.length ?? edges.length;
  const typeClass = String(component.type || "indicator").replace(/\s+/g, "-");
  return `
    <div class="organ-component ${escapeHtml(typeClass)}">
      <strong>${escapeHtml(component.label || component.type)}</strong>
      <span>${escapeHtml(component.type)}</span>
      <small>${count} nodes / ${edgeCount} edges</small>
    </div>
  `;
}

function renderSparkline(nodes) {
  const buckets = new Array(12).fill(0);
  if (!nodes.length) return buckets.map(() => `<i style="height:2px"></i>`).join("");
  const times = nodes.map(node => Number(node.timestamp) || 0);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = Math.max(1, max - min);
  for (const time of times) {
    const index = Math.min(11, Math.floor(((time - min) / span) * 12));
    buckets[index] += 1;
  }
  const peak = Math.max(1, ...buckets);
  return buckets.map(value => `<i style="height:${Math.max(2, Math.round((value / peak) * 34))}px"></i>`).join("");
}

function buildOrganStateFromFacts(facts) {
  if (!window.TicketSniperOrganPipeline) return {};
  const builder = new window.TicketSniperOrganPipeline.OrganGraphBuilder();
  for (const item of [...facts].reverse()) {
    if (isObserverLocalFact(item.fact)) continue;
    builder.process(item.fact, { page: item.fact?.context || {}, source: "target-page-runtime" });
  }
  return builder.snapshot();
}

function isObserverLocalFact(fact = {}) {
  const source = String(fact.source || "").toLowerCase();
  const type = String(fact.type || "").toLowerCase();
  const value = fact.value || {};
  const metadata = fact.metadata || {};
  if (metadata.observerLocal || value.observerLocal) return true;
  return source === "interaction" || /pointer|mousemove|mouseenter|mouseleave|keydown|keyup|keypress|click|tap|touch/.test(type);
}

function readableChannel(channel = "") {
  if (channel.startsWith("network/")) return "Network or resource activity";
  if (channel.startsWith("dom/")) return "Page structure changed";
  if (channel.startsWith("runtime/")) return "Runtime behavior changed";
  if (channel.startsWith("performance/")) return "Performance pressure changed";
  if (channel.startsWith("storage/")) return "Client storage changed";
  if (channel.startsWith("anti_crawler/")) return "Access protection signal";
  if (channel.startsWith("crawler/")) return "Structural cadence signal";
  return channel || "Runtime signal";
}

function renderFacts() {
  if (!snapshot) return;
  const filter = elements.channelFilter.value;
  const rows = snapshot.facts.filter(item => !filter || item.channel === filter).slice(0, 160);
  elements.factTable.innerHTML = rows.length ? rows.map(item => `
    <tr>
      <td>${item.time ? escapeHtml(new Date(item.time).toLocaleString()) : "Unknown"}</td>
      <td>${escapeHtml(item.channel)}</td>
      <td><span class="pill ${escapeHtml(item.severity)}">${escapeHtml(item.severity)}</span></td>
      <td>${escapeHtml(factSummary(item.fact))}</td>
    </tr>
  `).join("") : `<tr><td colspan="4" class="empty">No facts match this channel.</td></tr>`;
}

function inferTechnologySignals(items) {
  const signals = new Map();
  const add = (name, category, detail) => signals.set(`${category}:${name}`, { name, category, detail });
  for (const { fact, channel } of items) {
    const value = fact.value || {};
    const metadata = fact.metadata || {};
    const text = `${JSON.stringify(value)} ${JSON.stringify(metadata)} ${channel}`.toLowerCase();
    if (/cloudflare|turnstile|cf-/.test(text)) add("Cloudflare / Turnstile", "security", "Bot protection, challenge, CDN, or security header/resource signal observed.");
    if (/akamai|_abck|bm_sz|ak-/.test(text)) add("Akamai Bot Manager", "security", "Akamai anti-bot or edge protection markers were observed.");
    if (/perimeterx|px-captcha|\/_px/.test(text)) add("PerimeterX", "security", "PerimeterX challenge, script, storage, or request pattern observed.");
    if (/datadome|dd_cid/.test(text)) add("DataDome", "security", "DataDome protection marker observed.");
    if (/imperva|incapsula|visid_incap/.test(text)) add("Imperva / Incapsula", "security", "Imperva protection marker observed.");
    if (/recaptcha|google-recaptcha/.test(text)) add("Google reCAPTCHA", "security", "CAPTCHA frame, resource, or provider marker observed.");
    if (/hcaptcha/.test(text)) add("hCaptcha", "security", "hCaptcha frame, resource, or provider marker observed.");
    if (channel.startsWith("network/")) add("Browser network APIs", "network", "Fetch, XHR, sendBeacon, WebSocket, image, script, or resource timing activity was observed.");
    if (channel.startsWith("storage/")) add("Client-side storage", "storage", "Local/session/cookie storage or IndexedDB structure changed. Values are redacted.");
    if (channel === "runtime/navigation") add("Single-page navigation", "runtime", "History API or URL-change behavior was observed.");
    if (channel === "runtime/console") add("Console instrumentation", "runtime", "Console output was observed as a runtime signal.");
    if (channel === "performance/long-task") add("Main-thread pressure", "runtime", "Long task timing indicates the portal became slow or blocked the UI thread.");
    if (channel.startsWith("dom/")) add("Dynamic DOM application", "runtime", "The portal mutates DOM structure after load; selector/path facts are available.");
    if (/service-worker/.test(text)) add("Service worker", "runtime", "A service-worker registration or marker was observed.");
    if (/wasm|webassembly/.test(text)) add("WebAssembly", "runtime", "WebAssembly compile or instantiate activity was observed.");
  }
  return [...signals.values()].sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name));
}

async function openPortalUrl() {
  if (!hasExtensionRuntime) return analyzeStandaloneUrl();
  const value = elements.portalUrl.value.trim();
  if (!value) return;
  let url;
  try { url = new URL(value); } catch { return setPortalHelp("Enter a complete HTTP or HTTPS URL."); }
  if (url.protocol !== "https:" && url.protocol !== "http:") return setPortalHelp("Diagnostics collection supports HTTP and HTTPS websites.");
  const response = await chrome.runtime.sendMessage({ type: "SET_RUNTIME_DIAGNOSTICS_TARGET", payload: { url: url.href } });
  if (!response?.ok) return setPortalHelp(response?.error || "Unable to set diagnostics target.");
  setPortalHelp(diagnosticsEnabled ? `Monitoring ${response.target?.host || url.hostname} every second. You can stay on this diagnostics page.` : "Target saved, but diagnostics is currently off.");
  await captureRuntimeTarget();
  await refresh();
  setTimeout(() => {
    captureRuntimeTarget().then(refresh).catch(() => {});
  }, 1200);
}

async function loadRuntimeTarget() {
  if (!hasExtensionRuntime) return loadStandaloneTarget();
  const { runtimeDiagnosticsTarget, lastRuntimeInspectableTab } = await chrome.storage.local.get(["runtimeDiagnosticsTarget", "lastRuntimeInspectableTab"]);
  const target = runtimeDiagnosticsTarget || lastRuntimeInspectableTab;
  if (target?.url) {
    elements.portalUrl.value = target.url;
    setPortalHelp(`Monitoring target: ${target.host || target.url}. Data is sampled every second while this page is open.`);
  }
}

async function captureRuntimeTarget() {
  if (!hasExtensionRuntime) return;
  if (!diagnosticsEnabled || captureInFlight) return;
  captureInFlight = true;
  try {
    const value = elements.portalUrl.value.trim();
    const payload = { reason: "diagnostics_page_tick" };
    if (value) payload.url = value;
    const response = await chrome.runtime.sendMessage({ type: "ENSURE_RUNTIME_DIAGNOSTICS_TARGET", payload }).catch(error => ({ ok: false, error: error.message }));
    if (response?.ok && response.target) {
      lastCaptureErrorStatus = "";
      elements.latestHost.textContent = response.target.host || response.target.url || "Diagnostics target";
      if (!snapshot?.latest?.checkedAt) elements.latestTime.textContent = `Sampling ${new Date().toLocaleTimeString()}`;
    } else if (response?.status === "collector_unavailable") {
      setCaptureHelp("collector_unavailable", "Target tab exists, but the collector is not attached yet. Reload that website tab once, then keep this diagnostics page open.");
    } else if (response?.status === "target_not_open") {
      setCaptureHelp("target_not_open", "The target website tab is not open. Open it once, then diagnostics will keep sampling that same tab every second.");
    } else if (response?.status === "no_target") {
      setCaptureHelp("no_target", "Enter a website URL or visit a website tab once; diagnostics will sample that target every second.");
    }
  } finally {
    captureInFlight = false;
  }
}

function setCaptureHelp(status, message) {
  const now = Date.now();
  if (lastCaptureErrorStatus === status && now - lastCaptureErrorAt < 5000) return;
  lastCaptureErrorStatus = status;
  lastCaptureErrorAt = now;
  setPortalHelp(message);
}

async function focusLatestTab() {
  if (!hasExtensionRuntime) {
    setPortalHelp("Focus target is available in the browser-extension runtime. Standalone mode keeps analysis inside this page.");
    return;
  }
  const tabs = await chrome.tabs.query({});
  const latestTabId = snapshot?.latest?.tabId;
  const target = latestTabId ? tabs.find(tab => tab.id === latestTabId) : tabs.find(tab => tab.url && isInspectableUrl(tab.url));
  if (!target) return setPortalHelp("No inspected HTTP or HTTPS tab is currently open.");
  await chrome.windows.update(target.windowId, { focused: true });
  await chrome.tabs.update(target.id, { active: true });
}

async function exportJson() {
  if (!hasExtensionRuntime) return exportStandaloneJson();
  try {
    const data = await chrome.storage.local.get([
      "runtimeFactChannels",
      "runtimeFactHistory",
      "runtimeFactStatus",
      "crawlerSignalHistory",
      "crawlerSignalStatus",
      "structuralPipelineState",
      "structuralPipelineLatest",
      "normalizedFactHistory",
      "structuralEventHistory",
      "featureVectorHistory",
      "scoreResultHistory",
      "updateClassificationHistory",
      "organPipelineState",
      "organPipelineLatest",
      "organAssignmentHistory",
      "organRenderBlockHistory",
      "organPipelineErrorHistory",
      "organFrequencySpectrumState",
      "organFrequencySpectrumLatest"
    ]);
    const exportSnapshot = snapshot || buildSnapshot(data);
    const mappingReport = buildFactMappingDebugReport(exportSnapshot);
    downloadJson(scrubExportValue({
      exportedAt: new Date().toISOString(),
      kind: "runtime-diagnostics",
      rawFactMapping: mappingReport,
      webVersion2: {
        modules: WEB_V2_MODULES,
        runtimeEventCategories: RUNTIME_EVENT_CATEGORIES,
        uiRuntimeEventMap: UI_RUNTIME_EVENT_MAP,
        runtimeEventToSig9Organs: RUNTIME_EVENT_TO_SIG9_ORGANS,
        packageRuntimeEventMap: PACKAGE_RUNTIME_EVENT_MAP
      },
      diagnostics: data
    }), "runtime-diagnostics");
    setExportStatus("Runtime diagnostics JSON exported.", "success");
  } catch (error) {
    setExportStatus(`Export failed: ${error.message || String(error)}`, "error");
  }
}

async function exportAllJson() {
  if (!hasExtensionRuntime) return exportStandaloneJson();
  try {
    const [local, sync, session, tabs] = await Promise.all([
      chrome.storage.local.get(null),
      chrome.storage.sync.get(null),
      chrome.storage.session ? chrome.storage.session.get(null).catch(() => ({})) : Promise.resolve({}),
      chrome.tabs.query({}).catch(() => [])
    ]);
    const manifest = chrome.runtime.getManifest();
    const payload = scrubExportValue({
      exportedAt: new Date().toISOString(),
      kind: "ticket-sniper-extension-full-export",
      extension: {
        id: chrome.runtime.id,
        name: manifest.name,
        version: manifest.version,
        manifestVersion: manifest.manifest_version
      },
      diagnosticsSnapshot: snapshot ? summarizeSnapshotForExport(snapshot) : null,
      openInspectableTabs: tabs.filter(tab => isInspectableUrl(tab.url || "")).map(sanitizeExportTab),
      storage: { local, sync, session }
    });
    downloadJson(payload, "ticket-sniper-extension-all");
    setExportStatus("Full extension JSON exported with sensitive fields redacted.", "success");
  } catch (error) {
    setExportStatus(`Full export failed: ${error.message || String(error)}`, "error");
  }
}

function downloadJson(data, prefix) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function scrubExportValue(value) {
  if (Array.isArray(value)) return value.map(scrubExportValue);
  if (!value || typeof value !== "object") return typeof value === "string" ? scrubExportString(value) : value;
  return Object.fromEntries(Object.entries(value).map(([key, raw]) => {
    if (/token|secret|password|authorization|credential|cookie|session/i.test(key)) return [key, "[redacted]"];
    return [key, scrubExportValue(raw)];
  }));
}

function scrubExportString(value) {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:\d[ -]?){9,}\b/g, "[number]")
    .slice(0, 400);
}

function summarizeSnapshotForExport(model) {
  const channels = {};
  for (const [channel, items] of Object.entries(model.channels || {})) channels[channel] = (items || []).length;
  const severities = model.facts.reduce((counts, item) => {
    counts[item.severity] = (counts[item.severity] || 0) + 1;
    return counts;
  }, {});
  return {
    totalFacts: model.facts.length,
    channels,
    severities,
    latest: model.latest ? scrubExportValue(model.latest) : null,
    rawFactMapping: scrubExportValue(buildFactMappingDebugReport(model)),
    structuralPipeline: scrubExportValue(model.pipeline || {}),
    organPipeline: scrubExportValue(model.organPipeline || {}),
    organFrequencySpectrum: scrubExportValue(model.organFrequencySpectrum || {}),
    webVersion2: scrubExportValue({
      runtimeEventSummary: model.runtimeEventSummary || summarizeRuntimeEvents(model.facts || []),
      modules: WEB_V2_MODULES,
      uiRuntimeEventMap: UI_RUNTIME_EVENT_MAP,
      packageRuntimeEventMap: PACKAGE_RUNTIME_EVENT_MAP
    })
  };
}

function sanitizeExportTab(tab) {
  return scrubExportValue({
    id: tab.id,
    windowId: tab.windowId,
    active: tab.active,
    audible: tab.audible,
    discarded: tab.discarded,
    status: tab.status,
    title: tab.title || "",
    url: sanitizeExportUrl(tab.url || "")
  });
}

function sanitizeExportUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

function setExportStatus(message, state = "") {
  elements.exportStatus.textContent = message;
  elements.exportStatus.classList.toggle("success", state === "success");
  elements.exportStatus.classList.toggle("error", state === "error");
}

async function clearDiagnostics() {
  if (!hasExtensionRuntime) return clearStandaloneDiagnostics();
  await chrome.storage.local.remove([
    "runtimeFactChannels",
    "runtimeFactHistory",
    "runtimeFactStatus",
    "runtimeFactLedger",
    "crawlerSignalHistory",
    "crawlerSignalStatus",
    "crawlerSignalLedger",
    "structuralPipelineState",
    "structuralPipelineLatest",
    "normalizedFactHistory",
    "structuralEventHistory",
    "featureVectorHistory",
    "scoreResultHistory",
    "updateClassificationHistory",
    "organPipelineState",
    "organPipelineLatest",
    "organAssignmentHistory",
    "organRenderBlockHistory",
    "organPipelineErrorHistory",
    "organFrequencySpectrumState",
    "organFrequencySpectrumLatest"
  ]);
  await refresh();
}

function setPortalHelp(message) {
  document.getElementById("portal-help").textContent = message;
}

function factSeverity(fact) {
  const severity = fact?.value?.severity;
  if (["high", "medium", "low", "info"].includes(severity)) return severity === "info" ? "low" : severity;
  if (["script-error", "unhandled-rejection"].includes(fact?.type)) return "high";
  if (fact?.source === "anti_crawler" && fact?.type === "challenge") return "high";
  if (fact?.source === "anti_crawler") return "medium";
  return "low";
}

function factSummary(fact) {
  const value = fact?.value || {};
  if (fact?.source === "network") return `${value.kind || fact.type || "network"} ${value.method || ""} ${value.url || ""} ${value.status ? `status ${value.status}` : ""}`.trim();
  if (fact?.source === "storage") return `${fact.type}: ${value.area || value.op || "redacted storage structure"}`;
  if (fact?.source === "runtime") return `${fact.type}: ${value.level || value.kind || value.state || value.message || "runtime signal"}`;
  if (fact?.source === "anti_crawler") return `${value.provider || "Unknown provider"} ${value.kind || value.technique || value.reason || fact.type}`;
  if (fact?.source === "crawler") return `${value.pattern || value.signal || fact.type}`;
  if (fact?.source === "dom") return `${fact.type}: ${value.tag || value.added || value.count || "structure"}`;
  return `${fact?.source || "unknown"}/${fact?.type || "fact"}`;
}

function isInspectableUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function formatScore(value) {
  return typeof value === "number" ? value.toFixed(3) : "no score";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}
