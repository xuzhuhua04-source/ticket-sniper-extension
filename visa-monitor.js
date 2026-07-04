const elements = {
  targetUrl: document.getElementById("target-url"),
  targetConsulate: document.getElementById("target-consulate"),
  cutoffDate: document.getElementById("cutoff-date"),
  interval: document.getElementById("monitor-interval"),
  mode: document.getElementById("mode"),
  evidenceSource: document.getElementById("evidence-source"),
  analyzeNow: document.getElementById("analyze-now"),
  openSecureBrowser: document.getElementById("open-secure-browser"),
  analyzeRendered: document.getElementById("analyze-rendered"),
  secureBrowserStatus: document.getElementById("secure-browser-status"),
  toggle: document.getElementById("toggle-monitor"),
  exportJson: document.getElementById("export-json"),
  state: document.getElementById("monitor-state"),
  title: document.getElementById("status-title"),
  message: document.getElementById("status-message"),
  time: document.getElementById("status-time"),
  severity: document.getElementById("diagnostic-severity"),
  factCount: document.getElementById("fact-count"),
  channelCount: document.getElementById("channel-count"),
  highCount: document.getElementById("high-count"),
  calendarCount: document.getElementById("calendar-count"),
  cards: document.getElementById("diagnostic-cards"),
  table: document.getElementById("fact-table")
};

let running = false;
let timer = null;
let lastResult = null;
let analyzing = false;
let secureBrowserOpen = false;
let lastServerEventTimestamp = 0;
const MONITOR_POLL_MS = 1000;
const MAX_NOTIFIED_KEYS = 120;
const alertState = loadAlertState();

loadSettings();
wireEvents();

function wireEvents() {
  elements.analyzeNow.addEventListener("click", () => {
    requestNotificationPermission();
    analyzeOnce();
  });
  elements.openSecureBrowser.addEventListener("click", openSecureBrowser);
  elements.analyzeRendered.addEventListener("click", () => {
    requestNotificationPermission();
    analyzeRenderedPage();
  });
  elements.toggle.addEventListener("click", toggleMonitoring);
  elements.exportJson.addEventListener("click", exportJson);
  for (const input of [elements.targetUrl, elements.targetConsulate, elements.cutoffDate, elements.interval, elements.mode, elements.evidenceSource]) {
    input.addEventListener("change", saveSettings);
  }
  elements.targetUrl.addEventListener("input", () => {
    saveSettings();
    resetCurrentResultForTargetChange();
  });
  refreshSecureBrowserStatus();
  setInterval(refreshSecureBrowserStatus, MONITOR_POLL_MS);
}

function loadSettings() {
  const saved = safeJson(localStorage.getItem("visaMonitorStandaloneSettings"), {});
  elements.targetUrl.value = isOfficialUrl(saved.url) ? saved.url : "";
  elements.targetConsulate.value = saved.consulate || "";
  elements.cutoffDate.value = saved.cutoffDate || "";
  elements.interval.value = String(saved.intervalSeconds || 5);
  elements.mode.value = saved.mode || "structural";
  elements.evidenceSource.value = saved.evidenceSource || localStorage.getItem("visaMonitorEvidenceSource") || "fetch";
}

function saveSettings() {
  localStorage.setItem("visaMonitorStandaloneSettings", JSON.stringify({
    url: elements.targetUrl.value.trim(),
    consulate: elements.targetConsulate.value.trim(),
    cutoffDate: elements.cutoffDate.value,
    intervalSeconds: Number(elements.interval.value) || 5,
    mode: elements.mode.value,
    evidenceSource: elements.evidenceSource.value
  }));
  localStorage.setItem("visaMonitorEvidenceSource", elements.evidenceSource.value);
}

async function toggleMonitoring() {
  if (running) {
    running = false;
    renderMonitoringState();
    stopMonitorLoop();
    if (elements.evidenceSource.value === "secure") await stopSecureVisaMonitor();
    return;
  }
  await requestNotificationPermission();
  if (elements.evidenceSource.value === "secure") {
    const ok = await startSecureVisaMonitor();
    running = Boolean(ok);
    renderMonitoringState();
    if (ok) startMonitorLoop();
    return;
  }
  const ok = await analyzeOnce({ forceStatus: true });
  if (!ok) {
    running = false;
    renderMonitoringState();
    return;
  }
  running = true;
  renderMonitoringState();
  startMonitorLoop();
}

