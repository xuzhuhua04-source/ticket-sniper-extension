import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

const html = await readFile(new URL("../runtime-diagnostics.html", import.meta.url), "utf8");
const js = await readFile(new URL("../runtime-diagnostics.js", import.meta.url), "utf8");
const css = await readFile(new URL("../runtime-diagnostics.css", import.meta.url), "utf8");

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
  assert.match(css, /\.top-actions button,\s*\.account-chip \{ flex: 1 1 auto; \}/);
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
  for (const plan of ["starter", "professional", "enterprise", "structure-monitor", "performance-spectrum", "update-radar", "risk-score-engine", "ai-activity-detector", "dev-mode-pro"]) {
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
  for (const className of ["nav-cluster", "workspace-cluster", "runtime-cluster", "trust-ribbon", "pricing-assurance", "product-flow", "home-use-cases", "readiness-strip", "faq-grid", "deployment-grid", "docs-boundary", "ranking-hero", "ranking-command-card", "ranking-ops-grid", "ranking-toolbar", "ranking-shell", "ranking-list", "ranking-detail", "layer-coverage-page", "site-footer", "module-plan-panel", "addon-plan-panel"]) {
    assert.match(html, new RegExp(`class="[^"]*\\b${className}\\b`));
    assert.match(css, new RegExp(`\\.${className}`));
  }
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
  assert.match(js, /Structure Monitor unlocks Runtime Layer Coverage evidence/);
  assert.match(js, /footerPricing\?\.addEventListener/);
});
