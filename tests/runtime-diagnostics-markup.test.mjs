import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

const html = await readFile(new URL("../runtime-diagnostics.html", import.meta.url), "utf8");
const js = await readFile(new URL("../runtime-diagnostics.js", import.meta.url), "utf8");
const css = await readFile(new URL("../runtime-diagnostics.css", import.meta.url), "utf8");
const languagePackets = await readFile(new URL("../runtime-language-packets.js", import.meta.url), "utf8");

test("runtime diagnostics controls expose production-grade button semantics", () => {
  const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
  assert.ok(buttons.length >= 20, "expected the commercial dashboard to expose its full explicit control set");
  for (const button of buttons) {
    assert.match(button, /\btype="button"/, `button is missing type="button": ${button}`);
  }
});

test("runtime diagnostics keeps customer and developer mode state accessible", () => {
  assert.match(html, /id="normal-mode"[^>]*aria-pressed="true"/);
  assert.match(html, /id="dev-mode"[^>]*aria-pressed="false"/);
  assert.match(js, /normalMode\?\.setAttribute\("aria-pressed"/);
  assert.match(js, /devMode\?\.setAttribute\("aria-pressed"/);
  assert.match(js, /function hasDevModeAccess/);
  assert.match(js, /Dev Mode Pro is a paid add-on/);
});

test("account tabs and live status regions expose state to assistive technology", () => {
  assert.match(html, /role="tablist"/);
  assert.match(html, /id="auth-sign-in"[^>]*role="tab"[^>]*aria-selected="true"/);
  assert.match(html, /id="auth-sign-up"[^>]*role="tab"[^>]*aria-selected="false"/);
  assert.match(html, /id="system-health"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="stream-state"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="account-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(js, /authSignIn\?\.setAttribute\("aria-selected"/);
  assert.match(js, /authSignUp\?\.setAttribute\("aria-selected"/);
});

test("generated developer channel filters are explicit buttons with useful labels", () => {
  assert.match(js, /<button class="channel-item" type="button"/);
  assert.match(js, /aria-label="Filter recent facts to/);
});

test("commercial UI has keyboard focus and mobile wrapping safeguards", () => {
  assert.match(html, /class="skip-link"/);
  assert.match(css, /\.skip-link:focus/);
  assert.match(css, /button:focus-visible,\s*input:focus-visible,\s*select:focus-visible/);
  assert.match(css, /\.url-row input,\s*\.url-row button \{ flex: 1 1 100%; \}/);
  assert.match(css, /\.top-actions button,\s*\.account-chip,\s*\.language-control \{ flex: 1 1 auto; \}/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("professional dashboard exposes operating status and layer coverage", () => {
  for (const id of [
    "target-summary",
    "signal-summary",
    "coverage-status",
    "boundary-status",
    "coverage-grid"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /class="command-strip"/);
  assert.match(css, /\.command-strip/);
  assert.match(css, /\.coverage-card\.full/);
  assert.match(css, /\.coverage-card\.first_party_only/);
  assert.match(js, /function renderOperatingStrip/);
  assert.match(js, /function renderLayerCoverageMatrix/);
  assert.match(js, /Protected browser internals are shown as first-party-only or best-effort/);
});

test("standalone analysis failures update the visible target status panel", () => {
  assert.match(js, /function setStandaloneTargetStatus/);
  assert.match(js, /Workspace locked/);
  assert.match(js, /No target URL/);
  assert.match(js, /Target rejected/);
  assert.match(js, /elements\.latestHost\.textContent = title/);
  assert.match(js, /elements\.latestTime\.textContent = detail/);
});

test("pricing cards expose package price state and guard checkout redirects", () => {
  for (const plan of ["starter", "professional", "enterprise", "devops", "security", "performance", "ai-governance", "analytics", "oem-platform", "dev-mode-pro"]) {
    assert.match(html, new RegExp(`data-(?:billing|plan)-price="${plan}"`));
  }
  assert.match(css, /\.plan-price\.available/);
  assert.match(css, /\.plan-price\.demo/);
  assert.match(js, /planPrices: document\.querySelectorAll/);
  assert.match(js, /\/api\/billing\/checkout/);
  assert.match(html, /Core Plans/);
  assert.match(html, /Paid Modules/);
  assert.match(html, /Add-ons/);
});

test("Live Signal Console panels are present in the dashboard", () => {
  for (const id of [
    "web-bloomberg-status",
    "web-bloomberg-frequency",
    "web-bloomberg-storms",
    "web-bloomberg-deviation",
    "web-bloomberg-risk",
    "web-bloomberg-dependencies",
    "web-bloomberg-windows"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Live Signal Console/);
  assert.match(js, /function renderLiveSignalConsole/);
  assert.match(css, /\.signal-console/);
});

test("Web Version 2 taxonomy maps market modules to runtime events", () => {
  for (const phrase of [
    "Atrinit Runtime Layer",
    "Web Version 2 Market Modules",
    "Raw browser facts are organized into the 8 structural runtime trees"
  ]) {
    assert.match(html, new RegExp(phrase));
  }
  for (const id of ["web-v2-module-grid", "runtime-event-grid", "runtime-event-summary"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const symbol of [
    "const WEB_V2_MODULES = Object.freeze",
    "const RUNTIME_EVENT_CATEGORIES = Object.freeze",
    "const UI_RUNTIME_EVENT_MAP = Object.freeze",
    "const RUNTIME_EVENT_TO_SIG9_ORGANS = Object.freeze",
    "const PACKAGE_RUNTIME_EVENT_MAP = Object.freeze",
    "function runtimeEventCategoriesForFact",
    "function buildRuntimeFactLedger",
    "function buildStandaloneAggregateDiagnostics",
    "function summarizeRuntimeEvents",
    "function buildRuntimeLayerTrees",
    "function canonicalRuntimeFactForRaw",
    "function renderRuntimeTreeCard",
    "function renderRuntimeTreeNode",
    "function exportRuntimeLayerSummary",
    "function renderWebV2Taxonomy"
  ]) {
    assert.match(js, new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const treeName of ["DOM Runtime", "CSSOM Runtime", "Layout Runtime", "Shadow DOM Runtime", "Accessibility Runtime", "JS Runtime", "Worker / Thread Runtime", "VDOM Runtime"]) {
    assert.match(js, new RegExp(treeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const category of ["Interaction", "Presentation", "Communication", "Synchronization", "Persistence", "Execution", "Security", "Resources", "Compute"]) {
    assert.match(js, new RegExp(category));
  }
  for (const moduleName of ["Web Activity Intelligence", "Web Rhythm Engine", "Web Dependency Graph", "Web Risk Surface", "Web Flow Map", "Web Time Dynamics", "Web Influence Map", "Web State Evolution", "Web Signal Compression"]) {
    assert.match(js, new RegExp(moduleName));
    assert.match(languagePackets, new RegExp(moduleName));
  }
  assert.match(js, /webV2Scores/);
  assert.match(js, /Signal Quality/);
  assert.match(js, /function screenshotModulesForRuntimeEvent/);
  assert.match(js, /function screenshotModuleSystemsForRuntimeEvent/);
  assert.match(js, /function renderRuntimeMappedRawData/);
  assert.match(js, /structural/);
  assert.match(js, /changed nodes/);
  assert.match(js, /runtimeFactHistory/);
  assert.match(js, /\/api\/runtime-diagnostics\/export/);
  assert.match(js, /DOM\.NodeAdded/);
  assert.match(js, /CSS\.RuleInserted/);
  assert.match(js, /Layout\.Reflow/);
  assert.match(js, /Shadow\.RootAdded/);
  assert.match(js, /A11y\.RoleChanged/);
  assert.match(js, /JSRuntime\.MicrotaskScheduled/);
  assert.match(js, /Worker\.Created/);
  assert.match(js, /VDOM\.NodeDiff/);
  assert.match(js, /No facts yet/);
  assert.doesNotMatch(js, /Raw evidence:/);
  assert.doesNotMatch(js, /observations/);
  assert.doesNotMatch(js, /No organ/);
  assert.match(js, /function buildWebV2AnalysisFromModel/);
  assert.match(js, /function synthesizeWebV2ScoresFromPackages/);
  assert.match(js, /function webV2Insight/);
  assert.match(js, /Web Version 2 Scores/);
  assert.match(js, /Commercial Package Scores/);
  assert.match(css, /\.web-v2-taxonomy/);
  assert.match(css, /\.runtime-tree-card/);
  assert.match(css, /\.runtime-node/);
  assert.match(css, /\.hl-added/);
  assert.match(css, /\.hl-removed/);
  assert.match(css, /\.hl-changed/);
  assert.match(css, /\.runtime-profile-total/);
  assert.match(css, /\.runtime-subcategory-stack/);
  assert.match(css, /\.runtime-raw-card/);
  assert.match(css, /\.runtime-event-card\.active/);
});

test("Atrinit Runtime Layer replaces the old nine profile cards with eight trees", () => {
  assert.doesNotMatch(html, /Atrinit Runtime Event Profile/);
  assert.doesNotMatch(html, /0 \/ 9 runtime event categories active/);
  assert.match(html, /0 \/ 8 runtime trees active/);
  assert.match(js, /const RUNTIME_TREE_DOMAINS = Object\.freeze/);
  assert.match(js, /const RUNTIME_HIGHLIGHT_MAP = Object\.freeze/);
  assert.match(js, /buildRuntimeLayerTrees\(all\)/);
  assert.match(js, /runtimeLayer\.trees\.map\(renderRuntimeTreeCard\)/);
  assert.match(js, /atrinitRuntimeLayer/);
});

test("Atrinit raw Recent Facts registry drives the profile categories", () => {
  for (const symbol of [
    "const RAW_FACT_MAPPING_REGISTRY_VERSION =",
    "const RAW_FACT_TO_SIG9_ORGAN = Object.freeze",
    "const RAW_FACT_REGISTRY_ENTRIES = Object.freeze",
    "const RAW_FACT_MAPPING_BY_KEY = Object.freeze",
    "function mapRawRuntimeFact",
    "function fallbackRuntimeFactCategories",
    "function buildFactMappingDebugReport",
    "function renderFactMappingDebug"
  ]) {
    assert.match(js, new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const rawFact of [
    "layout_shift",
    "forced_reflow",
    "vdom_commit",
    "vdom_diff",
    "css_rule_insert",
    "forced_style_recalc",
    "a11y_break",
    "js_event_loop_render",
    "js_promise_chain",
    "js_fetch_start",
    "shadow_root_created",
    "shadow-root",
    "slot_change",
    "iframe_created",
    "iframe-dom",
    "worker_message",
    "sw_fetch",
    "message_channel_message",
    "storage-mutation",
    "promise-rejection",
    "timing"
  ]) {
    assert.match(js, new RegExp(rawFact));
  }
  for (const id of ["fact-mapping-debug", "runtime-event-grid"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Fact Mapping Debug/);
  assert.match(js, /rawFactMapping/);
  assert.match(js, /No canonical registry entry matched this source\/type/);
  assert.match(css, /\.mapping-debug-grid/);
  assert.match(css, /\.runtime-raw-card\.unmapped/);
});

test("RuntimeCollector V2 timing facts do not spray into unrelated profiles", () => {
  assert.doesNotMatch(js, /RAW_FACT_MAPPING_BY_KEY\[normalizedType\]/);
  assert.match(js, /RAW_FACT_MAPPING_BY_KEY\[normalizeRawFactKey\(channel\)\]/);
  assert.match(js, /const payloadText = `\$\{source\} \$\{type\} \$\{channel\}`/);
  assert.match(js, /rawFactEntry\("network", \["timing"\], \["Communication", "Resources"\]/);
  assert.match(js, /rawFactEntry\("runtime", \["timing", "performance"\], \["Execution", "Synchronization"\]/);
});

test("Atrinit profile registry has concrete old-runtime fact families for all nine profiles", () => {
  const expectedFamilies = [
    ["interaction", "Interaction"],
    ["presentation", "Presentation"],
    ["communication", "Communication"],
    ["synchronization", "Synchronization"],
    ["persistence", "Persistence"],
    ["execution", "Execution"],
    ["security", "Security"],
    ["resources", "Resources"],
    ["compute", "Compute"]
  ];
  for (const [source, category] of expectedFamilies) {
    assert.match(js, new RegExp(`rawFactEntry\\("${source}", \\[[^\\]]+\\], \\["${category}"`));
  }
  for (const rawFact of [
    "captcha",
    "auth-challenge",
    "fingerprint",
    "webgpu",
    "gpu-jitter",
    "ai-inference",
    "model-load",
    "storage-snapshot",
    "resource-timing",
    "event_dispatch"
  ]) {
    assert.match(js, new RegExp(rawFact));
  }
});

test("paid Organ9 packages have separate module pages and locked states", () => {
  assert.match(html, /id="nav-modules"/);
  assert.match(html, /id="modules-view"/);
  assert.match(html, /id="module-tabs"/);
  assert.match(html, /id="module-detail"/);
  assert.match(js, /const PACKAGE_DEFINITIONS = Object\.freeze/);
  assert.match(js, /function hasPackageAccess/);
  assert.match(js, /function renderModulePages/);
  assert.match(js, /Requires package unlock/);
  assert.match(js, /Payment required/);
  assert.match(css, /\.modules-shell/);
  assert.match(css, /\.module-tab\.locked/);
  assert.match(css, /\.package-card\.locked/);
});

test("commercial website shell exposes public pages and protected app navigation", () => {
  for (const id of ["nav-home", "nav-docs", "nav-sign-in", "nav-rankings", "home-view", "docs-view", "dashboard-view", "modules-view", "rankings-view", "plans-view"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Authorize\.Net-ready/);
  assert.match(html, /Server entitlements/);
  assert.match(css, /\.home-hero/);
  assert.match(css, /\.pricing-section/);
  assert.match(js, /applyAppView\("home"\)/);
});

test("commercial shell exposes buyer-ready polish and grouped controls", () => {
  for (const className of ["nav-cluster", "product-nav", "nav-menu", "nav-menu-panel", "workspace-cluster", "runtime-cluster", "trust-ribbon", "pricing-assurance", "product-flow", "home-use-cases", "readiness-strip", "faq-grid", "deployment-grid", "docs-boundary", "ranking-hero", "ranking-command-card", "ranking-ops-grid", "ranking-toolbar", "ranking-shell", "ranking-list", "ranking-detail", "layer-coverage-page", "site-footer", "module-plan-panel", "addon-plan-panel"]) {
    assert.match(html, new RegExp(`class="[^"]*\\b${className}\\b`));
    assert.match(css, new RegExp(`\\.${className}`));
  }
  assert.match(js, /function closeNavigationMenus/);
  assert.match(html, /Authorize\.Net hosted checkout/);
  assert.match(html, /Production Deployment Checklist/);
  assert.match(html, /Runtime Diagnostics monitors the selected URL/);
  assert.doesNotMatch(html, /local demo mode/i);
  assert.doesNotMatch(js, /local demo mode/i);
  assert.match(html, /Signals captured/);
  assert.match(js, /Analyzer bridge offline/);
  assert.match(js, /sandbox preview access/);
  assert.match(js, /const RANKING_BOARDS = Object\.freeze/);
  assert.match(js, /const RANKING_SEED_VERSION =/);
  assert.match(js, /function ensureBenchmarkSeedCoverage/);
  assert.match(js, /function renderRankings/);
  assert.match(js, /function upsertRankingSampleFromResult/);
  assert.match(js, /function startRankingCrawler/);
  assert.match(js, /\/api\/rankings\/crawler\/start/);
  assert.match(js, /function importRankingCrawlerResults/);
  assert.ok((js.match(/rankingSeedSample\(/g) || []).length >= 40, "expected a broad benchmark seed corpus for rankings");
  assert.match(html, /Expanded benchmark corpus/);
  assert.match(css, /\.ranking-proof/);
  assert.match(js, /Security unlocks Runtime Layer Coverage evidence/);
  assert.match(js, /footerPricing\?\.addEventListener/);
});

test("commercial website exposes language packets and persistent localization controls", () => {
  assert.match(html, /id="language-select"/);
  assert.match(html, /id="language-label"/);
  assert.match(html, /runtime-language-packets\.js/);
  assert.ok(html.indexOf("runtime-language-packets.js") < html.indexOf("runtime-diagnostics.js"), "language packets must load before runtime UI logic");
  for (const locale of ["en", "zh", "es"]) {
    assert.match(languagePackets, new RegExp(`${locale}: Object\\.freeze`));
  }
  for (const key of ["ORGAN9_LANGUAGE_STORAGE_KEY", "ORGAN9_LANGUAGE_PACKETS", "getOrgan9LanguagePacket"]) {
    assert.match(languagePackets, new RegExp(key));
  }
  for (const phrase of ["Commercial browser monitoring", "运行时智能平台", "Monitoreo comercial"]) {
    assert.match(languagePackets, new RegExp(phrase));
  }
  for (const phrase of ["Runtime-safe", "Customer view", "Production Deployment Checklist", "Normal View Diagnostics", "Technology Profile"]) {
    assert.match(languagePackets, new RegExp(phrase));
  }
  assert.match(js, /function applyLanguage/);
  assert.match(js, /function languageText/);
  assert.match(js, /function localizeVisibleText/);
  assert.match(js, /new MutationObserver/);
  assert.match(js, /languageSelect\?\.addEventListener\("change"/);
  assert.match(js, /document\.documentElement\.lang = activeLanguage/);
  assert.match(css, /\.language-control/);
});
