const OFFICIAL_HOSTS = ["usvisascheduling.com", "atlasauth.b2clogin.com", "ais.usvisa-info.com", "ustraveldocs.com", "cgifederal.secure.force.com"];
const DEFAULT_SELECTOR = [
  "[data-available-date]", "button[data-date]", "a[data-date]", "time[datetime]",
  "td[data-handler='selectDay'] a", "[role='gridcell']:not([aria-disabled='true']) button",
  ".calendar td:not(.disabled) a", ".calendar-day.available", ".day.available",
  "button[aria-label*='202']", "a[aria-label*='202']",
  ".ui-datepicker-calendar td[data-handler='selectDay']", ".ui-datepicker-calendar td:not(.ui-state-disabled):not(.ui-datepicker-unselectable) a",
  "td[onclick]", "td[style*='green' i]", "td[style*='rgb(0, 128, 0)' i]", "td[style*='#008000' i]"
].join(",");
let mutationTimer = null;
let monitorEnabled = false;
let calendarObserver = null;
let calendarRootObserver = null;
let calendarRoot = null;
let calendarFingerprint = null;
let pageObserver = null;
let pageMutationTimer = null;
let pageFingerprint = null;

// Message bridge: background asks this tab to scan visible official-page state.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SCAN_APPOINTMENTS") return false;
  scanAndReport(message.payload?.reason || "scheduled")
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

initialize();

// Startup/resume: restore pending manual navigation and attach observers when monitoring is on.
async function initialize() {
  if (!isOfficialHost()) return;
  await resumePendingReschedule();
  const settings = await getSettings();
  monitorEnabled = settings.enabled;
  if (monitorEnabled) setTimeout(() => scanAndReport("page_loaded"), 1800);
  if (monitorEnabled) installDomUpdateTriggers();
}

async function resumePendingReschedule() {
  const response = await chrome.runtime.sendMessage({ type: "GET_PENDING_RESCHEDULE" }).catch(() => null);
  const pending = response?.pending;
  if (!pending?.url) return;
  if (normalizeUrl(location.href) === normalizeUrl(pending.url)) {
    await chrome.runtime.sendMessage({ type: "CLEAR_PENDING_RESCHEDULE" }).catch(() => {});
    return;
  }
  if (pageRequiresManualLogin()) {
    showBanner("Sign in manually to continue. You may use your browser password manager; this extension never stores or inserts your password.", "warning");
    return;
  }
  const target = new URL(pending.url);
  if (target.protocol !== "https:" || !isAllowedOfficialHost(target.hostname)) return;
  location.assign(target.href);
}

function pageRequiresManualLogin() {
  const text = document.body?.innerText || "";
  const password = document.querySelector("input[type='password']");
  if (findCalendarRoot()) return false;
  return Boolean(password) || /sign\s*in|log\s*in|forgot password|session\s+expired|please\s+login/i.test(text);
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return value;
  }
}

function isAllowedOfficialHost(hostname) {
  const host = hostname.toLowerCase();
  return OFFICIAL_HOSTS.some(official => host === official || host.endsWith(`.${official}`));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.visaMonitorSettings) return;
  monitorEnabled = Boolean(changes.visaMonitorSettings.newValue?.enabled);
  if (monitorEnabled) installDomUpdateTriggers();
  else disconnectDomUpdateTriggers();
});

// DOM watchers: calendar-specific changes plus broader public/login page structure changes.
function installDomUpdateTriggers() {
  installCalendarUpdateTrigger();
  installPageStructureTrigger();
}

function installCalendarUpdateTrigger() {
  disconnectCalendarUpdateTrigger();
  connectCalendarRoot(findCalendarRoot());
  calendarRootObserver = new MutationObserver(() => {
    if (!monitorEnabled) return;
    const nextRoot = findCalendarRoot();
    if (nextRoot !== calendarRoot) {
      const previousFingerprint = calendarFingerprint;
      connectCalendarRoot(nextRoot);
      if (previousFingerprint && calendarFingerprint && previousFingerprint !== calendarFingerprint) {
        emitCalendarChange(previousFingerprint, calendarFingerprint);
      }
    }
  });
  calendarRootObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function findCalendarRoot() {
  return document.querySelector(".ui-datepicker, .ui-datepicker-group, .ui-datepicker-calendar, .calendar, [role='grid'], [class*='calendar']");
}

function connectCalendarRoot(root) {
  calendarObserver?.disconnect();
  calendarObserver = null;
  calendarRoot = root;
  calendarFingerprint = root ? fingerprintCalendar(root) : null;
  if (!root) return;
  calendarObserver = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(reportCalendarStructureChange, 650);
  });
  calendarObserver.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "data-date", "data-available-date", "aria-disabled", "disabled", "datetime"]
  });
}

