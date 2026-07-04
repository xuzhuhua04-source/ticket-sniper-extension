importScripts("fact-normalizer.js", "organ-pipeline.js", "organ-frequency-engine.js");

const ALARM_NAME = "official-visa-appointment-check";
const GMAIL_ALARM_NAME = "gmail-api-timestamp-check";
const NOTIFICATION_ID = "visa-earlier-slot";
const CALENDAR_NOTIFICATION_ID = "visa-calendar-update";
const STRUCTURAL_NOTIFICATION_ID = "visa-public-structure-update";
const CRAWLER_SIGNAL_NOTIFICATION_ID = "visa-crawler-signal";
const RUNTIME_FACT_NOTIFICATION_ID = "visa-runtime-fact";
const GMAIL_NOTIFICATION_ID = "gmail-latest-timestamp-update";
const OFFICIAL_PATTERNS = [
  "https://*.usvisascheduling.com/*",
  "https://atlasauth.b2clogin.com/*",
  "https://ais.usvisa-info.com/*",
  "https://*.ustraveldocs.com/*",
  "https://cgifederal.secure.force.com/*"
];
const RUNTIME_FACT_LEDGER_LIMIT = 600;
const RUNTIME_FACT_HISTORY_LIMIT = 100;
const RUNTIME_FACT_CHANNEL_LIMIT = 40;
const RUNTIME_FACT_CHANNEL_ITEM_LIMIT = 80;
const RUNTIME_DIAGNOSTICS_STORAGE_KEYS = [
  "runtimeFactChannels",
  "runtimeFactHistory",
  "runtimeFactStatus",
  "runtimeFactLedger",
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
];
let runtimeFactWriteQueue = Promise.resolve();
const runtimeTargetWriteCache = new Map();

// Lifecycle and alarms.
chrome.runtime.onInstalled.addListener(scheduleAllAlarms);
chrome.runtime.onStartup.addListener(scheduleAllAlarms);
chrome.tabs.onActivated.addListener(activeInfo => rememberRuntimeTab(activeInfo.tabId).catch(() => {}));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") rememberRuntimeTab(tabId, tab).catch(() => {});
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) checkOfficialTabs("scheduled");
  if (alarm.name === GMAIL_ALARM_NAME) pollGmail("scheduled", false).catch(recordGmailError);
});
chrome.notifications.onClicked.addListener(async notificationId => {
  const isGmailNotification = notificationId === GMAIL_NOTIFICATION_ID || notificationId.startsWith(`${GMAIL_NOTIFICATION_ID}-`);
  if (![NOTIFICATION_ID, CALENDAR_NOTIFICATION_ID, STRUCTURAL_NOTIFICATION_ID, CRAWLER_SIGNAL_NOTIFICATION_ID, RUNTIME_FACT_NOTIFICATION_ID].includes(notificationId) && !isGmailNotification) return;
  if (notificationId === CALENDAR_NOTIFICATION_ID) {
    await openReschedulePage();
    return;
  }
  const { visaMonitorStatus, gmailMonitorStatus, structuralMonitorStatus, crawlerSignalStatus, runtimeFactStatus } = await chrome.storage.local.get(["visaMonitorStatus", "gmailMonitorStatus", "structuralMonitorStatus", "crawlerSignalStatus", "runtimeFactStatus"]);
  const targetStatus = isGmailNotification ? gmailMonitorStatus : visaMonitorStatus;
  const effectiveStatus = notificationId === STRUCTURAL_NOTIFICATION_ID ? structuralMonitorStatus : notificationId === CRAWLER_SIGNAL_NOTIFICATION_ID ? crawlerSignalStatus : notificationId === RUNTIME_FACT_NOTIFICATION_ID ? runtimeFactStatus : targetStatus;
  if (isGmailNotification && !targetStatus?.tabId) {
    await chrome.tabs.create({ url: "https://mail.google.com/" });
    return;
  }
  if (effectiveStatus?.tabId) {
    try { const tab = await chrome.tabs.get(effectiveStatus.tabId); await chrome.windows.update(tab.windowId, { focused: true }); await chrome.tabs.update(tab.id, { active: true }); } catch { /* The monitored tab was closed. */ }
  }
});
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === CALENDAR_NOTIFICATION_ID && buttonIndex === 0) await openReschedulePage();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.visaMonitorSettings) scheduleAllAlarms();
});

// Message router from popup/content scripts.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_NOW") checkOfficialTabs("manual").then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "SLOT_SCAN_RESULT") handleScanResult(message.payload, sender.tab).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "CALENDAR_DOM_UPDATED") handleCalendarUpdate(message.payload, sender.tab).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "STRUCTURAL_DOM_UPDATED") handleStructuralUpdate(message.payload, sender.tab, "mutation").then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "CRAWLER_SIGNAL_DETECTED") handleCrawlerSignal(message.payload, sender.tab).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "RUNTIME_FACT_DETECTED") handleRuntimeFact(message.payload, sender.tab).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "SET_RUNTIME_DIAGNOSTICS_TARGET") setRuntimeDiagnosticsTarget(message.payload).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "ENSURE_RUNTIME_DIAGNOSTICS_TARGET") ensureRuntimeDiagnosticsTarget(message.payload).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "UPDATE_GMAIL_MONITOR") updateGmailMonitor(message.payload).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "CHECK_GMAIL_NOW") pollGmail("manual", true).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "DISCONNECT_GMAIL") disconnectGmail().then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "GET_PENDING_RESCHEDULE") getPendingReschedule(sender.tab).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "CLEAR_PENDING_RESCHEDULE") clearPendingReschedule(sender.tab).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "UPDATE_MONITOR") updateMonitor(message.payload).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else return false;
  return true;
});

// Monitor scheduling.
async function scheduleAllAlarms() {
  await Promise.all([scheduleAlarm(), scheduleGmailAlarm()]);
}

async function scheduleAlarm() {
  const settings = await getSettings();
  await chrome.alarms.clear(ALARM_NAME);
  if (!settings.enabled) return;
  const intervalMinutes = Math.max(5, Number(settings.intervalMinutes) || 10);
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: .1, periodInMinutes: intervalMinutes });
}

async function scheduleGmailAlarm() {
  const settings = await getSettings();
  await chrome.alarms.clear(GMAIL_ALARM_NAME);
  if (!settings.gmailEnabled) return;
  const intervalMinutes = Math.max(1, Number(settings.gmailIntervalMinutes) || 2);
  chrome.alarms.create(GMAIL_ALARM_NAME, { delayInMinutes: 0.1, periodInMinutes: intervalMinutes });
}

async function updateMonitor(payload) {
  const current = await getSettings();
  const next = {
    ...current,
    enabled: Boolean(payload.enabled),
    cutoffDate: payload.cutoffDate || "",
    intervalMinutes: Math.max(5, Number(payload.intervalMinutes) || 10)
  };
  await chrome.storage.sync.set({ visaMonitorSettings: next });
  if (!next.enabled) { await chrome.storage.local.remove(["lastAlertedSlot"]); await chrome.action.setBadgeText({ text: "" }); }
  await scheduleAlarm();
  await updateStatus({ state: next.enabled ? "armed" : "stopped", message: next.enabled ? "Monitoring official appointment tabs." : "Monitoring stopped." });
  if (next.enabled) return checkOfficialTabs("armed");
  return { ok: true, status: "stopped" };
}