function renderMonitoringState() {
  elements.toggle.textContent = running ? "Stop monitoring" : "Start monitoring";
  elements.toggle.classList.toggle("danger", running);
  elements.state.textContent = running ? "active" : "idle";
  elements.state.className = `state-pill ${running ? "active" : "idle"}`;
}

function startMonitorLoop() {
  stopMonitorLoop();
  if (!running) return;
  timer = setInterval(() => {
    if (elements.evidenceSource.value === "secure") pollSecureVisaMonitor();
    else analyzeOnce({ quiet: true, live: true });
  }, MONITOR_POLL_MS);
}

function stopMonitorLoop() {
  clearInterval(timer);
  timer = null;
}

function hasLiveTarget() {
  return elements.evidenceSource.value === "secure" ? secureBrowserOpen : Boolean(elements.targetUrl.value.trim());
}

async function analyzeOnce(options = {}) {
  if (analyzing) return false;
  saveSettings();
  if (elements.evidenceSource.value === "secure") return analyzeRenderedPage(options);
  const rawUrl = elements.targetUrl.value.trim();
  if (!rawUrl) {
    if (!options.quiet) renderError("Enter a website URL first.", { stopMonitoring: true });
    return false;
  }
  if (!isOfficialUrl(rawUrl)) {
    if (!options.quiet) renderError("Visa Monitor only accepts official visa scheduling URLs.", { stopMonitoring: true });
    return false;
  }
  analyzing = true;
  if (!options.quiet || options.forceStatus) setStatus("Analyzing", `Fetching and analyzing ${rawUrl} locally.`, "active");
  try {
    const response = await fetch(`/api/analyze-url?url=${encodeURIComponent(rawUrl)}`);
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || `Analysis failed with HTTP ${response.status}`);
    lastResult = result;
    saveAnalysisSummary("visaMonitorStandaloneSummary", result);
    renderResult(result);
    await evaluateVisaAlerts(result);
    return true;
  } catch (error) {
    renderError(error.message || String(error));
    return false;
  } finally {
    analyzing = false;
  }
}

async function openSecureBrowser() {
  saveSettings();
  const rawUrl = elements.targetUrl.value.trim();
  if (rawUrl && !isOfficialUrl(rawUrl)) {
    renderError("Visa Monitor only opens official visa scheduling or official visa login URLs.");
    return;
  }
  await requestNotificationPermission();
  setStatus("Opening secure browser", "A persistent browser profile is opening. Sign in manually there; Ticket Sniper will only read rendered structure.", "active");
  try {
    const response = await fetch("/api/secure-browser/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: rawUrl })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || `Secure browser failed with HTTP ${response.status}`);
    elements.evidenceSource.value = "secure";
    saveSettings();
    renderSecureBrowserStatus(result);
    setStatus("Secure browser ready", "Use the opened browser to sign in manually, then click Analyze rendered page or Start monitoring.", "low");
  } catch (error) {
    renderError(error.message || String(error));
  }
}

async function analyzeRenderedPage(options = {}) {
  if (analyzing) return false;
  analyzing = true;
  saveSettings();
  if (!options.quiet) setStatus("Analyzing rendered page", "Reading the active secure browser page without storing credentials or submitting anything.", "active");
  try {
    const rawUrl = elements.targetUrl.value.trim();
    if (rawUrl && !isOfficialUrl(rawUrl)) {
      if (!options.quiet) renderError("Visa Monitor only accepts official visa scheduling URLs.", { stopMonitoring: true });
      return false;
    }
    const shouldNavigate = options.navigate === true;
    const endpoint = shouldNavigate && rawUrl ? `/api/secure-browser/analyze?url=${encodeURIComponent(rawUrl)}` : "/api/secure-browser/analyze";
    const response = await fetch(endpoint);
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || `Rendered analysis failed with HTTP ${response.status}`);
    lastResult = result;
    saveAnalysisSummary("visaMonitorStandaloneSummary", result);
    localStorage.setItem("visaMonitorEvidenceSource", "secure");
    renderResult(result);
    await evaluateVisaAlerts(result);
    refreshSecureBrowserStatus();
    return true;
  } catch (error) {
    renderError(error.message || String(error));
    return false;
  } finally {
    analyzing = false;
  }
}