function reportCalendarStructureChange() {
  if (!monitorEnabled || !calendarRoot?.isConnected) return;
  const nextFingerprint = fingerprintCalendar(calendarRoot);
  if (!calendarFingerprint) {
    calendarFingerprint = nextFingerprint;
    return;
  }
  if (nextFingerprint === calendarFingerprint) return;
  const previousFingerprint = calendarFingerprint;
  calendarFingerprint = nextFingerprint;
  emitCalendarChange(previousFingerprint, nextFingerprint);
}

function emitCalendarChange(previousFingerprint, fingerprint) {
  const consulate = extractConsulate();
  chrome.runtime.sendMessage({
    type: "CALENDAR_DOM_UPDATED",
    payload: { previousFingerprint, fingerprint, detectedAt: Date.now(), consulate }
  }).catch(() => {});
}

// Public/login structural watcher: this does not read appointments, it only detects page shape changes.
function installPageStructureTrigger() {
  disconnectPageStructureTrigger();
  pageFingerprint = fingerprintPageStructure();
  pageObserver = new MutationObserver(() => {
    clearTimeout(pageMutationTimer);
    pageMutationTimer = setTimeout(reportPageStructureChange, 1200);
  });
  pageObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "id", "style", "href", "src", "action", "method", "type", "name", "aria-label", "role"]
  });
}

function reportPageStructureChange() {
  if (!monitorEnabled) return;
  const nextFingerprint = fingerprintPageStructure();
  if (!pageFingerprint) {
    pageFingerprint = nextFingerprint;
    return;
  }
  if (nextFingerprint === pageFingerprint) return;
  const previousFingerprint = pageFingerprint;
  pageFingerprint = nextFingerprint;
  chrome.runtime.sendMessage({
    type: "STRUCTURAL_DOM_UPDATED",
    payload: {
      previousFingerprint,
      fingerprint: nextFingerprint,
      detectedAt: Date.now(),
      scope: findCalendarRoot() ? "calendar-page" : pageRequiresManualLogin() ? "login-page" : "public-page",
      summary: structuralSummary()
    }
  }).catch(() => {});
}

// Fingerprinting helpers: hash stable structure while ignoring most volatile text/timestamps.
function fingerprintCalendar(root) {
  const nodes = [...root.querySelectorAll("[data-date], [data-available-date], time[datetime], [role='gridcell'], button, a, td, select")];
  const parts = nodes.slice(0, 500).map(node => [
    node.tagName,
    node.getAttribute("data-date") || node.getAttribute("data-available-date") || node.getAttribute("datetime") || "",
    node.getAttribute("aria-disabled") || String(Boolean(node.disabled)),
    String(node.className || "").replace(/\s+/g, " ").trim(),
    String(node.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40)
  ].join(":"));
  return simpleHash(parts.join("|"));
}

function fingerprintPageStructure() {
  const nodes = [...document.querySelectorAll("form, input, select, button, a, nav, main, section, article, table, [role], script[src], link[rel='stylesheet']")];
  const parts = [
    `path:${location.pathname}`,
    `title:${cleanStructuralText(document.title).slice(0, 80)}`,
    `calendar:${Boolean(findCalendarRoot())}`,
    `login:${Boolean(document.querySelector("input[type='password']"))}`
  ];
  for (const node of nodes.slice(0, 700)) {
    parts.push([
      node.tagName,
      cleanStructuralText(node.id).slice(0, 40),
      cleanStructuralText(node.className).slice(0, 80),
      cleanStructuralText(node.getAttribute("role")).slice(0, 40),
      cleanStructuralText(node.getAttribute("type")).slice(0, 40),
      cleanStructuralText(node.getAttribute("name")).slice(0, 40),
      normalizeStructuralUrl(node.getAttribute("href") || node.getAttribute("src") || node.getAttribute("action")),
      cleanStructuralText(node.getAttribute("aria-label") || node.textContent).slice(0, 60)
    ].join(":"));
  }
  return simpleHash(parts.join("|"));
}