async function updateGmailMonitor(payload) {
  const current = await getSettings();
  const mailbox = ["inbox", "sent", "both"].includes(payload?.mailbox) ? payload.mailbox : "both";
  const intervalMinutes = Math.max(1, Number(payload?.intervalMinutes) || current.gmailIntervalMinutes || 2);
  const next = { ...current, gmailEnabled: Boolean(payload?.enabled), gmailMailbox: mailbox, gmailIntervalMinutes: intervalMinutes };
  if (!current.gmailEnabled || current.gmailMailbox !== mailbox) await chrome.storage.local.remove(["gmailLastMessage", "gmailHistoryState"]);
  await chrome.storage.sync.set({ visaMonitorSettings: next });
  await scheduleGmailAlarm();
  if (!next.gmailEnabled) {
    await chrome.storage.local.set({ gmailMonitorStatus: { state: "gmail_stopped", message: "Gmail API monitoring is off.", checkedAt: Date.now() } });
    return { ok: true, enabled: false, mailbox };
  }
  try {
    return await pollGmail("enabled", true);
  } catch (error) {
    await chrome.storage.sync.set({ visaMonitorSettings: { ...next, gmailEnabled: false } });
    await scheduleGmailAlarm();
    await chrome.storage.local.set({ gmailMonitorStatus: { state: "gmail_auth_error", message: error.message, checkedAt: Date.now() } });
    throw error;
  }
}

async function recordGmailError(error) {
  await chrome.storage.local.set({
    gmailMonitorStatus: { state: "gmail_api_error", message: error.message || String(error), checkedAt: Date.now() }
  });
}

// Official calendar tab scanning.
async function checkOfficialTabs(reason) {
  const settings = await getSettings();
  if (!settings.enabled && reason !== "manual") return { ok: false, status: "disabled" };
  const tabs = await chrome.tabs.query({ url: OFFICIAL_PATTERNS });
  if (!tabs.length) {
    await updateStatus({ state: "waiting_for_tab", message: "Open and sign in to the official visa appointment calendar.", checkedAt: Date.now() });
    return { ok: false, status: "no_official_tab" };
  }

  const results = [];
  for (const tab of tabs) {
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_APPOINTMENTS", payload: { reason } });
      results.push({ tabId: tab.id, ...result });
    } catch (error) {
      results.push({ tabId: tab.id, ok: false, error: error.message });
    }
  }
  const successful = results.find(result => result.ok);
  if (!successful) await updateStatus({ state: "scan_unavailable", message: "The official tab is open, but no appointment calendar is currently readable.", checkedAt: Date.now() });
  return { ok: Boolean(successful), results };
}

async function handleScanResult(payload, tab) {
  const settings = await getSettings();
  const consulateGate = evaluateConsulateGate(payload, settings);
  const status = {
    tabId: tab?.id,
    host: tab?.url ? new URL(tab.url).hostname : "",
    checkedAt: Date.now(),
    candidateCount: payload.candidateCount || 0,
    earliestDate: payload.earliestDate || null,
    consulate: payload.consulate || null,
    locationId: payload.locationId || null,
    targetConsulate: settings.targetConsulate || "",
    consulateMatched: consulateGate.matches,
    state: payload.state || "checked",
    message: consulateGate.blocked
      ? `Calendar belongs to ${payload.consulate || "an unknown consulate"}, not ${settings.targetConsulate}. No visa slot notification was sent.`
      : payload.message || "Appointment calendar checked."
  };
  await updateStatus(status);
  const structuralAlert = await evaluateStructuralScan(payload, tab, settings);
  if (structuralAlert?.alerted && !payload.earliestDate) return { ok: true, alerted: true, alertType: "structural_update" };
  if (!settings.enabled || consulateGate.blocked || !payload.earliestDate || !settings.cutoffDate) return { ok: true, alerted: false, consulateMatched: consulateGate.matches };

  const earlier = payload.earliestDate < settings.cutoffDate;
  const { lastAlertedSlot } = await chrome.storage.local.get("lastAlertedSlot");
  if (!earlier || lastAlertedSlot === payload.earliestDate) return { ok: true, alerted: false };
  await chrome.storage.local.set({ lastAlertedSlot: payload.earliestDate });
  await chrome.action.setBadgeBackgroundColor({ color: "#C53030" });
  await chrome.action.setBadgeText({ text: "EARLY" });
  await chrome.notifications.create(NOTIFICATION_ID, {
    type: "basic",
    iconUrl: "icon-128.png",
    title: "Earlier U.S. visa appointment found",
    message: `${payload.earliestDate} is earlier than your ${settings.cutoffDate} cutoff. Open the official tab and book it manually.`,
    priority: 2,
    requireInteraction: true
  });
  await updateStatus({ ...status, state: "earlier_found", message: `Earlier appointment found: ${payload.earliestDate}` });
  await forwardCompanionEvent({
    id: `appointment-${payload.earliestDate}`,
    type: "earlier_appointment",
    title: "Earlier visa appointment found",
    message: `${payload.earliestDate} is earlier than your configured cutoff. Review and book manually.`,
    url: settings.rescheduleUrl,
    occurredAt: Date.now()
  });
  return { ok: true, alerted: true };
}

async function handleCrawlerSignal(payload, tab) {
  if (!isOfficialPortalUrl(tab?.url)) throw new Error("Crawler signals are accepted only from supported official visa portals.");
  const settings = await getSettings();
  if (!settings.enabled || !payload?.fact) return { ok: true, alerted: false };
  const fact = normalizeCrawlerFact(payload.fact);
  const key = crawlerSignalKey(tab.url, fact);
  const pipelineResult = await processStructuralFactPipeline(fact, tab, {
    page: payload.page,
    source: "crawler",
    batchId: `crawler:${new URL(tab.url).hostname}:${Math.floor((payload.timestamp || Date.now()) / 1000)}`
  });
  const organPipelineResult = await processOrganRenderingPipeline(fact, tab, {
    page: payload.page,
    source: "crawler"
  });
  const spectrumResult = await processOrganFrequencySpectrum(fact, tab, {
    page: payload.page,
    source: "crawler"
  });
  const { crawlerSignalLedger = {}, crawlerSignalHistory = [] } = await chrome.storage.local.get(["crawlerSignalLedger", "crawlerSignalHistory"]);
  const previousAt = crawlerSignalLedger[key] || 0;
  const now = payload.timestamp || Date.now();
  if (now - previousAt < 10 * 60 * 1000) return { ok: true, alerted: false, duplicate: true, pipeline: pipelineResult.summary };

  crawlerSignalLedger[key] = now;
  const status = {
    state: "crawler_signal_detected",
    message: describeCrawlerFact(fact),
    checkedAt: now,
    tabId: tab.id,
    host: new URL(tab.url).hostname,
    page: payload.page || {},
    severity: crawlerFactSeverity(fact),
    fact,
    normalizedFact: pipelineResult.normalized,
    structuralPipeline: pipelineResult.summary,
    organPipeline: organPipelineResult.summary,
    frequencySpectrum: spectrumResult.summary
  };
  const history = [status, ...crawlerSignalHistory].slice(0, 20);
  await chrome.storage.local.set({ crawlerSignalLedger, crawlerSignalHistory: history, crawlerSignalStatus: status });

  const shouldNotify = status.severity === "high" || fact.source === "anti_crawler";
  if (shouldNotify) {
    await chrome.notifications.create(CRAWLER_SIGNAL_NOTIFICATION_ID, {
      type: "basic",
      iconUrl: "icon-128.png",
      title: status.severity === "high" ? "Visa portal challenge detected" : "Visa portal crawler signal detected",
      message: status.message,
      priority: status.severity === "high" ? 2 : 1,
      requireInteraction: status.severity === "high"
    });
  }
  await forwardCompanionEvent({
    id: `crawler-${key}-${now}`,
    type: "crawler_signal",
    title: "Visa portal crawler signal",
    message: status.message,
    url: settings.rescheduleUrl || tab.url,
    occurredAt: now
  });
  return { ok: true, alerted: shouldNotify, status, pipeline: pipelineResult.summary, organPipeline: organPipelineResult.summary, frequencySpectrum: spectrumResult.summary };
}