async function startSecureVisaMonitor() {
  saveSettings();
  const rawUrl = elements.targetUrl.value.trim();
  if (rawUrl && !isOfficialUrl(rawUrl)) {
    renderError("Visa Monitor only accepts official visa scheduling or official visa login URLs.", { stopMonitoring: true });
    return false;
  }
  if (!secureBrowserOpen) await refreshSecureBrowserStatus();
  if (!secureBrowserOpen) {
    renderError("Open the secure browser and sign in manually before starting rendered-page visa monitoring.", { stopMonitoring: true });
    return false;
  }
  setStatus("Starting visa monitor", "Monitoring the already-open secure browser page. No new tabs are opened.", "active");
  try {
    const response = await fetch("/api/visa-monitor/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: rawUrl,
        consulate: elements.targetConsulate.value.trim(),
        cutoffDate: elements.cutoffDate.value,
        intervalMs: Math.max(1000, Number(elements.interval.value || 5) * 1000)
      })
    });
    const status = await response.json();
    if (!response.ok || !status.ok) throw new Error(status.error || `Visa monitor failed with HTTP ${response.status}`);
    renderSecureVisaMonitorStatus(status);
    return true;
  } catch (error) {
    renderError(error.message || String(error), { stopMonitoring: true });
    return false;
  }
}

async function stopSecureVisaMonitor() {
  await fetch("/api/visa-monitor/stop", { method: "POST" }).catch(() => null);
}

async function pollSecureVisaMonitor() {
  try {
    const response = await fetch("/api/visa-monitor/status");
    const status = await response.json();
    if (!response.ok || !status.ok) throw new Error(status.error || `Visa monitor status failed with HTTP ${response.status}`);
    renderSecureVisaMonitorStatus(status);
  } catch (error) {
    renderError(error.message || String(error));
  }
}

async function renderSecureVisaMonitorStatus(status) {
  renderSecureBrowserStatus(status.secureBrowser || {});
  if (status.lastResult) {
    lastResult = status.lastResult;
    saveAnalysisSummary("visaMonitorStandaloneSummary", status.lastResult);
    renderResult(status.lastResult);
  }
  if (status.lastError) {
    setStatus("Visa monitor waiting", status.lastError, "medium");
  } else if (status.running && !status.lastResult) {
    setStatus("Visa monitor active", "Waiting for the first secure browser sample.", "active");
  }
  for (const event of [...(status.events || [])].reverse()) {
    if (!event.timestamp || event.timestamp <= lastServerEventTimestamp) continue;
    lastServerEventTimestamp = Math.max(lastServerEventTimestamp, event.timestamp);
    await notifyVisaMonitor(event.key || `${event.kind}:${event.timestamp}`, event.title, event.message, event.severity || "medium");
  }
}

async function refreshSecureBrowserStatus() {
  try {
    const response = await fetch("/api/secure-browser/status");
    const result = await response.json();
    if (response.ok && result.ok) renderSecureBrowserStatus(result);
  } catch {
    elements.secureBrowserStatus.textContent = "Local secure browser service is not reachable.";
  }
}

function renderSecureBrowserStatus(status) {
  secureBrowserOpen = status.state === "secure_browser_open";
  const page = status.pageUrl ? ` Active page: ${status.pageUrl}` : "";
  elements.secureBrowserStatus.textContent = status.state === "secure_browser_open"
    ? `Open with ${status.pageCount || 0} page${status.pageCount === 1 ? "" : "s"}.${page}`
    : "Closed. Open it, sign in manually, then monitor the active rendered page.";
}