function structuralSummary() {
  return {
    forms: document.querySelectorAll("form").length,
    inputs: document.querySelectorAll("input, select, textarea").length,
    buttons: document.querySelectorAll("button, input[type='submit'], input[type='button']").length,
    links: document.querySelectorAll("a[href]").length,
    scripts: document.querySelectorAll("script[src]").length,
    stylesheets: document.querySelectorAll("link[rel='stylesheet']").length,
    hasPassword: Boolean(document.querySelector("input[type='password']")),
    hasCalendar: Boolean(findCalendarRoot())
  };
}

function cleanStructuralText(value) {
  return String(value || "").replace(/\d{1,2}:\d{2}(?::\d{2})?/g, "").replace(/\b\d{4,}\b/g, "").replace(/\s+/g, " ").trim();
}

function normalizeStructuralUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, location.href);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return cleanStructuralText(value).slice(0, 80);
  }
}

function simpleHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// Cleanup helpers: used when monitoring is disabled.
function disconnectCalendarUpdateTrigger() {
  clearTimeout(mutationTimer);
  calendarObserver?.disconnect();
  calendarRootObserver?.disconnect();
  calendarObserver = null;
  calendarRootObserver = null;
  calendarRoot = null;
  calendarFingerprint = null;
}

function disconnectPageStructureTrigger() {
  clearTimeout(pageMutationTimer);
  pageObserver?.disconnect();
  pageObserver = null;
  pageFingerprint = null;
}

function disconnectDomUpdateTriggers() {
  disconnectCalendarUpdateTrigger();
  disconnectPageStructureTrigger();
}

// Appointment scan: reads only visible authenticated calendar content.
async function scanAndReport(reason) {
  if (!isOfficialHost()) throw new Error("This is not a supported official visa scheduling portal.");
  const settings = await getSettings();
  const result = scanVisibleCalendar(settings);
  const response = { ok: true, reason, ...result };
  const alertResult = await chrome.runtime.sendMessage({ type: "SLOT_SCAN_RESULT", payload: response });
  if (alertResult?.alerted) {
    if (!result.earliestDate) return response;
    highlightDate(result.earliestDate);
    showBanner(`Earlier appointment available: ${result.earliestDate}. Review and book it manually on this official page.`, "release");
    playAlarm();
  } else if (reason === "manual") {
    showBanner(result.message, result.candidateCount ? "ok" : "warning");
  }
  return response;
}

function scanVisibleCalendar(settings) {
  const selector = [settings.availableDateSelector, DEFAULT_SELECTOR].filter(Boolean).join(",");
  const consulate = extractConsulate();
  const locationId = extractLocationId();
  const nodes = uniqueNodes([...safeQueryAll(selector), ...findDatepickerDayNodes()]).filter(isAvailableDateNode);
  const dates = new Map();
  for (const node of nodes) {
    const date = dateFromNode(node, settings.dateOrder);
    if (!date) continue;
    const key = VisaDateParser.dayKey(date);
    if (!key || date.getTime() < startOfToday() || date.getTime() > Date.now() + 1000 * 60 * 60 * 24 * 730) continue;
    if (!dates.has(key)) dates.set(key, []);
    dates.get(key).push(node);
  }
  const ordered = [...dates.keys()].sort();
  const earliestDate = ordered[0] || null;
  if (earliestDate) dates.get(earliestDate).forEach(node => node.dataset.visaMonitorDate = earliestDate);
  const pageText = document.body?.innerText || "";
  const calendarPresent = Boolean(findCalendarRoot());
  const signedOut = !calendarPresent && (/sign\s*in|log\s*in|forgot password|session\s+expired|please\s+login/i.test(pageText) || document.querySelector("input[type='password']"));
  const structuralFingerprint = fingerprintPageStructure();
  return {
    state: signedOut ? "login_required" : earliestDate ? "dates_found" : "no_dates_visible",
    earliestDate,
    candidateCount: ordered.length,
    allDates: ordered.slice(0, 20),
    consulate,
    locationId,
    structuralFingerprint,
    structuralScope: calendarPresent ? "calendar-page" : signedOut ? "login-page" : "public-page",
    structuralSummary: structuralSummary(),
    message: signedOut
      ? "Sign in manually and open the official appointment calendar."
      : earliestDate
        ? `Earliest visible appointment: ${earliestDate}.`
        : calendarPresent
          ? "A calendar is visible, but no selectable available appointment dates were detected. Try changing month/post or adjust the selector if the portal changed markup."
          : "No appointment calendar is visible. Sign in manually and open the scheduling calendar."
  };
}