function normalizeCrawlerFact(fact) {
  const source = fact.source === "anti_crawler" ? "anti_crawler" : "crawler";
  const type = String(fact.type || "signal").slice(0, 60);
  const value = fact.value && typeof fact.value === "object" ? fact.value : {};
  return {
    timestamp: Number(fact.timestamp) || Date.now(),
    source,
    type,
    value: sanitizeCrawlerValue(value),
    metadata: sanitizeCrawlerValue(fact.metadata || {}),
    context: sanitizeCrawlerValue(fact.context || {})
  };
}

function sanitizeCrawlerValue(value) {
  if (Array.isArray(value)) return value.slice(0, 20).map(sanitizeCrawlerValue);
  if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 160) : value;
  return Object.fromEntries(Object.entries(value).slice(0, 30).map(([key, raw]) => {
    if (/cookie|token|password|secret|authorization/i.test(key)) return [key, "[redacted]"];
    if (typeof raw === "string") return [key, raw.slice(0, 180)];
    if (typeof raw === "number" || typeof raw === "boolean" || raw === null) return [key, raw];
    if (Array.isArray(raw)) return [key, raw.slice(0, 20).map(item => typeof item === "string" ? item.slice(0, 160) : item)];
    return [key, sanitizeCrawlerValue(raw)];
  }));
}

function crawlerFactSeverity(fact) {
  const explicit = fact.value?.severity;
  if (["low", "medium", "high"].includes(explicit)) return explicit;
  if (fact.source === "anti_crawler" && fact.type === "challenge") return "high";
  if (fact.source === "anti_crawler") return "medium";
  return "low";
}

function describeCrawlerFact(fact) {
  const value = fact.value || {};
  if (fact.source === "anti_crawler") {
    const provider = value.provider ? `${value.provider} ` : "";
    const kind = value.kind || value.technique || fact.type;
    return `${provider}${kind} signal detected on the official portal. Sign in manually and review the page; the extension will not bypass challenges.`;
  }
  const label = value.pattern || value.signal || fact.type;
  return `Crawler-like page signal detected: ${label}. This is diagnostic only and does not mean an appointment is available.`;
}

function crawlerSignalKey(url, fact) {
  return `${structuralKey(url, "crawler")}:${fact.source}:${fact.type}:${fact.value?.provider || ""}:${fact.value?.kind || fact.value?.technique || fact.value?.pattern || fact.value?.signal || ""}`;
}

async function handleRuntimeFact(payload, tab) {
  const next = runtimeFactWriteQueue.catch(() => {}).then(() => handleRuntimeFactQueued(payload, tab));
  runtimeFactWriteQueue = next.catch(() => {});
  return next;
}

async function handleRuntimeFactQueued(payload, tab) {
  if (!isRuntimeInspectableUrl(tab?.url)) throw new Error("Runtime facts are accepted only from normal HTTP or HTTPS pages.");
  const settings = await getRuntimeDiagnosticsSettings();
  if (!settings.enabled || !payload?.fact) return { ok: true, alerted: false };
  const fact = normalizeRuntimeFact(payload.fact);
  const severity = runtimeFactSeverity(fact);
  const key = runtimeFactKey(tab.url, fact);
  const pipelineResult = await processStructuralFactPipeline(fact, tab, {
    page: payload.page,
    source: "runtime",
    batchId: `runtime:${new URL(tab.url).hostname}:${Math.floor((payload.timestamp || Date.now()) / 1000)}`
  });
  const organPipelineResult = await processOrganRenderingPipeline(fact, tab, {
    page: payload.page,
    source: "runtime"
  });
  const spectrumResult = await processOrganFrequencySpectrum(fact, tab, {
    page: payload.page,
    source: "runtime"
  });
  const { runtimeFactLedger = {}, runtimeFactHistory = [], runtimeFactChannels = {} } = await chrome.storage.local.get(["runtimeFactLedger", "runtimeFactHistory", "runtimeFactChannels"]);
  const now = payload.timestamp || Date.now();
  const previousAt = runtimeFactLedger[key] || 0;
  const channel = `${fact.source}/${fact.type}`;
  const channelHistory = runtimeFactChannels[channel] || [];
  runtimeFactChannels[channel] = [fact, ...channelHistory].slice(0, RUNTIME_FACT_CHANNEL_ITEM_LIMIT);
  const prunedRuntimeFactChannels = pruneRuntimeFactChannels(runtimeFactChannels);
  if (now - previousAt < 1000) {
    await chrome.storage.local.set({ runtimeFactChannels: prunedRuntimeFactChannels });
    return { ok: true, alerted: false, duplicate: true, pipeline: pipelineResult.summary, channel };
  }

  runtimeFactLedger[key] = now;
  pruneRuntimeLedger(runtimeFactLedger, RUNTIME_FACT_LEDGER_LIMIT);
  const status = {
    state: "runtime_fact_detected",
    message: describeRuntimeFact(fact),
    checkedAt: now,
    tabId: tab.id,
    host: new URL(tab.url).hostname,
    page: payload.page || {},
    severity,
    channel,
    fact,
    normalizedFact: pipelineResult.normalized,
    structuralPipeline: pipelineResult.summary,
    organPipeline: organPipelineResult.summary,
    frequencySpectrum: spectrumResult.summary
  };
  const history = [status, ...runtimeFactHistory].slice(0, RUNTIME_FACT_HISTORY_LIMIT);
  await chrome.storage.local.set({
    runtimeFactLedger,
    runtimeFactChannels: prunedRuntimeFactChannels,
    runtimeFactHistory: history,
    runtimeFactStatus: status
  });

  const shouldNotify = severity === "high";
  if (shouldNotify) {
    await chrome.notifications.create(RUNTIME_FACT_NOTIFICATION_ID, {
      type: "basic",
      iconUrl: "icon-128.png",
      title: "Runtime issue detected",
      message: status.message,
      priority: 2,
      requireInteraction: true
    });
  }
  await forwardCompanionEvent({
    id: `runtime-${key}-${now}`,
    type: "runtime_fact",
    title: "Runtime diagnostic",
    message: status.message,
    url: tab.url,
    occurredAt: now
  });
  return { ok: true, alerted: shouldNotify, status, pipeline: pipelineResult.summary, organPipeline: organPipelineResult.summary, frequencySpectrum: spectrumResult.summary };
}

async function setRuntimeDiagnosticsTarget(payload = {}) {
  const url = validateRuntimeDiagnosticsUrl(payload.url || "");
  await clearRuntimeDiagnosticsIfTargetChanged(url);
  const tabs = await chrome.tabs.query({});
  let tab = findRuntimeTargetTab(tabs, { url });
  if (!tab) tab = await chrome.tabs.create({ url, active: false });
  const target = sanitizeRuntimeDiagnosticsTarget(tab, url);
  await writeRuntimeTargetIfChanged(target);
  return { ok: true, target };
}

