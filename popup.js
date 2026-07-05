const elements = {
  cutoff: document.getElementById("cutoff-date"), interval: document.getElementById("interval"),
  toggle: document.getElementById("toggle"), check: document.getElementById("check"),
  title: document.getElementById("status-title"), status: document.getElementById("status"),
  lastCheck: document.getElementById("last-check"), dot: document.getElementById("state-dot"),
  crawlerStatus: document.getElementById("crawler-status"), crawlerLastCheck: document.getElementById("crawler-last-check"),
  crawlerSeverity: document.getElementById("crawler-severity"),
  gmailToggle: document.getElementById("gmail-toggle"), gmailMailbox: document.getElementById("gmail-mailbox"),
  gmailInterval: document.getElementById("gmail-interval"), checkGmail: document.getElementById("check-gmail"),
  gmailStatus: document.getElementById("gmail-status"), gmailLastChange: document.getElementById("gmail-last-change"),
  gmailCurrentTime: document.getElementById("gmail-current-time"),
  gmailDot: document.getElementById("gmail-dot"), gmailDisconnect: document.getElementById("gmail-disconnect"),
  gmailSetup: document.getElementById("gmail-setup")
};
let enabled = false;
let gmailEnabled = false;

initialize();

elements.toggle.addEventListener("click", async () => {
  if (!enabled && !elements.cutoff.value) return showLocalStatus("Choose a cutoff date first.", "error");
  elements.toggle.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      type: "UPDATE_MONITOR",
      payload: { enabled: !enabled, cutoffDate: elements.cutoff.value, intervalMinutes: Number(elements.interval.value) }
    });
    if (!response?.ok && response?.status !== "no_official_tab") throw new Error(response?.error || "Unable to update monitoring.");
    enabled = !enabled;
    await refresh();
  } catch (error) { showLocalStatus(error.message, "error"); }
  finally { elements.toggle.disabled = false; }
});

elements.check.addEventListener("click", async () => {
  elements.check.disabled = true;
  showLocalStatus("Checking visible official appointment calendars...", "checking");
  try {
    const response = await chrome.runtime.sendMessage({ type: "CHECK_NOW" });
    if (!response?.ok) throw new Error(response?.status === "no_official_tab" ? "Open the official visa scheduling calendar in a tab first." : "No readable appointment calendar was found.");
    await refresh();
  } catch (error) { showLocalStatus(error.message, "error"); }
  finally { elements.check.disabled = false; }
});

elements.gmailToggle.addEventListener("click", async () => {
  elements.gmailToggle.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      type: "UPDATE_GMAIL_MONITOR",
      payload: { enabled: !gmailEnabled, mailbox: elements.gmailMailbox.value, intervalMinutes: Number(elements.gmailInterval.value) }
    });
    if (!response?.ok) throw new Error(response?.error || "Unable to update Gmail monitoring.");
    gmailEnabled = !gmailEnabled;
    await refresh();
  } catch (error) {
    renderGmailStatus({ message: error.message, checkedAt: Date.now() });
  } finally {
    elements.gmailToggle.disabled = false;
  }
});

elements.gmailMailbox.addEventListener("change", async () => {
  if (!gmailEnabled) return;
  await chrome.runtime.sendMessage({
    type: "UPDATE_GMAIL_MONITOR",
    payload: { enabled: true, mailbox: elements.gmailMailbox.value, intervalMinutes: Number(elements.gmailInterval.value) }
  });
  await refresh();
});

elements.gmailInterval.addEventListener("change", async () => {
  if (!gmailEnabled) return;
  await chrome.runtime.sendMessage({
    type: "UPDATE_GMAIL_MONITOR",
    payload: { enabled: true, mailbox: elements.gmailMailbox.value, intervalMinutes: Number(elements.gmailInterval.value) }
  });
  await refresh();
});

elements.checkGmail.addEventListener("click", async () => {
  elements.checkGmail.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: "CHECK_GMAIL_NOW" });
    if (!response?.ok) throw new Error(response?.error || "Gmail API check failed.");
    await refresh();
  } catch (error) {
    renderGmailStatus({ state: "gmail_api_error", message: error.message, checkedAt: Date.now() });
  } finally {
    elements.checkGmail.disabled = false;
  }
});

elements.gmailDisconnect.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "DISCONNECT_GMAIL" });
  if (!response?.ok) return renderGmailStatus({ state: "gmail_api_error", message: response?.error || "Unable to disconnect Google.", checkedAt: Date.now() });
  await refresh();
});

elements.gmailSetup.addEventListener("click", async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL("GOOGLE_OAUTH_SETUP.md") });
});