function extractConsulate() {
  const title = cleanConsulateText(document.querySelector("h1.page-title")?.innerText || "");
  if (title && title.includes("-")) {
    const candidate = cleanConsulateText(title.split("-").slice(1).join("-"));
    if (candidate) return candidate;
  }
  const hiddenName = cleanConsulateText(document.querySelector("input[name='locationName'], input[name='LocationName'], input[name*='location_name' i]")?.value || "");
  if (hiddenName) return hiddenName;
  const select = document.querySelector("#consulate, select[name='consulate'], select[name*='location' i], select[id*='location' i]");
  const selected = cleanConsulateText(select?.selectedOptions?.[0]?.innerText || "");
  if (selected) return selected;
  const labels = [...document.querySelectorAll("label, dt, strong, .field-label, .control-label")];
  for (const label of labels.slice(0, 80)) {
    if (!/consular|consulate|post|location/i.test(label.textContent || "")) continue;
    const container = label.closest("div, li, tr, section") || label.parentElement;
    const text = cleanConsulateText(container?.innerText || "");
    const match = text.match(/(?:consular\s+post|consulate|location)\s*:?\s*([A-Za-z][A-Za-z\s().-]{2,60})/i);
    if (match?.[1]) return cleanConsulateText(match[1]);
  }
  return null;
}

function extractLocationId() {
  const hidden = document.querySelector("input[name='locationId'], input[name='LocationId'], input[name*='location_id' i]");
  if (hidden?.value) return String(hidden.value).trim();
  const select = document.querySelector("#consulate, select[name='consulate'], select[name*='location' i], select[id*='location' i]");
  return select?.value ? String(select.value).trim() : null;
}

function cleanConsulateText(value) {
  return String(value || "").replace(/\s+/g, " ").replace(/^[-:]+|[-:]+$/g, "").trim() || null;
}

// Date extraction: supports explicit date attributes and visible datepicker day cells.
function dateFromNode(node, dateOrder) {
  const directValues = [
    node.dataset?.availableDate, node.dataset?.date, node.getAttribute?.("datetime"),
    node.getAttribute?.("aria-label"), node.getAttribute?.("title"), node.value, node.textContent
  ];
  for (const value of directValues) {
    const parsed = VisaDateParser.parseDateText(value, dateOrder);
    if (parsed) return parsed;
  }
  const dayText = String(node.textContent || node.value || "").trim();
  if (!/^\d{1,2}$/.test(dayText)) return null;
  const calendar = node.closest(".ui-datepicker-group, .ui-datepicker, .calendar, [role='grid'], [class*='calendar']") || document;
  const headerText = calendarHeaderText(calendar, node);
  return VisaDateParser.parseCalendarDay(dayText, headerText);
}

function isAvailableDateNode(node) {
  if (!node || !isVisible(node)) return false;
  if (node.disabled || node.getAttribute?.("aria-disabled") === "true") return false;
  const classText = String(node.className || "");
  const parentClass = String(node.parentElement?.className || "");
  const combinedClass = `${classText} ${parentClass}`;
  if (/disabled|unavailable|blocked|sold|past|off|closed|ui-datepicker-unselectable|ui-state-disabled|old|new|other-month/i.test(combinedClass)) return false;
  if (node.matches?.("[data-available-date], button[data-date], a[data-date], time[datetime], td[data-handler='selectDay'], [role='gridcell']:not([aria-disabled='true']) button, .calendar-day.available, .day.available")) return true;
  if (node.closest?.("td[data-handler='selectDay']")) return true;
  const dayText = String(node.textContent || node.value || "").trim();
  if (!/^\d{1,2}$/.test(dayText)) return true;
  return hasSelectableCalendarSignal(node);
}