async function ensureRuntimeDiagnosticsTarget(payload = {}) {
  const settings = await getRuntimeDiagnosticsSettings();
  if (!settings.enabled) return { ok: false, status: "diagnostics_disabled" };
  const stored = await chrome.storage.local.get(["runtimeDiagnosticsTarget", "lastRuntimeInspectableTab"]);
  let target = payload.url
    ? { url: validateRuntimeDiagnosticsUrl(payload.url) }
    : stored.runtimeDiagnosticsTarget || stored.lastRuntimeInspectableTab || null;
  if (payload.url && target.url) await clearRuntimeDiagnosticsIfTargetChanged(target.url, stored.runtimeDiagnosticsTarget);
  if (!target?.url && !target?.tabId) {
    await writeRuntimeDiagnosticSystemFact({
      type: "waiting-for-target",
      state: "runtime_waiting_for_target",
      message: "Open or enter a website URL for runtime diagnostics.",
      severity: "medium"
    });
    return { ok: false, status: "no_target" };
  }

  let tab = target.tabId ? await chrome.tabs.get(target.tabId).catch(() => null) : null;
  if (!tab && target.url) {
    const tabs = await chrome.tabs.query({});
    tab = findRuntimeTargetTab(tabs, target);
  }
  if (!tab?.id || !isRuntimeInspectableUrl(tab.url)) {
    await writeRuntimeDiagnosticSystemFact({
      type: "target-not-open",
      state: "runtime_target_not_open",
      message: "The diagnostics target tab is not open. Open the target website once, then diagnostics will sample that existing tab every second.",
      severity: "medium",
      target
    });
    return { ok: false, status: "target_not_open", target };
  }

  const nextTarget = sanitizeRuntimeDiagnosticsTarget(tab, tab.url);
  await writeRuntimeTargetIfChanged(nextTarget);
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "FORCE_RUNTIME_SAMPLE", payload: { reason: payload.reason || "diagnostics_second_tick" } });
    return { ok: Boolean(response?.ok), target: nextTarget, sample: response };
  } catch (error) {
    await writeRuntimeDiagnosticSystemFact({
      type: "collector-unavailable",
      state: "runtime_target_needs_reload",
      message: "The diagnostics target tab is open, but the collector is not attached yet. Reload that target website tab once.",
      severity: "medium",
      target: nextTarget,
      tab,
      error: error.message
    });
    return { ok: false, status: "collector_unavailable", target: nextTarget, error: error.message };
  }
}

async function rememberRuntimeTab(tabId, knownTab = null) {
  const tab = knownTab?.url ? knownTab : await chrome.tabs.get(tabId).catch(() => null);
  if (!tab?.id || !isRuntimeInspectableUrl(tab.url)) return;
  if (tab.url.startsWith(chrome.runtime.getURL(""))) return;
  const target = sanitizeRuntimeDiagnosticsTarget(tab, tab.url);
  await writeRuntimeTargetIfChanged(target, { activeTarget: false });
}

function sanitizeRuntimeDiagnosticsTarget(tab, fallbackUrl) {
  return {
    tabId: tab?.id || null,
    windowId: tab?.windowId || null,
    title: String(tab?.title || "").slice(0, 160),
    url: sanitizeStructuralPipelineUrl(tab?.url || fallbackUrl || ""),
    host: tab?.url ? new URL(tab.url).hostname : safeRuntimeDiagnosticsHost(fallbackUrl),
    updatedAt: Date.now()
  };
}

function validateRuntimeDiagnosticsUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Enter a valid HTTP or HTTPS URL."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Runtime diagnostics only supports HTTP and HTTPS websites.");
  return url.href;
}

function sameRuntimeUrl(left, right) {
  try {
    const a = new URL(left);
    const b = new URL(right);
    a.hash = "";
    b.hash = "";
    a.search = "";
    b.search = "";
    return a.href === b.href;
  } catch {
    return false;
  }
}

function findRuntimeTargetTab(tabs, target = {}) {
  return tabs.find(candidate => {
    if (!candidate?.id || !isRuntimeInspectableUrl(candidate.url)) return false;
    if (target.tabId && candidate.id === target.tabId) return true;
    if (target.url && sameRuntimeUrl(candidate.url, target.url)) return true;
    return false;
  }) || null;
}

function safeRuntimeDiagnosticsHost(value) {
  try { return new URL(value).hostname; } catch { return ""; }
}

async function writeRuntimeTargetIfChanged(target, options = {}) {
  const activeTarget = options.activeTarget !== false;
  const key = activeTarget ? "runtimeDiagnosticsTarget" : "lastRuntimeInspectableTab";
  const cacheKey = `${key}:${target.tabId}:${target.url}:${target.title}`;
  const previous = runtimeTargetWriteCache.get(key);
  if (previous === cacheKey && Date.now() - (runtimeTargetWriteCache.get(`${key}:time`) || 0) < 10000) return;
  runtimeTargetWriteCache.set(key, cacheKey);
  runtimeTargetWriteCache.set(`${key}:time`, Date.now());
  const payload = activeTarget
    ? { runtimeDiagnosticsTarget: target, lastRuntimeInspectableTab: target }
    : { lastRuntimeInspectableTab: target };
  await chrome.storage.local.set(payload);
}

async function clearRuntimeDiagnosticsIfTargetChanged(nextUrl, previousTarget = null) {
  const stored = previousTarget ? { runtimeDiagnosticsTarget: previousTarget } : await chrome.storage.local.get("runtimeDiagnosticsTarget");
  const previousUrl = stored.runtimeDiagnosticsTarget?.url || "";
  if (!previousUrl || sameRuntimeUrl(previousUrl, nextUrl)) return;
  await chrome.storage.local.remove(RUNTIME_DIAGNOSTICS_STORAGE_KEYS);
}

async function writeRuntimeDiagnosticSystemFact({ type, state, message, severity = "low", target = {}, tab = null, error = "" }) {
  const now = Date.now();
  const host = tab?.url ? new URL(tab.url).hostname : target?.host || safeRuntimeDiagnosticsHost(target?.url || "");
  const fact = normalizeRuntimeFact({
    timestamp: now,
    source: "runtime",
    type,
    value: { severity, message, error: error ? String(error).slice(0, 180) : "" },
    metadata: { targetUrl: sanitizeStructuralPipelineUrl(target?.url || tab?.url || "") },
    context: { pageUrl: sanitizeStructuralPipelineUrl(target?.url || tab?.url || "") }
  });
  const channel = `${fact.source}/${fact.type}`;
  const { runtimeFactChannels = {}, runtimeFactHistory = [] } = await chrome.storage.local.get(["runtimeFactChannels", "runtimeFactHistory"]);
  runtimeFactChannels[channel] = [fact, ...(runtimeFactChannels[channel] || [])].slice(0, RUNTIME_FACT_CHANNEL_ITEM_LIMIT);
  const status = {
    state,
    message,
    checkedAt: now,
    tabId: tab?.id || target?.tabId || null,
    host,
    severity,
    channel,
    fact
  };
  await chrome.storage.local.set({
    runtimeFactChannels: pruneRuntimeFactChannels(runtimeFactChannels),
    runtimeFactHistory: [status, ...runtimeFactHistory].slice(0, RUNTIME_FACT_HISTORY_LIMIT),
    runtimeFactStatus: status
  });
}

function pruneRuntimeLedger(ledger, maxEntries) {
  const entries = Object.entries(ledger);
  if (entries.length <= maxEntries) return;
  entries.sort((left, right) => Number(right[1]) - Number(left[1]));
  for (const [key] of entries.slice(maxEntries)) delete ledger[key];
}

function pruneRuntimeFactChannels(channels) {
  const entries = Object.entries(channels || {})
    .map(([channel, facts]) => [
      channel,
      Array.isArray(facts) ? facts.slice(0, RUNTIME_FACT_CHANNEL_ITEM_LIMIT) : []
    ])
    .filter(([, facts]) => facts.length);
  entries.sort((left, right) => newestRuntimeFactTimestamp(right[1]) - newestRuntimeFactTimestamp(left[1]));
  return Object.fromEntries(entries.slice(0, RUNTIME_FACT_CHANNEL_LIMIT));
}

function newestRuntimeFactTimestamp(facts) {
  return facts.reduce((latest, fact) => Math.max(latest, Number(fact?.timestamp) || 0), 0);
}

function normalizeRuntimeFact(fact) {
  const source = String(fact.source || "runtime").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "runtime";
  const type = String(fact.type || "fact").replace(/[^a-z0-9_-]/gi, "").slice(0, 60) || "fact";
  return {
    timestamp: Number(fact.timestamp) || Date.now(),
    source,
    type,
    value: sanitizeRuntimeValue(fact.value || {}),
    metadata: sanitizeRuntimeValue(fact.metadata || {}),
    context: sanitizeRuntimeValue(fact.context || {})
  };
}

