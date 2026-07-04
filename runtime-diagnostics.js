const elements = {
  toggleDiagnostics: document.getElementById("toggle-diagnostics"),
  refresh: document.getElementById("refresh"),
  exportJson: document.getElementById("export-json"),
  exportAllJson: document.getElementById("export-all-json"),
  clear: document.getElementById("clear"),
  navHome: document.getElementById("nav-home"),
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
let activeModule = normalizePlanId(localStorage.getItem("runtimeDiagnosticsActiveModule")) || "performance-spectrum";
let activeRankingBoard = localStorage.getItem("runtimeDiagnosticsRankingBoard") || "overall";
let rankingLedger = [];
let rankingCrawlerStatus = null;
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
    id: "structure-monitor",
    code: "A",
    name: "Structure Monitor",
    pricing: "Enterprise / High-tier",
    industry: "Security, government, finance, enterprise SOC",
    promise: "Real-time structural visibility and behavioral frequency fingerprinting.",
    unlockCopy: "Unlock topology, dependency, iframe, worker, accessibility, and malicious-frequency evidence.",
    metrics: ["Topology coverage", "Dependency chain depth", "Malicious fingerprint pressure"],
    capabilities: ["Structural topology", "Behavior flow", "Dependency chains", "Shadow DOM / VDOM / accessibility topology", "Malicious frequency fingerprints"]
  },
  {
    id: "performance-spectrum",
    code: "B",
    name: "Performance Spectrum",
    pricing: "Upper-mid tier",
    industry: "E-commerce, SaaS, gaming, large websites",
    promise: "Real-time performance frequency graph for browser rhythm and pressure.",
    unlockCopy: "Unlock frame, layout, paint, longtask, JS, network, style storm, and risk-wave analysis.",
    metrics: ["Runtime rhythm", "Longtask pressure", "Layout and style storms"],
    capabilities: ["Frame frequency", "Layout frequency", "Paint frequency", "Longtask frequency", "Performance rhythm graph"]
  },
  {
    id: "update-radar",
    code: "C",
    name: "Update Radar",
    pricing: "Mid-tier",
    industry: "Investment, competitive intelligence, SEO, market analysis",
    promise: "Real-time update frequency tracking for visible product and site changes.",
    unlockCopy: "Unlock DOM, VDOM, CSSOM, resource cadence, update intensity, and structural change waveforms.",
    metrics: ["Update cadence", "Change intensity", "Structural deltas"],
    capabilities: ["DOM update frequency", "VDOM update frequency", "CSSOM update frequency", "Resource update frequency", "Change waveforms"]
  },
  {
    id: "risk-score-engine",
    code: "D",
    name: "Risk Score Engine",
    pricing: "Enterprise / High-tier",
    industry: "Banking, finance, government, enterprise security",
    promise: "Executive risk scoring based on frequency deviation.",
    unlockCopy: "Unlock behavioral, resource, JS, network, GPU jitter, and risk-trend scoring.",
    metrics: ["Risk score", "Frequency anomalies", "Risk trend"],
    capabilities: ["Behavioral anomalies", "Resource anomalies", "JS execution anomalies", "Network anomalies", "Risk waveforms"]
  },
  {
    id: "ai-activity-detector",
    code: "E",
    name: "AI Activity Detector",
    pricing: "Enterprise / High-tier",
    industry: "Legal, media, security, enterprise compliance",
    promise: "Browser-side AI and local inference activity detection.",
    unlockCopy: "Unlock WASM, Worker, microtask, GPU jitter, local inference, embedding, and model-loading evidence.",
    metrics: ["AI signal score", "Worker frequency", "WASM / model pressure"],
    capabilities: ["WASM high-frequency detection", "Worker high-frequency detection", "Microtask storms", "GPU frame jitter", "Local model loading detection"]
  }
]);
const RANKING_BOARDS = Object.freeze([
  { id: "overall", name: "Overall", subtitle: "Weighted score across all five Organ9 packages." },
  ...PACKAGE_DEFINITIONS.map(definition => ({ id: definition.id, name: definition.name, subtitle: definition.promise }))
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
  applyViewMode(viewMode);
  applyAuthMode(authMode);
  renderAccountState();
  applyAppView(accountState.email ? (appView === "sign-in" || appView === "home" ? "dashboard" : appView) : (appView === "dashboard" || appView === "modules" ? "home" : appView));
  renderRankings();
  loadBillingStatus();
  loadFrequencySettings();
}

function wireCommercialShell() {
  elements.navHome?.addEventListener("click", () => applyAppView("home"));
  elements.navDocs?.addEventListener("click", () => applyAppView("docs"));
  elements.navDashboard?.addEventListener("click", () => applyAppView(accountState.email ? "dashboard" : "sign-in"));
  elements.navModules?.addEventListener("click", () => applyAppView(accountState.email ? "modules" : "sign-in"));
  elements.navRankings?.addEventListener("click", () => applyAppView("rankings"));
  elements.navPlans?.addEventListener("click", () => applyAppView("plans"));
  elements.navSignIn?.addEventListener("click", () => applyAppView(accountState.email ? "dashboard" : "sign-in"));
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
    setPlanStatus("Unknown Organ9 plan, module, or add-on. Refresh the page and try again.", "error");
    return;
  }
  if (!accountState.email) {
    setPlanStatus("Sign in before choosing an Organ9 package.", "error");
    setAccountStatus("Sign in before choosing an Organ9 package.", "error");
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
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Checkout is not configured.");
    if (!isAuthorizeNetHostedPaymentUrl(payload.url)) throw new Error("Checkout did not return a valid Authorize.Net hosted payment URL.");
    saveAccountState();
    renderAccountState();
    submitAuthorizeNetHostedPayment(payload);
  } catch (error) {
    applyLocalDemoEntitlement(normalizedPlan);
    saveAccountState();
    renderAccountState();
    if (normalizeModuleId(normalizedPlan)) selectModule(normalizedPlan);
    setPlanStatus(`${readableBillingName(normalizedPlan)} added as sandbox preview access. ${error.message || String(error)} Connect Authorize.Net before production sales.`, "success");
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
    starter: "update-radar",
    pro: "performance-spectrum",
    team: "structure-monitor"
  };
  const normalized = aliases[id] || id;
  return [
    "structure-monitor",
    "performance-spectrum",
    "update-radar",
    "risk-score-engine",
    "ai-activity-detector"
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
    "structure-monitor": "Structure Monitor",
    "performance-spectrum": "Performance Spectrum",
    "update-radar": "Update Radar",
    "risk-score-engine": "Risk Score Engine",
    "ai-activity-detector": "AI Activity Detector"
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
    entitlements.modules = [...new Set([...(entitlements.modules || []), "performance-spectrum", "update-radar"])];
    entitlements.addons = [...new Set([...(entitlements.addons || []), "exports-api"])];
  }
  if (item === "starter") entitlements.modules = [...new Set([...(entitlements.modules || []), "update-radar"])];
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
    setPlanStatus("Dev Mode Pro is a paid add-on. Unlock it to access raw ledgers, Organ9 internals, signatures, and developer exports.", "error");
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
  elements.authTitle.textContent = authMode === "sign-up" ? "Create your workspace" : "Sign in to your workspace";
  elements.authCopy.textContent = authMode === "sign-up"
    ? "Create a workspace session, then connect Authorize.Net hosted checkout when you deploy."
    : "Sign in first. The live website data dashboard stays locked until a workspace session is active.";
  elements.loginButton.textContent = authMode === "sign-up" ? "Create account" : "Sign in";
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
      renderStructureEngine(snapshot);
      renderFacts();
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
  return { data, channels: runtimeFactChannels, facts: all, latest, pipeline, organPipeline, organFrequencySpectrum, layerCoverage: normalizeLayerCoverage(data.runtimeLayerCoverage, all) };
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
        <button class="secondary" type="button" data-layer-upgrade="structure-monitor">Unlock Structure Monitor</button>
      </article>
    `;
    elements.coverageGrid.querySelector("[data-layer-upgrade]")?.addEventListener("click", () => {
      activeModule = "structure-monitor";
      localStorage.setItem("runtimeDiagnosticsActiveModule", activeModule);
      applyAppView("plans");
      setPlanStatus("Structure Monitor unlocks Runtime Layer Coverage evidence.", "");
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
  return hasPackageAccess("structure-monitor") || hasDevModeAccess();
}

function renderNormalInsights(model, context = {}) {
  if (!elements.normalInsightGrid) return;
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
      label: "Layer Coverage",
      title: `${strongCoverage} full layers, ${limitedCoverage} browser-limited`,
      detail: Object.entries(coverage).map(([name, layer]) => `${readableCoverageName(name)}: ${readableCoverageStatus(layer.status)}`).join(" | "),
      active: coverageValues.some(layer => layer.evidenceCount > 0 || layer.status === "full")
    },
    {
      label: "Channels Graph",
      title: `${channelEntries.length} data channels`,
      detail: topChannels,
      active: channelEntries.length > 0
    },
    {
      label: "Technology Profile",
      title: technologySignals.length ? `${technologySignals.length} technology signals` : "No technology profile yet",
      detail: technologySignals.slice(0, 3).map(signal => `${signal.name}: ${signal.detail}`).join(" ") || "Runtime Diagnostics will infer frameworks, storage, network behavior, and security signals as facts arrive.",
      active: technologySignals.length > 0
    },
    {
      label: "Structural Pipeline",
      title: pipelineLatest.classification || "No structural classification yet",
      detail: pipelineLatest.classification
        ? `${pipelineLatest.category}/${pipelineLatest.signal} scored ${formatScore(pipelineLatest.score)}. Graph has ${graph.nodeCount || 0} keys and ${graph.edgeCount || 0} links.`
        : `${pipeline.normalizedFacts?.length || 0} normalized facts and ${pipeline.events?.length || 0} structural events are retained.`,
      active: Boolean(pipelineLatest.classification || pipeline.normalizedFacts?.length || pipeline.events?.length)
    },
    {
      label: "Organ9 Graph",
      title: `${organSummary.nodeCount || 0} organ facts`,
      detail: `${organSummary.edgeCount || 0} structural edges, ${organSummary.errorCount || 0} dispatch errors, ${organSummary.organCount || 9} fixed organ lanes represented.`,
      active: Boolean(organSummary.nodeCount)
    },
    {
      label: "Frequency Spectrum",
      title: `Risk ${formatScore(products.websiteRiskScore?.score || 0)}`,
      detail: `Closure ${signature}; coherence ${formatScore(closure.coherence)}; AI/protection signal ${formatScore(products.aiActivityDetection?.score || 0)}.`,
      active: Boolean(spectrum && total)
    },
    {
      label: "Commercial Package Suite",
      title: `${activePackages.length} Organ9 packages active`,
      detail: activePackages.length
        ? activePackages.map(item => `${item.name}: ${formatScore(item.score)}`).join(" ")
        : "Structure Monitor, Performance Spectrum, Update Radar, Risk Score Engine, and AI Activity Detector will score as evidence appears.",
      active: activePackages.length > 0
    },
    {
      label: "Structure Engine",
      title: structureEngine.prediction?.label || "No prediction yet",
      detail: structureEngine.prediction
        ? `${structureEngine.prediction.label} with confidence ${formatScore(structureEngine.prediction.confidence)}. Signature ${signature}.`
        : `Signature ${signature}. Reconstruction and prediction become meaningful after more runtime facts are collected.`,
      active: Boolean(total && (structureEngine.signature || closure.signature))
    },
    {
      label: "Recent Facts",
      title: latestFacts.length ? `${latestFacts.length} newest facts` : "No recent facts yet",
      detail: latestFacts.join(" ") || "The live ledger will summarize recent page behavior here without requiring Dev mode.",
      active: latestFacts.length > 0
    }
  ];
  elements.normalCoverage.textContent = `${systems.filter(system => system.active).length} / ${systems.length} systems active`;
  elements.normalInsightGrid.innerHTML = systems.map(system => `
    <article class="normal-insight-card ${system.active ? "active" : ""}">
      <span>${escapeHtml(system.label)}</span>
      <strong>${escapeHtml(system.title)}</strong>
      <p>${escapeHtml(system.detail)}</p>
    </article>
  `).join("");
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
      <strong>${escapeHtml(item.name || "Organ9 Package")}</strong>
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
      <small>${item.id === "overall" ? "All packages" : "Package score"}</small>
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
    <button class="ranking-row" type="button" data-ranking-site="${escapeHtml(row.id)}" aria-label="Open Organ9 ranking analysis for ${escapeHtml(row.host)}">
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
  const storedVersion = localStorage.getItem("organ9RankingSeedVersion") || "";
  const missingSeeds = BENCHMARK_SEED_RANKINGS.filter(seed => !rankingLedger.some(item => item.id === seed.id));
  if (storedVersion === RANKING_SEED_VERSION && !missingSeeds.length) return;
  for (const sample of missingSeeds) mergeRankingSample(sample);
  localStorage.setItem("organ9RankingSeedVersion", RANKING_SEED_VERSION);
  saveRankingLedger();
}

function exportRankingLedger() {
  downloadJson({
    exportedAt: new Date().toISOString(),
    note: "Organ9 ranking ledger contains benchmark seed samples and locally collected website analyses. It is not global internet telemetry unless connected to a crawler fleet.",
    boards: RANKING_BOARDS,
    samples: rankWebsiteSamples(rankingLedger, activeRankingBoard)
  }, "organ9-website-rankings");
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
    overallScore: computeOverallRankingScore(packageScores),
    normal,
    evidence: Object.fromEntries(packages.map(item => [item.id, item.evidence || []])),
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
  if (packageId === "structure-monitor") return base + (/dom|shadow|iframe|worker|accessibility/.test(channelText) ? .18 : .04);
  if (packageId === "performance-spectrum") return base + (/performance|long-task|layout|resource|network/.test(channelText) ? .2 : .05);
  if (packageId === "update-radar") return base + (/mutation|dom|cssom|resource|vdom/.test(channelText) ? .22 : .04);
  if (packageId === "risk-score-engine") return base + ((model.facts || []).filter(item => item.severity === "high" || item.severity === "medium").length / Math.max(20, facts.length || 1));
  if (packageId === "ai-activity-detector") return base + (/wasm|worker|microtask|gpu|ai|model/.test(channelText) ? .24 : .02);
  return base;
}

function mergeRankingSample(sample) {
  const normalized = { ...sample, id: normalizeRankingId(sample.host || sample.id), overallScore: computeOverallRankingScore(sample.packageScores || {}) };
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
  rankingLedger[existingIndex] = {
    ...existing,
    ...normalized,
    packageScores,
    overallScore: computeOverallRankingScore(packageScores),
    confidence: Math.max(existing.confidence || 0, normalized.confidence || 0),
    sampleCount,
    evidence: { ...(existing.evidence || {}), ...(normalized.evidence || {}) },
    normal: normalized.normal || existing.normal
  };
}

function rankWebsiteSamples(samples, boardId = "overall") {
  return [...samples]
    .map(sample => ({ ...sample, overallScore: computeOverallRankingScore(sample.packageScores || {}) }))
    .sort((left, right) => rankingScoreForBoard(right, boardId) - rankingScoreForBoard(left, boardId));
}

function rankingScoreForBoard(sample, boardId = "overall") {
  return boardId === "overall" ? clamp01(sample.overallScore ?? computeOverallRankingScore(sample.packageScores || {})) : clamp01(sample.packageScores?.[boardId] || 0);
}

function computeOverallRankingScore(scores = {}) {
  const weights = {
    "structure-monitor": .22,
    "performance-spectrum": .2,
    "update-radar": .2,
    "risk-score-engine": .22,
    "ai-activity-detector": .16
  };
  return clamp01(Object.entries(weights).reduce((sum, [id, weight]) => sum + (Number(scores[id]) || 0) * weight, 0));
}

function packageInsight(sample, packageId) {
  const score = rankingScoreForBoard(sample, packageId);
  if (score >= .75) return "Strong package signal. This website ranks highly for this Organ9 module.";
  if (score >= .5) return "Moderate package signal. There is enough evidence for comparison, but not enough for a top-tier score.";
  if (score > 0) return "Low package signal. The site is relatively quiet or the current sample lacks this evidence.";
  return "No package signal in this ranking sample.";
}

function rankingSeedSample(host, category, packageScores, evidence = []) {
  return {
    id: normalizeRankingId(host),
    host,
    url: `https://${host}/`,
    category,
    sourceLabel: "Benchmark seed",
    sourceKind: "seed-benchmark",
    sampleCount: 1,
    confidence: .42,
    packageScores,
    overallScore: computeOverallRankingScore(packageScores),
    evidence: Object.fromEntries(PACKAGE_DEFINITIONS.map(definition => [definition.id, evidence])),
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

function loadRankingLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem("organ9RankingLedger") || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed.slice(0, 500) : BENCHMARK_SEED_RANKINGS.map(sample => ({ ...sample }));
  } catch {
    return BENCHMARK_SEED_RANKINGS.map(sample => ({ ...sample }));
  }
}