function highlightDate(dateKey) {
  document.querySelectorAll(".visa-monitor-earlier-slot").forEach(node => node.classList.remove("visa-monitor-earlier-slot"));
  document.querySelectorAll(`[data-visa-monitor-date='${CSS.escape(dateKey)}']`).forEach(node => {
    node.classList.add("visa-monitor-earlier-slot");
    node.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function isVisible(node) {
  const rect = node.getBoundingClientRect?.();
  const style = getComputedStyle(node);
  return Boolean(rect && rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0);
}

function safeQueryAll(selector) {
  try { return [...document.querySelectorAll(selector)]; }
  catch { return [...document.querySelectorAll(DEFAULT_SELECTOR)]; }
}

function uniqueNodes(nodes) {
  return [...new Set(nodes.filter(Boolean))];
}

function findDatepickerDayNodes() {
  const roots = safeQueryAll(".ui-datepicker, .ui-datepicker-group, .calendar, [role='grid'], [class*='calendar']");
  return uniqueNodes(roots.flatMap(root => [...root.querySelectorAll("td, [role='gridcell'], button, a")].filter(node => /^\d{1,2}$/.test(String(node.textContent || node.value || "").trim()))));
}

function calendarHeaderText(calendar, node) {
  const localTitle = calendar.querySelector(".ui-datepicker-title, .ui-datepicker-header, .calendar-header, [class*='month'], [class*='header']");
  const localText = localTitle?.textContent || "";
  if (VisaDateParser.parseCalendarDay(String(node.textContent || "").trim(), localText)) return localText;
  const monthSelect = calendar.querySelector("select.ui-datepicker-month, select[name*='month' i]");
  const yearSelect = calendar.querySelector("select.ui-datepicker-year, select[name*='year' i]");
  const selectedMonth = monthSelect?.selectedOptions?.[0]?.textContent || monthSelect?.value || "";
  const selectedYear = yearSelect?.selectedOptions?.[0]?.textContent || yearSelect?.value || "";
  if (selectedMonth && selectedYear) return `${selectedMonth} ${selectedYear}`;
  const siblingTitle = node.closest(".ui-datepicker-group")?.querySelector(".ui-datepicker-title, .ui-datepicker-header");
  return siblingTitle?.textContent || localText || document.querySelector(".ui-datepicker-title, .calendar-header, [class*='month']")?.textContent || "";
}

function hasSelectableCalendarSignal(node) {
  const style = getComputedStyle(node);
  const parentStyle = node.parentElement ? getComputedStyle(node.parentElement) : null;
  const inline = `${node.getAttribute?.("style") || ""} ${node.parentElement?.getAttribute?.("style") || ""}`;
  const colorText = [
    style.borderColor, style.borderTopColor, style.outlineColor, style.backgroundColor,
    parentStyle?.borderColor, parentStyle?.borderTopColor, parentStyle?.outlineColor, parentStyle?.backgroundColor,
    inline
  ].join(" ");
  if (/green|#008000|0,\s*128,\s*0|34,\s*139,\s*34|46,\s*125,\s*50/i.test(colorText)) return true;
  if (/red|pink|#ff|255,\s*0,\s*0|255,\s*192,\s*203|255,\s*204,\s*204/i.test(colorText)) return false;
  if (style.cursor === "pointer" || parentStyle?.cursor === "pointer") return true;
  if (node.onclick || node.parentElement?.onclick) return true;
  return Boolean(node.querySelector?.("a, button") || node.closest?.("a, button"));
}

// Generic page utilities.
function isOfficialHost() {
  const host = location.hostname.toLowerCase();
  return OFFICIAL_HOSTS.some(official => host === official || host.endsWith(`.${official}`));
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

async function getSettings() {
  const { visaMonitorSettings } = await chrome.storage.sync.get("visaMonitorSettings");
  return { enabled: false, cutoffDate: "", intervalMinutes: 10, dateOrder: "mdy", availableDateSelector: "", targetConsulate: "", ...visaMonitorSettings };
}

function showBanner(text, mode = "ok") {
  let banner = document.getElementById("visa-monitor-banner");
  if (!banner) { banner = document.createElement("div"); banner.id = "visa-monitor-banner"; document.documentElement.appendChild(banner); }
  banner.textContent = text;
  banner.className = `visa-monitor-banner ${mode}`;
}

function playAlarm() {
  try {
    const context = new AudioContext();
    const gain = context.createGain(); gain.gain.value = .12; gain.connect(context.destination);
    [740, 988, 1175].forEach((frequency, index) => { const oscillator = context.createOscillator(); oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start(context.currentTime + index * .22); oscillator.stop(context.currentTime + index * .22 + .18); });
    setTimeout(() => context.close(), 1100);
  } catch { /* OS notification remains available when page audio is blocked. */ }
}