function sanitizeRuntimeValue(value) {
  if (Array.isArray(value)) return value.slice(0, 25).map(sanitizeRuntimeValue);
  if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 220) : value;
  return Object.fromEntries(Object.entries(value).slice(0, 40).map(([key, raw]) => {
    if (/cookie|token|password|secret|authorization|credential|session|email|phone|address|passport/i.test(key)) return [key, "[redacted]"];
    if (typeof raw === "string") return [key, raw.slice(0, 220)];
    if (typeof raw === "number" || typeof raw === "boolean" || raw === null) return [key, raw];
    return [key, sanitizeRuntimeValue(raw)];
  }));
}

function runtimeFactSeverity(fact) {
  const explicit = fact.value?.severity;
  if (["info", "low", "medium", "high"].includes(explicit)) return explicit === "info" ? "low" : explicit;
  if (["script-error", "unhandled-rejection"].includes(fact.type)) return "high";
  if (fact.source === "anti_crawler" && fact.type === "challenge") return "high";
  if (fact.source === "anti_crawler") return "medium";
  if (fact.source === "crawler" && fact.value?.severity) return fact.value.severity === "info" ? "low" : fact.value.severity;
  if (fact.source === "network" && ["error"].includes(fact.type)) return "medium";
  if (fact.source === "network" && fact.type === "response" && (fact.value?.status === 403 || fact.value?.status === 429)) return "high";
  if (fact.type === "long-task" && Number(fact.value?.durationMs) > 250) return "high";
  if (/burst|stylesheet-change|resource|storage-change|indexeddb-open|navigation/.test(fact.type)) return "medium";
  return "low";
}

function describeRuntimeFact(fact) {
  if (fact.type === "script-error") return `Runtime script error: ${fact.value?.message || "unknown error"}.`;
  if (fact.type === "unhandled-rejection") return `Runtime promise error: ${fact.value?.message || "unknown rejection"}.`;
  if (fact.type === "long-task") return `The page became slow for ${fact.value?.durationMs || "an unknown number of"} ms.`;
  if (fact.type === "mutation-burst") return `The page changed ${fact.value?.count || "many"} DOM nodes quickly. This is diagnostic evidence of page activity.`;
  if (fact.type === "stylesheet-change") return "The page stylesheet structure changed.";
  if (fact.source === "network" && fact.type === "request") return `Network request observed through ${fact.value?.kind || "browser API"}: ${fact.value?.url || "redacted URL"}.`;
  if (fact.source === "network" && fact.type === "response") return `Network response observed: ${fact.value?.kind || "browser API"} returned ${fact.value?.status ?? "unknown status"}.`;
  if (fact.source === "storage") return `Storage structural fact detected: ${fact.type}. Values are redacted; only operation shape is stored.`;
  if (fact.source === "anti_crawler") return `${fact.value?.provider || "Protection"} ${fact.value?.kind || fact.value?.technique || fact.type} signal detected. This is diagnostic only.`;
  if (fact.source === "crawler") return `Crawler-like page signal detected: ${fact.value?.pattern || fact.value?.signal || fact.type}. This is diagnostic only.`;
  if (fact.type === "console") return `Console ${fact.value?.level || "message"} observed: ${fact.value?.message || "redacted message"}.`;
  if (fact.type === "navigation") return `Portal navigation event observed: ${fact.value?.kind || "navigation"}.`;
  return `Runtime structural fact detected: ${fact.source}/${fact.type}.`;
}

function runtimeFactKey(url, fact) {
  const valueKey = JSON.stringify({ value: fact.value, metadata: fact.metadata }).slice(0, 500);
  return `${structuralKey(url, "runtime")}:${fact.source}:${fact.type}:${hashRuntimeKey(valueKey)}`;
}

async function processStructuralFactPipeline(fact, tab, envelope = {}) {
  const storedPipeline = await chrome.storage.local.get([
    "structuralPipelineState",
    "normalizedFactHistory",
    "structuralEventHistory",
    "featureVectorHistory",
    "scoreResultHistory",
    "updateClassificationHistory"
  ]);
  const structuralPipelineState = storedPipeline.structuralPipelineState || {};
  const normalizedFactHistory = ensurePipelineHistory(storedPipeline.normalizedFactHistory);
  const structuralEventHistory = ensurePipelineHistory(storedPipeline.structuralEventHistory);
  const featureVectorHistory = ensurePipelineHistory(storedPipeline.featureVectorHistory);
  const scoreResultHistory = ensurePipelineHistory(storedPipeline.scoreResultHistory);
  const updateClassificationHistory = ensurePipelineHistory(storedPipeline.updateClassificationHistory);
  const pipeline = new TicketSniperFactPipeline.StructuralFactPipeline(structuralPipelineState);
  const result = pipeline.process(fact, {
    ...envelope,
    tabId: tab?.id || null,
    tabUrl: tab?.url || fact.context?.pageUrl || "",
    host: tab?.url ? new URL(tab.url).hostname : fact.context?.host || "",
    pageUrl: fact.context?.pageUrl || sanitizeStructuralPipelineUrl(tab?.url || ""),
    collectorVersion: fact.context?.collectorVersion || "3.2.0"
  });
  const latestScore = result.scores.at(-1) || null;
  const latestClassification = result.classifications.at(-1) || null;
  const latest = {
    checkedAt: Date.now(),
    normalizedKey: result.normalized.key,
    category: result.normalized.category,
    signal: result.normalized.signal,
    severity: result.normalized.severity,
    eventCount: result.events.length,
    featureCount: result.features.length,
    score: latestScore?.score ?? null,
    classification: latestClassification?.classification || null,
    graph: result.snapshot.summary
  };
  await chrome.storage.local.set({
    structuralPipelineState: result.snapshot,
    structuralPipelineLatest: latest,
    normalizedFactHistory: [compactNormalizedFact(result.normalized), ...normalizedFactHistory].slice(0, 80),
    structuralEventHistory: [...result.events.map(compactStructuralEvent), ...structuralEventHistory].slice(0, 120),
    featureVectorHistory: [...result.features.map(compactFeatureVector), ...featureVectorHistory].slice(0, 120),
    scoreResultHistory: [...result.scores.map(compactScoreResult), ...scoreResultHistory].slice(0, 120),
    updateClassificationHistory: [...result.classifications.map(compactUpdateClassification), ...updateClassificationHistory].slice(0, 120)
  });
  return {
    normalized: result.normalized,
    events: result.events,
    features: result.features,
    scores: result.scores,
    classifications: result.classifications,
    summary: latest
  };
}

async function processOrganRenderingPipeline(fact, tab, envelope = {}) {
  const storedPipeline = await chrome.storage.local.get(["organPipelineState", "organAssignmentHistory", "organRenderBlockHistory", "organPipelineErrorHistory"]);
  const pipeline = new TicketSniperOrganPipeline.OrganGraphBuilder(storedPipeline.organPipelineState || {});
  const result = pipeline.process(fact, {
    ...envelope,
    tabId: tab?.id || null,
    tabUrl: tab?.url || fact.context?.pageUrl || "",
    host: tab?.url ? new URL(tab.url).hostname : fact.context?.host || "",
    pageUrl: fact.context?.pageUrl || sanitizeStructuralPipelineUrl(tab?.url || ""),
    collectorVersion: fact.context?.collectorVersion || "3.2.0"
  });
  const snapshot = result.snapshot;
  const summary = {
    checkedAt: Date.now(),
    ok: result.ok,
    normalizedFactType: result.normalized?.type || "",
    organ: result.assignment?.organ || null,
    errorCode: result.error?.code || null,
    graphSummary: snapshot.summary,
    structureEngine: snapshot.structureEngine || null,
    renderBlock: result.assignment?.organ ? compactOrganRenderBlock(snapshot.renderBlocks[result.assignment.organ]) : null
  };
  const assignmentHistory = Array.isArray(storedPipeline.organAssignmentHistory) ? storedPipeline.organAssignmentHistory : [];
  const renderBlockHistory = Array.isArray(storedPipeline.organRenderBlockHistory) ? storedPipeline.organRenderBlockHistory : [];
  const errorHistory = Array.isArray(storedPipeline.organPipelineErrorHistory) ? storedPipeline.organPipelineErrorHistory : [];
  await chrome.storage.local.set({
    organPipelineState: snapshot,
    organPipelineLatest: summary,
    organAssignmentHistory: result.assignment ? [result.assignment, ...assignmentHistory].slice(0, 160) : assignmentHistory.slice(0, 160),
    organRenderBlockHistory: summary.renderBlock ? [summary.renderBlock, ...renderBlockHistory].slice(0, 80) : renderBlockHistory.slice(0, 80),
    organPipelineErrorHistory: result.error ? [result.error, ...errorHistory].slice(0, 80) : errorHistory.slice(0, 80)
  });
  return { ...result, summary };
}