function saveRankingLedger() {
  localStorage.setItem("organ9RankingLedger", JSON.stringify(rankingLedger.slice(0, 500)));
}

function normalizeRankingId(value) {
  return String(value || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[^a-z0-9.-]/g, "-") || "unknown-site";
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function packageDefinitionsWithRuntimeData(suite = {}) {
  const runtimePackages = new Map((suite?.packages || []).map(item => [normalizePlanId(item.id || item.slug || item.name), item]));
  return PACKAGE_DEFINITIONS.map(definition => {
    const runtime = runtimePackages.get(definition.id) || {};
    return { ...definition, ...runtime, id: definition.id, name: definition.name, code: definition.code };
  });
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
  if (!normalizePlanId(activeModule)) activeModule = packages[0]?.id || "performance-spectrum";
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
    elements.structureEngine.innerHTML = `<div class="empty">Collect runtime facts to build Organ9, Frequency4, Closure, Hexagram, Signature, reconstruction, and prediction.</div>`;
    return;
  }
  const signature = engine.signature || {};
  elements.structureSignature.textContent = signature.finalSignature || "Unsigned";
  const frequency = engine.frequency4 || {};
  const closure = engine.closure || {};
  const cards = [
    {
      name: "Organ9",
      category: "runtime",
      detail: Object.entries(engine.organ9 || {}).map(([organ, value]) => `${organ}:${formatScore(value.level)}/${formatScore(value.stability)}`).join("  ")
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
    downloadJson(scrubExportValue({
      exportedAt: new Date().toISOString(),
      kind: "runtime-diagnostics",
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
    structuralPipeline: scrubExportValue(model.pipeline || {}),
    organPipeline: scrubExportValue(model.organPipeline || {}),
    organFrequencySpectrum: scrubExportValue(model.organFrequencySpectrum || {})
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