document.getElementById("options").addEventListener("click", () => chrome.runtime.openOptionsPage());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.visaMonitorStatus) renderStatus(changes.visaMonitorStatus.newValue);
  if (changes.crawlerSignalStatus) renderCrawlerStatus(changes.crawlerSignalStatus.newValue);
  if (changes.gmailMonitorStatus) renderGmailStatus(changes.gmailMonitorStatus.newValue);
});

async function initialize() {
  const { visaMonitorSettings } = await chrome.storage.sync.get("visaMonitorSettings");
  const settings = { enabled: false, cutoffDate: "", intervalMinutes: 10, gmailEnabled: false, gmailMailbox: "both", gmailIntervalMinutes: 2, ...visaMonitorSettings };
  enabled = settings.enabled;
  gmailEnabled = settings.gmailEnabled;
  elements.cutoff.value = settings.cutoffDate;
  elements.interval.value = String(settings.intervalMinutes);
  elements.gmailMailbox.value = settings.gmailMailbox;
  elements.gmailInterval.value = String(settings.gmailIntervalMinutes);
  await refresh();
}

async function refresh() {
  const [{ visaMonitorSettings }, { visaMonitorStatus, gmailMonitorStatus, crawlerSignalStatus }] = await Promise.all([
    chrome.storage.sync.get("visaMonitorSettings"), chrome.storage.local.get(["visaMonitorStatus", "gmailMonitorStatus", "crawlerSignalStatus"])
  ]);
  enabled = Boolean(visaMonitorSettings?.enabled);
  gmailEnabled = Boolean(visaMonitorSettings?.gmailEnabled);
  elements.toggle.textContent = enabled ? "Stop monitoring" : "Start monitoring";
  elements.toggle.classList.toggle("danger", enabled);
  elements.dot.className = `state-dot ${enabled ? "active" : ""}`;
  elements.gmailMailbox.value = visaMonitorSettings?.gmailMailbox || "both";
  elements.gmailInterval.value = String(visaMonitorSettings?.gmailIntervalMinutes || 2);
  elements.gmailToggle.textContent = gmailEnabled ? "Disable Gmail API" : "Connect Gmail";
  elements.gmailToggle.classList.toggle("danger", gmailEnabled);
  elements.gmailDot.className = `state-dot ${gmailEnabled ? "active" : ""}`;
  renderStatus(visaMonitorStatus || { state: enabled ? "armed" : "stopped", message: enabled ? "Waiting for the next check." : "Monitoring is stopped." });
  renderCrawlerStatus(crawlerSignalStatus || { state: "crawler_idle", message: "No crawler or anti-bot challenge signals observed." });
  renderGmailStatus(gmailMonitorStatus || { message: gmailEnabled ? "Waiting for the next Gmail API check." : "Connect Google to begin API monitoring." });
}

function renderStatus(status) {
  const titles = { earlier_found: "Earlier slot found", calendar_changed: "Calendar updated", calendar_changed_wrong_consulate: "Different consulate", public_site_changed: "Portal changed", gmail_timestamp_changed: "Gmail time changed", dates_found: "Calendar checked", no_dates_visible: "No dates visible", login_required: "Sign in required", waiting_for_tab: "Official tab needed", scan_unavailable: "Calendar unavailable", armed: "Monitoring active", stopped: "Not monitoring" };
  elements.title.textContent = titles[status.state] || "Monitor status";
  const consulate = status.consulate ? ` Active consulate: ${status.consulate}.` : "";
  elements.status.textContent = `${status.message || "No check has run yet."}${consulate}`;
  elements.lastCheck.textContent = status.checkedAt ? `Last checked ${new Date(status.checkedAt).toLocaleString()}` : "";
  elements.dot.classList.toggle("alert", ["earlier_found", "calendar_changed", "public_site_changed", "gmail_timestamp_changed"].includes(status.state));
}

function showLocalStatus(message, state) {
  renderStatus({ state, message, checkedAt: Date.now() });
}

function renderCrawlerStatus(status) {
  const severity = status.severity || "idle";
  elements.crawlerStatus.textContent = status.message || "No crawler or anti-bot challenge signals observed.";
  elements.crawlerLastCheck.textContent = status.checkedAt ? `Observed ${new Date(status.checkedAt).toLocaleString()}` : "";
  elements.crawlerSeverity.textContent = severity;
  elements.crawlerSeverity.className = `severity-pill ${severity}`;
}

function renderGmailStatus(status) {
  elements.gmailCurrentTime.textContent = status.timestampText || "--";
  elements.gmailStatus.textContent = status.message || "No Gmail timestamp change detected yet.";
  elements.gmailLastChange.textContent = status.checkedAt ? `Observed ${new Date(status.checkedAt).toLocaleString()}` : "";
  elements.gmailDot.classList.toggle("alert", status.state === "gmail_timestamp_changed");
}