async function processOrganFrequencySpectrum(fact, tab, envelope = {}) {
  const stored = await chrome.storage.local.get(["organFrequencySpectrumState"]);
  const settings = await getRuntimeDiagnosticsSettings();
  const engine = new TicketSniperOrganFrequency.OrganFrequencySpectrumEngine(stored.organFrequencySpectrumState || {}, {
    windowMs: settings.frequencyWindowMs || 100,
    maxWindows: settings.frequencyMaxWindows || 900
  });
  const result = engine.ingest(fact, {
    ...envelope,
    tabId: tab?.id || null,
    tabUrl: tab?.url || fact.context?.pageUrl || "",
    host: tab?.url ? new URL(tab.url).hostname : fact.context?.host || "",
    pageUrl: fact.context?.pageUrl || sanitizeStructuralPipelineUrl(tab?.url || "")
  });
  const snapshot = result?.snapshot || engine.snapshot();
  const summary = {
    checkedAt: Date.now(),
    windowMs: snapshot.windowMs,
    closure: snapshot.closure,
    products: snapshot.products,
    spectra: compactSpectra(snapshot.spectra)
  };
  await chrome.storage.local.set({
    organFrequencySpectrumState: snapshot,
    organFrequencySpectrumLatest: summary
  });
  return { snapshot, summary };
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

function compactOrganRenderBlock(block) {
  if (!block) return null;
  return {
    organ_id: block.organ_id,
    components: block.components.map(component => ({
      type: component.type,
      label: component.label,
      nodeCount: component.data?.nodeCount || 0,
      edgeCount: component.data?.edgeCount || 0,
      render_rules: component.render_rules
    }))
  };
}

function ensurePipelineHistory(value) {
  return Array.isArray(value) ? value : [];
}

function compactNormalizedFact(fact) {
  return {
    timestamp: fact.timestamp,
    category: fact.category,
    signal: fact.signal,
    severity: fact.severity,
    key: fact.key,
    value: fact.value,
    context: fact.context,
    batch: fact.batch,
    raw: fact.raw
  };
}

function compactStructuralEvent(event) {
  return {
    timestamp: event.timestamp,
    eventType: event.eventType,
    category: event.category,
    signal: event.signal,
    severity: event.severity,
    key: event.key,
    delta: event.delta,
    window: event.window,
    context: event.context,
    rawFactKey: event.rawFact?.key || event.key
  };
}

function compactFeatureVector(vector) {
  return {
    timestamp: vector.timestamp,
    category: vector.category,
    signal: vector.signal,
    key: vector.key,
    features: vector.features,
    context: vector.context,
    eventType: vector.event?.eventType || ""
  };
}

function compactScoreResult(score) {
  return {
    timestamp: score.timestamp,
    category: score.category,
    signal: score.signal,
    key: score.key,
    score: score.score,
    components: score.components,
    context: score.context,
    features: score.features?.features || {}
  };
}

function compactUpdateClassification(classification) {
  return {
    timestamp: classification.timestamp,
    classification: classification.classification,
    score: classification.score,
    category: classification.category,
    signal: classification.signal,
    key: classification.key,
    context: classification.context,
    components: classification.scoreResult?.components || {}
  };
}

function sanitizeStructuralPipelineUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(value).slice(0, 180);
  }
}