function renderResult(result) {
  const facts = Object.values(result.diagnostics.runtimeFactChannels || {}).flat();
  const channels = Object.keys(result.diagnostics.runtimeFactChannels || {});
  const high = facts.filter(fact => fact.value?.severity === "high").length;
  const calendarFact = facts.find(fact => fact.type === "calendar-structure");
  const renderedFact = facts.find(fact => fact.source === "browser" && fact.type === "rendered-dom-snapshot");
  const calendarHints = (calendarFact ? (calendarFact.value?.dateLikeCount || 0) + (calendarFact.value?.selectableHints || 0) : 0) + (renderedFact?.value?.selectableCalendarCells || 0);
  const severity = high ? "high" : facts.some(fact => fact.value?.severity === "medium") ? "medium" : "low";
  const title = elements.mode.value === "visa" ? visaTitle(result, calendarFact) : `Analyzed ${result.diagnostics.runtimeFactStatus.host}`;
  const message = elements.mode.value === "visa" ? visaMessage(result, calendarFact) : result.diagnostics.runtimeFactStatus.message;
  setStatus(title, message, severity);
  elements.factCount.textContent = String(facts.length);
  elements.channelCount.textContent = String(channels.length);
  elements.highCount.textContent = String(high);
  elements.calendarCount.textContent = String(calendarHints);
  elements.severity.textContent = severity;
  elements.severity.className = `state-pill ${severity}`;
  elements.cards.innerHTML = renderCards(result, facts);
  elements.table.innerHTML = renderRows(facts);
}

function visaTitle(result, calendarFact) {
  if (!isOfficialResult(result)) return "Non-official URL analyzed";
  if (calendarFact?.value?.hasCalendar) return "Visa portal calendar structure detected";
  return "Visa portal public structure analyzed";
}

function visaMessage(result, calendarFact) {
  const consulate = elements.targetConsulate.value.trim();
  const consulateNote = consulate ? ` Consulate filter: ${consulate}.` : "";
  if (!isOfficialResult(result)) return "This URL is not one of the configured official visa scheduling hosts.";
  if (calendarFact?.value?.hasCalendar) return `Calendar-like markup exists in the fetched page. Dynamic authenticated slots may still require manual sign-in.${consulateNote}`;
  return `No calendar markup was found in the fetched public HTML. If the calendar is behind login or rendered after JavaScript, use the diagnostics page to monitor structural changes.${consulateNote}`;
}

function renderCards(result, facts) {
  const status = result.diagnostics.runtimeFactStatus;
  const important = facts.filter(fact => ["high", "medium"].includes(fact.value?.severity)).slice(0, 4);
  const cards = [
    { title: "Target", severity: "low", detail: `${result.finalUrl}` },
    { title: "Classification", severity: status.severity || "low", detail: result.diagnostics.structuralPipelineLatest?.classification || "No classification" },
    ...important.map(fact => ({ title: `${fact.source}/${fact.type}`, severity: fact.value?.severity || "low", detail: summarizeFact(fact) }))
  ];
  return cards.map(card => `<article class="diagnostic-card ${escapeHtml(card.severity)}"><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.detail)}</p></article>`).join("");
}

function renderRows(facts) {
  return facts.length ? facts.slice(0, 120).map(fact => `
    <tr>
      <td>${escapeHtml(new Date(fact.timestamp).toLocaleString())}</td>
      <td>${escapeHtml(`${fact.source}/${fact.type}`)}</td>
      <td>${escapeHtml(fact.value?.severity || "low")}</td>
      <td>${escapeHtml(summarizeFact(fact))}</td>
    </tr>
  `).join("") : `<tr><td colspan="4" class="empty">No facts yet.</td></tr>`;
}

function summarizeFact(fact) {
  if (fact.source === "network") return `${fact.type}: ${fact.value?.status || ""} ${fact.value?.contentType || ""}`.trim();
  if (fact.source === "browser") return `${fact.type}: calendar cells ${fact.value?.calendarCells ?? 0}, selectable ${fact.value?.selectableCalendarCells ?? 0}, consulate ${fact.value?.consulate || "not found"}`;
  if (fact.source === "dom") return `${fact.type}: forms ${fact.value?.forms ?? 0}, inputs ${fact.value?.inputs ?? 0}, scripts ${fact.value?.scripts ?? 0}`;
  if (fact.source === "anti_crawler") return `${fact.value?.provider || "provider"} ${fact.value?.kind || fact.type}`;
  if (fact.source === "runtime") return `${fact.type}: ${(fact.value?.frameworks || []).join(", ") || "structural profile"}`;
  return `${fact.source}/${fact.type}`;
}

