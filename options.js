const defaults = { dateOrder: "mdy", availableDateSelector: "", targetConsulate: "", rescheduleUrl: "" };
const fields = {
  dateOrder: document.getElementById("date-order"),
  availableDateSelector: document.getElementById("available-date-selector"),
  targetConsulate: document.getElementById("target-consulate"),
  rescheduleUrl: document.getElementById("reschedule-url")
};
const status = document.getElementById("status");
const companion = {
  enabled: document.getElementById("companion-enabled"), url: document.getElementById("companion-url"),
  token: document.getElementById("companion-token"), status: document.getElementById("companion-status")
};

load();

document.getElementById("save-companion").addEventListener("click", async () => {
  try {
    const url = validateCompanionUrl(companion.url.value.trim());
    const token = companion.token.value.trim();
    if (companion.enabled.checked && token.length < 16) throw new Error("Use a pairing token of at least 16 characters.");
    await chrome.storage.local.set({ companionSettings: { enabled: companion.enabled.checked, url, token } });
    companion.status.textContent = "Companion connection saved locally.";
  } catch (error) { companion.status.textContent = error.message; }
});

document.getElementById("open-companion").addEventListener("click", async () => {
  try {
    const url = validateCompanionUrl(companion.url.value.trim());
    await chrome.tabs.create({ url });
  } catch (error) {
    companion.status.textContent = error.message;
  }
});

document.getElementById("save").addEventListener("click", async () => {
  try {
    const { visaMonitorSettings } = await chrome.storage.sync.get("visaMonitorSettings");
    const rescheduleUrl = validateRescheduleUrl(fields.rescheduleUrl.value.trim());
    await chrome.storage.sync.set({ visaMonitorSettings: { ...visaMonitorSettings, dateOrder: fields.dateOrder.value, availableDateSelector: fields.availableDateSelector.value.trim(), targetConsulate: fields.targetConsulate.value.trim(), rescheduleUrl } });
    status.textContent = "Detection and reschedule-link settings saved.";
  } catch (error) {
    status.textContent = error.message;
  }
});

document.getElementById("reset").addEventListener("click", async () => {
  const { visaMonitorSettings } = await chrome.storage.sync.get("visaMonitorSettings");
  await chrome.storage.sync.set({ visaMonitorSettings: { ...visaMonitorSettings, ...defaults } });
  fill(defaults);
  status.textContent = "Built-in detection restored.";
});

async function load() {
  const [{ visaMonitorSettings }, { companionSettings }] = await Promise.all([
    chrome.storage.sync.get("visaMonitorSettings"), chrome.storage.local.get("companionSettings")
  ]);
  fill({ ...defaults, ...visaMonitorSettings });
  companion.enabled.checked = Boolean(companionSettings?.enabled);
  companion.url.value = companionSettings?.url || "http://127.0.0.1:4390";
  companion.token.value = companionSettings?.token || "";
}

function validateCompanionUrl(value) {
  let url;
  try { url = new URL(value || "http://127.0.0.1:4390"); } catch { throw new Error("The companion URL is invalid."); }
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.port !== "4390") throw new Error("The companion must use http://127.0.0.1:4390.");
  return url.origin;
}

function fill(settings) {
  fields.dateOrder.value = settings.dateOrder;
  fields.availableDateSelector.value = settings.availableDateSelector || "";
  fields.targetConsulate.value = settings.targetConsulate || "";
  fields.rescheduleUrl.value = settings.rescheduleUrl || "";
}

function validateRescheduleUrl(value) {
  if (!value) return "";
  let url;
  try { url = new URL(value); } catch { throw new Error("Enter a complete official HTTPS reschedule URL."); }
  const host = url.hostname.toLowerCase();
  const allowed = ["usvisascheduling.com", "atlasauth.b2clogin.com", "ais.usvisa-info.com", "ustraveldocs.com", "cgifederal.secure.force.com"]
    .some(official => host === official || host.endsWith(`.${official}`));
  if (url.protocol !== "https:" || !allowed) throw new Error("The reschedule URL must use a supported official scheduling host.");
  return url.href;
}