function hashRuntimeKey(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

// Public/login page structural change detection.
async function evaluateStructuralScan(payload, tab, settings) {
  if (!settings.enabled || !payload?.structuralFingerprint || !isOfficialPortalUrl(tab?.url)) return { alerted: false };
  const key = structuralKey(tab.url, payload.structuralScope);
  const { structuralFingerprints = {} } = await chrome.storage.local.get("structuralFingerprints");
  const previous = structuralFingerprints[key];
  structuralFingerprints[key] = {
    fingerprint: payload.structuralFingerprint,
    scope: payload.structuralScope || "page",
    summary: payload.structuralSummary || {},
    url: tab.url,
    checkedAt: Date.now()
  };
  await chrome.storage.local.set({ structuralFingerprints });
  if (!previous?.fingerprint || previous.fingerprint === payload.structuralFingerprint) return { alerted: false };
  return handleStructuralUpdate({
    previousFingerprint: previous.fingerprint,
    fingerprint: payload.structuralFingerprint,
    detectedAt: Date.now(),
    scope: payload.structuralScope,
    summary: payload.structuralSummary,
    persisted: true
  }, tab, "scan");
}

async function handleStructuralUpdate(payload, tab, reason = "mutation") {
  if (!isOfficialPortalUrl(tab?.url)) throw new Error("Structural changes are accepted only from supported official visa portals.");
  const settings = await getSettings();
  if (!settings.enabled) return { ok: true, alerted: false };
  if (!payload?.fingerprint || payload.fingerprint === payload.previousFingerprint) return { ok: true, alerted: false };
  const key = structuralKey(tab.url, payload.scope);
  const { lastStructuralAlert = {} } = await chrome.storage.local.get("lastStructuralAlert");
  if (lastStructuralAlert[key] === payload.fingerprint) return { ok: true, alerted: false };
  lastStructuralAlert[key] = payload.fingerprint;
  await chrome.storage.local.set({ lastStructuralAlert });
  const host = new URL(tab.url).hostname;
  const status = {
    state: "public_site_changed",
    message: "The official portal page structure changed. Sign in manually and inspect the calendar; this does not prove a new appointment exists.",
    checkedAt: payload.detectedAt || Date.now(),
    tabId: tab.id,
    host,
    scope: payload.scope || "page",
    source: reason,
    summary: payload.summary || {}
  };
  await updateStatus(status);
  await chrome.storage.local.set({ structuralMonitorStatus: status });
  await chrome.notifications.create(STRUCTURAL_NOTIFICATION_ID, {
    type: "basic",
    iconUrl: "icon-128.png",
    title: "Visa portal structure changed",
    message: status.message,
    priority: 1,
    requireInteraction: true
  });
  await forwardCompanionEvent({
    id: `structure-${payload.fingerprint}`,
    type: "public_site_changed",
    title: "Visa portal structure changed",
    message: status.message,
    url: settings.rescheduleUrl || tab.url,
    occurredAt: status.checkedAt
  });
  return { ok: true, alerted: true };
}

// Authenticated calendar DOM change notifications.
async function handleCalendarUpdate(payload, tab) {
  if (!isOfficialPortalUrl(tab?.url)) throw new Error("Calendar changes are accepted only from supported official visa portals.");
  const settings = await getSettings();
  if (!settings.enabled) return { ok: true, alerted: false };
  const consulateGate = evaluateConsulateGate(payload || {}, settings);
  if (consulateGate.blocked) {
    await updateStatus({
      state: "calendar_changed_wrong_consulate",
      message: `Calendar changed for ${payload?.consulate || "an unknown consulate"}, but your monitored consulate is ${settings.targetConsulate}.`,
      checkedAt: payload?.detectedAt || Date.now(),
      tabId: tab?.id,
      host: new URL(tab.url).hostname,
      consulate: payload?.consulate || null,
      targetConsulate: settings.targetConsulate,
      consulateMatched: false
    });
    return { ok: true, alerted: false, consulateMatched: false };
  }
  const status = {
    state: "calendar_changed",
    message: settings.rescheduleUrl
      ? "The appointment calendar changed. Open the reschedule page and review it manually."
      : "The appointment calendar changed. Add your official reschedule URL in extension settings.",
    checkedAt: payload?.detectedAt || Date.now(),
    tabId: tab?.id,
    host: new URL(tab.url).hostname,
    consulate: payload?.consulate || null,
    targetConsulate: settings.targetConsulate || "",
    consulateMatched: consulateGate.matches
  };
  await updateStatus(status);
  await chrome.notifications.create(CALENDAR_NOTIFICATION_ID, {
    type: "basic", iconUrl: "icon-128.png", title: "Visa calendar updated",
    message: status.message, priority: 2, requireInteraction: true,
    buttons: [{ title: settings.rescheduleUrl ? "Open reschedule page" : "Open link settings" }]
  });
  await forwardCompanionEvent({
    id: `calendar-${payload?.fingerprint || Date.now()}`,
    type: "calendar_changed",
    title: "Visa calendar updated",
    message: status.message,
    url: settings.rescheduleUrl,
    occurredAt: status.checkedAt
  });
  return { ok: true, alerted: true };
}

async function openReschedulePage() {
  const settings = await getSettings();
  if (!settings.rescheduleUrl) {
    await chrome.runtime.openOptionsPage();
    return { ok: false, status: "reschedule_url_missing" };
  }
  const target = validateOfficialRescheduleUrl(settings.rescheduleUrl);
  const existing = (await chrome.tabs.query({})).find(tab => tab.id && tab.url === target);
  if (existing?.id) {
    await chrome.storage.session.set({ pendingRescheduleNavigation: { url: target, tabId: existing.id, expiresAt: Date.now() + 15 * 60 * 1000 } });
    await chrome.windows.update(existing.windowId, { focused: true });
    await chrome.tabs.update(existing.id, { active: true });
    return { ok: true, tabId: existing.id };
  }
  const tab = await chrome.tabs.create({ url: "about:blank", active: true });
  await chrome.storage.session.set({ pendingRescheduleNavigation: { url: target, tabId: tab.id, expiresAt: Date.now() + 15 * 60 * 1000 } });
  await chrome.tabs.update(tab.id, { url: target });
  return { ok: true, tabId: tab.id };
}

async function getPendingReschedule(tab) {
  const { pendingRescheduleNavigation } = await chrome.storage.session.get("pendingRescheduleNavigation");
  if (!pendingRescheduleNavigation || pendingRescheduleNavigation.expiresAt <= Date.now()) {
    await chrome.storage.session.remove("pendingRescheduleNavigation");
    return { ok: true, pending: null };
  }
  if (!tab?.id || pendingRescheduleNavigation.tabId !== tab.id) return { ok: true, pending: null };
  return { ok: true, pending: pendingRescheduleNavigation };
}

async function clearPendingReschedule(tab) {
  const { pendingRescheduleNavigation } = await chrome.storage.session.get("pendingRescheduleNavigation");
  if (pendingRescheduleNavigation?.tabId === tab?.id) await chrome.storage.session.remove("pendingRescheduleNavigation");
  return { ok: true };
}

function validateOfficialRescheduleUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("The saved reschedule URL is invalid."); }
  if (url.protocol !== "https:" || !isOfficialPortalUrl(url.href)) throw new Error("The saved reschedule URL is not on a supported official scheduling host.");
  return url.href;
}

async function pollGmail(reason, interactive) {
  const settings = await getSettings();
  if (!settings.gmailEnabled && reason !== "manual" && reason !== "enabled") return { ok: false, status: "disabled" };
  assertGmailOAuthConfigured();
  const token = await getGoogleAuthToken(interactive);
  const { gmailHistoryState } = await chrome.storage.local.get("gmailHistoryState");
  if (!gmailHistoryState?.historyId) return initializeGmailHistory(token, settings);

  let historyResult;
  try {
    historyResult = await listGmailHistory(token, gmailHistoryState.historyId);
  } catch (error) {
    if (error.status === 404) {
      await chrome.storage.local.remove(["gmailHistoryState", "gmailLastMessage"]);
      return initializeGmailHistory(token, settings);
    }
    throw error;
  }

  const uniqueIds = [...new Set(historyResult.messageIds)];
  const details = (await Promise.all(uniqueIds.map(id => getGmailMessage(token, id)))).filter(Boolean);
  const added = details
    .map(message => ({ ...message, mailbox: mailboxForMessage(message) }))
    .filter(message => message.mailbox && mailboxMatches(settings.gmailMailbox, message.mailbox))
    .filter(message => Number.isFinite(Number(message.internalDate)))
    .sort((left, right) => Number(left.internalDate) - Number(right.internalDate));

  if (!added.length) {
    const { gmailMonitorStatus } = await chrome.storage.local.get("gmailMonitorStatus");
    await chrome.storage.local.set({ gmailHistoryState: { historyId: historyResult.historyId }, gmailMonitorStatus: {
      ...(gmailMonitorStatus || {}),
      state: "gmail_current_timestamp",
      message: gmailMonitorStatus?.timestampText ? `Latest email remains ${gmailMonitorStatus.timestampText}.` : "No new email detected.",
      checkedAt: Date.now(),
      source: "gmail_api"
    } });
    return { ok: true, newMessages: 0, timestampText: gmailMonitorStatus?.timestampText || null };
  }

  for (const message of added) await notifyGmailMessage(message);
  const latest = added[added.length - 1];
  const internalDate = Number(latest.internalDate);
  const timestampText = formatGmailTimestamp(internalDate);
  const mailboxName = latest.mailbox === "sent" ? "Sent" : "Inbox";
  const status = {
    state: "gmail_timestamp_changed",
    message: `${added.length} new ${added.length === 1 ? "email" : "emails"}; latest ${mailboxName} time is ${timestampText}.`,
    timestampText,
    mailbox: latest.mailbox,
    checkedAt: Date.now(),
    source: "gmail_api"
  };
  await chrome.storage.local.set({
    gmailHistoryState: { historyId: historyResult.historyId },
    gmailLastMessage: { id: latest.id, internalDate, mailbox: latest.mailbox },
    gmailMonitorStatus: status
  });
  return { ok: true, newMessages: added.length, timestampText, mailbox: latest.mailbox };
}

async function initializeGmailHistory(token, settings) {
  const [profile, latest] = await Promise.all([getGmailProfile(token), getCurrentLatestMessage(token, settings)]);
  const status = latest ? statusForCurrentGmailMessage(latest) : {
    state: "gmail_current_timestamp", message: "No messages found in the selected mailbox.", checkedAt: Date.now(), source: "gmail_api"
  };
  const values = {
    gmailHistoryState: { historyId: profile.historyId },
    gmailMonitorStatus: status
  };
  if (latest) values.gmailLastMessage = { id: latest.id, internalDate: Number(latest.internalDate), mailbox: latest.mailbox };
  await chrome.storage.local.set(values);
  return { ok: true, initialized: true, newMessages: 0, timestampText: status.timestampText || null };
}

async function getCurrentLatestMessage(token, settings) {
  const labels = settings.gmailMailbox === "both" ? ["INBOX", "SENT"] : [settings.gmailMailbox === "sent" ? "SENT" : "INBOX"];
  const candidates = [];
  for (const label of labels) {
    const ids = await listGmailMessageIds(token, label);
    for (const id of ids) {
      const message = await getGmailMessage(token, id);
      if (message) candidates.push({ ...message, mailbox: label === "SENT" ? "sent" : "inbox" });
    }
  }
  return candidates
    .filter(message => Number.isFinite(Number(message.internalDate)))
    .sort((left, right) => Number(right.internalDate) - Number(left.internalDate))[0] || null;
}