function setStatus(title, message, state) {
  elements.title.textContent = title;
  elements.message.textContent = message;
  elements.time.textContent = `Last checked ${new Date().toLocaleString()}`;
  elements.state.textContent = state || "ready";
  elements.state.className = `state-pill ${state || "low"}`;
}

function renderError(message, options = {}) {
  setStatus("Analysis failed", message, "error");
  if (running && options.stopMonitoring) {
    running = false;
    renderMonitoringState();
    stopMonitorLoop();
  }
}

function resetCurrentResultForTargetChange() {
  lastResult = null;
  elements.factCount.textContent = "0";
  elements.channelCount.textContent = "0";
  elements.highCount.textContent = "0";
  elements.calendarCount.textContent = "0";
  elements.cards.innerHTML = `<p class="empty">Target changed. Run analysis or start monitoring.</p>`;
  elements.table.innerHTML = `<tr><td colspan="4" class="empty">Target changed. No facts for this URL yet.</td></tr>`;
  if (!running) setStatus("Target changed", "Run analysis or start monitoring for this visa scheduling target.", "idle");
}

function exportJson() {
  if (!lastResult) return renderError("Run analysis before exporting.");
  const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `visa-monitor-analysis-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function saveAnalysisSummary(key, result) {
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
  try {
    localStorage.setItem(key, JSON.stringify(summary));
  } catch {
    // Full diagnostics stay in memory; localStorage is intentionally summary-only.
  }
}

function loadAlertState() {
  const keys = safeJson(localStorage.getItem("visaMonitorNotifiedKeys"), []);
  const baselines = safeJson(localStorage.getItem("visaMonitorStructuralBaselines"), {});
  return {
    notifiedKeys: new Set(Array.isArray(keys) ? keys : []),
    structuralBaselines: baselines && typeof baselines === "object" && !Array.isArray(baselines) ? baselines : {}
  };
}

function persistAlertState() {
  const keys = [...alertState.notifiedKeys].slice(-MAX_NOTIFIED_KEYS);
  alertState.notifiedKeys = new Set(keys);
  try {
    localStorage.setItem("visaMonitorNotifiedKeys", JSON.stringify(keys));
    localStorage.setItem("visaMonitorStructuralBaselines", JSON.stringify(alertState.structuralBaselines));
  } catch {
    // Alerts still work in-memory if browser storage is full or blocked.
  }
}

async function evaluateVisaAlerts(result) {
  if (!result || !isOfficialResult(result)) return;
  if (!matchesConsulateFilter(result)) return;

  const facts = flattenFacts(result);
  const earlier = findEarlierAppointmentDate(result, facts);
  if (earlier) {
    const key = `earlier:${monitorTargetKey(result)}:${earlier.key}`;
    await notifyVisaMonitor(
      key,
      "Earlier visa appointment found",
      `${earlier.key} is earlier than your cutoff of ${elements.cutoffDate.value}. Source: ${earlier.source}.`,
      "high"
    );
  }

  const structuralSignature = buildStructuralSignature(result, facts);
  if (!structuralSignature) return;
  const baselineKey = monitorTargetKey(result);
  const previous = alertState.structuralBaselines[baselineKey];
  if (!previous) {
    alertState.structuralBaselines[baselineKey] = structuralSignature;
    persistAlertState();
    return;
  }
  if (previous !== structuralSignature) {
    alertState.structuralBaselines[baselineKey] = structuralSignature;
    persistAlertState();
    await notifyVisaMonitor(
      `structure:${baselineKey}:${structuralSignature}`,
      "Visa page structure changed",
      "Ticket Sniper detected a structural change in the monitored visa page.",
      "medium"
    );
  }
}

function findEarlierAppointmentDate(result, facts) {
  const cutoff = parseCutoffDate();
  if (!cutoff) return null;
  const candidates = collectDateCandidates(facts);
  const parsed = candidates
    .map(candidate => ({ ...candidate, date: parseVisaDate(candidate.text) }))
    .filter(candidate => candidate.date && candidate.date.getTime() < cutoff.getTime())
    .sort((left, right) => left.date - right.date);
  const earliest = parsed[0];
  return earliest ? { ...earliest, key: window.VisaDateParser.dayKey(earliest.date) } : null;
}

function collectDateCandidates(facts) {
  const candidates = [];
  for (const fact of facts) {
    if (fact.type === "calendar-structure") {
      for (const text of fact.value?.dateCandidates || []) candidates.push({ text, source: "calendar markup" });
    }
    if (fact.source === "browser" && fact.type === "rendered-dom-snapshot") {
      for (const item of fact.value?.availableDates || []) {
        if (item?.text) candidates.push({ text: item.text, source: "rendered calendar" });
        if (item?.label) candidates.push({ text: item.label, source: "rendered calendar label" });
      }
    }
  }
  const seen = new Set();
  return candidates.filter(candidate => {
    const key = candidate.text.toLowerCase();
    if (!candidate.text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseCutoffDate() {
  const raw = elements.cutoffDate.value;
  if (!raw) return null;
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function parseVisaDate(text) {
  return window.VisaDateParser?.parseDateText(text, "mdy") || null;
}

function buildStructuralSignature(result, facts) {
  const rendered = facts.find(fact => fact.source === "browser" && fact.type === "rendered-dom-snapshot")?.value || {};
  const calendar = facts.find(fact => fact.type === "calendar-structure")?.value || {};
  const structure = facts.find(fact => fact.type === "structure-snapshot")?.value || {};
  const status = result.diagnostics?.runtimeFactStatus || {};
  const channelCounts = Object.entries(result.diagnostics?.runtimeFactChannels || {})
    .map(([channel, items]) => `${channel}:${items.length}`)
    .sort()
    .join("|");
  return hashString([
    status.host,
    status.path,
    result.diagnostics?.structuralPipelineLatest?.classification || "",
    rendered.signature || "",
    rendered.calendarCells || 0,
    rendered.selectableCalendarCells || 0,
    rendered.consulate || "",
    calendar.hasCalendar || false,
    calendar.dateLikeCount || 0,
    calendar.selectableHints || 0,
    (calendar.dateCandidates || []).join("|"),
    structure.forms || 0,
    structure.inputs || 0,
    structure.buttons || 0,
    structure.scripts || 0,
    channelCounts
  ].join("::"));
}

function matchesConsulateFilter(result) {
  const requested = normalizeText(elements.targetConsulate.value);
  if (!requested) return true;
  const renderedConsulate = flattenFacts(result)
    .find(fact => fact.source === "browser" && fact.type === "rendered-dom-snapshot")
    ?.value?.consulate;
  return !renderedConsulate || normalizeText(renderedConsulate).includes(requested);
}

function monitorTargetKey(result) {
  const url = safeUrl(result.finalUrl || result.requestedUrl);
  const consulate = normalizeText(elements.targetConsulate.value) || normalizeText(flattenFacts(result)
    .find(fact => fact.source === "browser" && fact.type === "rendered-dom-snapshot")
    ?.value?.consulate);
  return hashString(`${url?.hostname || "unknown"}${url?.pathname || ""}:${consulate}`);
}

async function notifyVisaMonitor(key, title, body, severity) {
  if (alertState.notifiedKeys.has(key)) return;
  alertState.notifiedKeys.add(key);
  persistAlertState();
  setStatus(title, body, severity);
  if (!("Notification" in window)) return;
  const permission = await requestNotificationPermission();
  if (permission === "granted") {
    try {
      new Notification(title, { body, tag: key, renotify: true });
    } catch {
      // The in-page status card still records the alert if the browser blocks system notifications.
    }
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function flattenFacts(result) {
  return Object.values(result?.diagnostics?.runtimeFactChannels || {}).flat();
}

function safeJson(raw, fallback) {
  try {
    return JSON.parse(raw || "");
  } catch {
    return fallback;
  }
}

function safeUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isOfficialUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ["usvisascheduling.com", "atlasauth.b2clogin.com", "ais.usvisa-info.com", "ustraveldocs.com", "cgifederal.secure.force.com"]
      .some(official => host === official || host.endsWith(`.${official}`));
  } catch {
    return false;
  }
}

function isOfficialResult(result) {
  return isOfficialUrl(result?.finalUrl) || isOfficialUrl(result?.requestedUrl);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}