function statusForCurrentGmailMessage(message) {
  const timestampText = formatGmailTimestamp(Number(message.internalDate));
  const mailboxName = message.mailbox === "sent" ? "Sent" : "Inbox";
  return {
    state: "gmail_current_timestamp", message: `${mailboxName} latest email: ${timestampText}`,
    timestampText, mailbox: message.mailbox, checkedAt: Date.now(), source: "gmail_api"
  };
}

async function notifyGmailMessage(message) {
  const timestampText = formatGmailTimestamp(Number(message.internalDate));
  const mailboxName = message.mailbox === "sent" ? "Sent" : "Inbox";
  await chrome.notifications.create(`${GMAIL_NOTIFICATION_ID}-${message.id}`, {
    type: "basic",
    iconUrl: "icon-128.png",
    title: `New Gmail ${mailboxName} email`,
    message: `A new ${mailboxName.toLowerCase()} email was added at ${timestampText}.`,
    priority: 2,
    requireInteraction: true
  });
  await forwardCompanionEvent({
    id: `gmail-${message.id}`,
    type: "gmail_message",
    title: `New Gmail ${mailboxName} email`,
    message: `A new ${mailboxName.toLowerCase()} email was added at ${timestampText}.`,
    occurredAt: Number(message.internalDate)
  });
}

async function forwardCompanionEvent(event) {
  const { companionSettings } = await chrome.storage.local.get("companionSettings");
  if (!companionSettings?.enabled) return { ok: false, status: "disabled" };
  try {
    const url = new URL(companionSettings.url || "");
    if (url.origin !== "http://127.0.0.1:4390") throw new Error("Companion URL must be http://127.0.0.1:4390.");
    if (String(companionSettings.token || "").length < 16) throw new Error("Companion pairing token is missing.");
    const response = await fetch(`${url.origin}/api/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${companionSettings.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error || `Companion returned HTTP ${response.status}.`);
    await chrome.storage.local.set({ companionStatus: { state: "connected", message: "Event delivered to companion app.", checkedAt: Date.now() } });
    return body;
  } catch (error) {
    await chrome.storage.local.set({ companionStatus: { state: "error", message: error.message, checkedAt: Date.now() } });
    return { ok: false, error: error.message };
  }
}

function mailboxForMessage(message) {
  if (message.labelIds?.includes("SENT")) return "sent";
  if (message.labelIds?.includes("INBOX")) return "inbox";
  return null;
}

function mailboxMatches(setting, mailbox) {
  return setting === "both" || setting === mailbox;
}

function assertGmailOAuthConfigured() {
  const clientId = chrome.runtime.getManifest().oauth2?.client_id || "";
  if (!clientId || clientId.startsWith("REPLACE_WITH_")) {
    throw new Error("Gmail OAuth setup is required. Add your Google OAuth client ID to manifest.json, then reload the extension.");
  }
}

function getGoogleAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, result => {
      const error = chrome.runtime.lastError;
      if (error) return reject(new Error(error.message));
      const token = typeof result === "string" ? result : result?.token;
      if (!token) return reject(new Error("Google did not return an OAuth access token."));
      resolve(token);
    });
  });
}

async function listGmailMessageIds(token, label) {
  const endpoint = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  endpoint.searchParams.set("labelIds", label);
  endpoint.searchParams.set("maxResults", "1");
  const data = await gmailApiFetch(endpoint, token, `list ${label.toLowerCase()} messages`);
  return (data.messages || []).map(message => message.id).filter(Boolean);
}

async function getGmailProfile(token) {
  return gmailApiFetch(new URL("https://gmail.googleapis.com/gmail/v1/users/me/profile"), token, "read Gmail profile");
}

async function listGmailHistory(token, startHistoryId) {
  const messageIds = [];
  let pageToken = "";
  let historyId = String(startHistoryId);
  do {
    const endpoint = new URL("https://gmail.googleapis.com/gmail/v1/users/me/history");
    endpoint.searchParams.set("startHistoryId", String(startHistoryId));
    endpoint.searchParams.set("historyTypes", "messageAdded");
    endpoint.searchParams.set("maxResults", "500");
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken);
    const data = await gmailApiFetch(endpoint, token, "read Gmail history");
    historyId = data.historyId || historyId;
    for (const history of data.history || []) {
      for (const addition of history.messagesAdded || []) {
        if (addition.message?.id) messageIds.push(addition.message.id);
      }
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return { historyId, messageIds };
}

async function getGmailMessage(token, id) {
  const endpoint = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`);
  endpoint.searchParams.set("format", "minimal");
  try {
    return await gmailApiFetch(endpoint, token, "read message timestamp");
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function gmailApiFetch(endpoint, token, operation = "Gmail API request") {
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body?.error?.message || `Request failed with HTTP ${response.status}.`;
    if (response.status === 401) await removeCachedGoogleToken(token);
    const error = new Error(`${operation} failed: ${detail}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function removeCachedGoogleToken(token) {
  return new Promise(resolve => chrome.identity.removeCachedAuthToken({ token }, resolve));
}

async function disconnectGmail() {
  await new Promise(resolve => chrome.identity.clearAllCachedAuthTokens(resolve));
  const settings = await getSettings();
  await chrome.storage.sync.set({ visaMonitorSettings: { ...settings, gmailEnabled: false } });
  await chrome.alarms.clear(GMAIL_ALARM_NAME);
  await chrome.storage.local.remove(["gmailLastMessage", "gmailHistoryState"]);
  await chrome.storage.local.set({ gmailMonitorStatus: { state: "gmail_disconnected", message: "Google account disconnected.", checkedAt: Date.now() } });
  return { ok: true };
}

function formatGmailTimestamp(internalDate) {
  const date = new Date(internalDate);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const day = date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
  return `${time} - ${day}`;
}

function isOfficialPortalUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ["usvisascheduling.com", "atlasauth.b2clogin.com", "ais.usvisa-info.com", "ustraveldocs.com", "cgifederal.secure.force.com"]
      .some(official => host === official || host.endsWith(`.${official}`));
  } catch {
    return false;
  }
}

function isRuntimeInspectableUrl(url) {
  if (!url) return false;
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function structuralKey(url, scope = "page") {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}:${scope || "page"}`;
  } catch {
    return `unknown:${scope || "page"}`;
  }
}

async function updateStatus(status) {
  await chrome.storage.local.set({ visaMonitorStatus: status });
}

async function getSettings() {
  const { visaMonitorSettings } = await chrome.storage.sync.get("visaMonitorSettings");
  return { enabled: false, cutoffDate: "", intervalMinutes: 10, dateOrder: "mdy", rescheduleUrl: "", targetConsulate: "", gmailEnabled: false, gmailMailbox: "both", gmailIntervalMinutes: 2, ...visaMonitorSettings };
}

function evaluateConsulateGate(payload = {}, settings = {}) {
  const target = normalizeConsulateName(settings.targetConsulate);
  const actual = normalizeConsulateName(payload.consulate || payload.calendar?.consulate || payload.locationName);
  if (!target) return { matches: true, blocked: false, target, actual };
  if (!actual) return { matches: false, blocked: true, target, actual };
  const matches = actual === target || actual.includes(target) || target.includes(actual);
  return { matches, blocked: !matches, target, actual };
}

function normalizeConsulateName(value) {
  return String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/consular\s+post|consulate|embassy|location/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

async function getRuntimeDiagnosticsSettings() {
  const { runtimeDiagnosticsSettings } = await chrome.storage.sync.get("runtimeDiagnosticsSettings");
  return { enabled: true, notifyHighSeverity: true, ...runtimeDiagnosticsSettings };
}
