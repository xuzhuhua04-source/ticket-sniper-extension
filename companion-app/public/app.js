const state = { status: null, events: [], installPrompt: null, authMode: "signin", authPopup: null };
const elements = {
  service: byId("service"), serviceSmall: byId("service-small"), serviceDot: byId("service-dot"), count: byId("event-count"),
  channelCount: byId("channel-count"), events: byId("events"), eventSummary: byId("event-summary"), channelSummary: byId("channel-summary"),
  token: byId("token"), message: byId("message"), install: byId("install"), plans: byId("plans"), manageBilling: byId("manage-billing"), accountButton: byId("account-button")
};
elements.token.value = sessionStorage.getItem("companionToken") || "";

document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => openView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach(button => button.addEventListener("click", () => openView(button.dataset.openView)));
byId("save-token").addEventListener("click", () => { sessionStorage.setItem("companionToken", elements.token.value.trim()); showMessage("Pairing token saved for this session."); refresh(); });
byId("refresh").addEventListener("click", refresh);
byId("test").addEventListener("click", sendTest);
elements.accountButton.addEventListener("click", () => openView("account"));
elements.manageBilling.addEventListener("click", openPortal);
elements.install.addEventListener("click", installApp);
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.installPrompt = event; elements.install.hidden = false; });
window.addEventListener("message", event => { if (event.origin === location.origin && event.data?.type === "visa-auth-complete") refresh(); });
document.querySelectorAll("[data-auth-mode]").forEach(button => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
document.querySelectorAll("[data-provider]").forEach(button => button.addEventListener("click", () => startProviderAuth(button.dataset.provider)));
byId("whatsapp-request-form").addEventListener("submit", requestWhatsAppCode);
byId("whatsapp-verify-form").addEventListener("submit", verifyWhatsAppCode);
byId("sign-out").addEventListener("click", signOut);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

async function refresh() {
  clearMessage();
  try {
    state.status = await fetch("/api/status").then(parseResponse);
    setService(true);
    renderChannels(state.status.channels);
    renderPlans(state.status.billing);
    renderAuth(state.status.auth);
    elements.count.textContent = String(state.status.eventCount);
    if (elements.token.value.trim()) {
      const result = await api("/api/events");
      state.events = result.events;
      renderEvents(state.events);
    } else {
      renderEvents([]);
      elements.events.innerHTML = '<p class="empty">Enter the pairing token in Settings to view event history.</p>';
    }
  } catch (error) {
    setService(false);
    showMessage(error.message, true);
  }
}

async function sendTest() {
  try {
    const result = await api("/api/test", { method: "POST" });
    const sent = result.deliveries.filter(item => item.ok).length;
    const failed = result.deliveries.filter(item => !item.ok).length;
    showMessage(result.deliveries.length ? `Test complete: ${sent} sent, ${failed} failed.` : "No delivery channel is configured yet.", failed > 0);
    await refresh();
  } catch (error) { showMessage(error.message, true); }
}

async function beginCheckout(plan) {
  try {
    const result = await api("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan }) });
    submitAuthorizeNetHostedPayment(result);
  } catch (error) { showMessage(error.message, true); }
}

async function openPortal() {
  try {
    const result = await api("/api/billing/portal", { method: "POST" });
    window.open(result.url, "_blank", "noopener,noreferrer");
  } catch (error) { showMessage(error.message, true); }
}

async function installApp() {
  if (!state.installPrompt) return;
  await state.installPrompt.prompt();
  state.installPrompt = null;
  elements.install.hidden = true;
}

function startProviderAuth(provider) {
  const providers = state.status?.auth?.providers || {};
  if (!providers[provider]) return showMessage(`${providerLabel(provider)} sign-in has not been configured by the administrator.`, true);
  state.authPopup = window.open(`/api/auth/start/${provider}`, `visa-${provider}-auth`, "popup,width=520,height=720");
  if (!state.authPopup) showMessage("Allow popups for this local app to continue signing in.", true);
}

async function requestWhatsAppCode(event) {
  event.preventDefault();
  if (!state.status?.auth?.providers?.whatsapp) return showMessage("WhatsApp authentication is not configured.", true);
  try {
    const phone = byId("auth-phone").value.trim();
    await publicApi("/api/auth/whatsapp/request", { method: "POST", body: JSON.stringify({ phone }) });
    byId("whatsapp-verify-form").hidden = false;
    showMessage("Authentication code sent through WhatsApp. It expires in five minutes.");
    byId("auth-code").focus();
  } catch (error) { showMessage(error.message, true); }
}

async function verifyWhatsAppCode(event) {
  event.preventDefault();
  try {
    await publicApi("/api/auth/whatsapp/verify", { method: "POST", body: JSON.stringify({ phone: byId("auth-phone").value.trim(), code: byId("auth-code").value.trim() }) });
    byId("whatsapp-verify-form").hidden = true;
    showMessage(state.authMode === "signup" ? "Account created and signed in." : "Signed in successfully.");
    await refresh();
  } catch (error) { showMessage(error.message, true); }
}

async function signOut() {
  try { await publicApi("/api/auth/logout", { method: "POST" }); await refresh(); showMessage("Signed out."); }
  catch (error) { showMessage(error.message, true); }
}

function setAuthMode(mode) {
  state.authMode = mode === "signup" ? "signup" : "signin";
  document.querySelectorAll("[data-auth-mode]").forEach(button => button.classList.toggle("active", button.dataset.authMode === state.authMode));
  byId("auth-title").textContent = state.authMode === "signup" ? "Create your account" : "Welcome back";
  byId("auth-description").textContent = state.authMode === "signup" ? "Your first verified sign-in creates a Visa Monitor account." : "Continue with an identity already linked to your account.";
}

function renderAuth(auth) {
  const user = auth?.user;
  byId("signed-out-account").hidden = Boolean(user);
  byId("signed-in-account").hidden = !user;
  elements.accountButton.textContent = user ? user.displayName : "Sign in";
  if (user) {
    byId("profile-name").textContent = user.displayName;
    byId("profile-avatar").textContent = user.displayName.trim().charAt(0).toUpperCase() || "U";
    byId("profile-providers").textContent = `Connected through ${user.providers.map(providerLabel).join(", ")}`;
  }
  for (const provider of ["google", "wechat", "wecom"]) {
    const button = document.querySelector(`[data-provider="${provider}"]`);
    button.disabled = !auth?.providers?.[provider];
    byId(`${provider === "wechat" ? "wechat-auth" : provider === "wecom" ? "wecom-auth" : provider}-availability`).textContent = auth?.providers?.[provider] ? "Available" : "Not configured";
  }
  byId("send-code").disabled = !auth?.providers?.whatsapp;
}

function openView(name) {
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === name));
  document.querySelectorAll(".view").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === name));
  byId("view-title").textContent = name[0].toUpperCase() + name.slice(1);
  byId("view-eyebrow").textContent = name === "billing" ? "Account" : "Workspace";
}

function setService(online) {
  elements.service.textContent = online ? "Online" : "Unavailable";
  elements.serviceSmall.textContent = online ? "Online" : "Offline";
  elements.serviceDot.classList.toggle("active", online);
}

function renderChannels(channels) {
  const definitions = [{ id: "wecom", label: "WeCom Robot" }, { id: "wechat", label: "WeChat" }, { id: "whatsapp", label: "WhatsApp" }];
  const ready = definitions.filter(item => channels[item.id]).length;
  elements.channelCount.textContent = `${ready} / 3`;
  elements.channelSummary.innerHTML = definitions.map(item => compactChannel(item.label, Boolean(channels[item.id]))).join("");
  for (const item of definitions) {
    byId(`${item.id}-dot`).classList.toggle("active", Boolean(channels[item.id]));
    byId(`${item.id}-state`).textContent = channels[item.id] ? "Ready" : "Not configured";
  }
}

function renderPlans(billing) {
  elements.manageBilling.disabled = !billing.portalAvailable;
  elements.manageBilling.title = billing.portalAvailable ? "Open Authorize.Net merchant portal" : "Configure AUTHORIZE_NET_MERCHANT_PORTAL_URL";
  elements.plans.innerHTML = billing.plans.map(plan => `<article class="plan-card"><span class="eyebrow">${escapeHtml(plan.name)}</span><div class="price">${escapeHtml(plan.priceLabel)}</div><p>${escapeHtml(plan.description)}</p><ul><li>Authorize.Net Accept Hosted</li><li>No card data stored locally</li><li>Provider-managed payment methods</li></ul><button data-plan="${escapeHtml(plan.id)}" ${plan.available ? "" : "disabled"}>${plan.available ? "Choose plan" : "Not configured"}</button></article>`).join("");
  elements.plans.querySelectorAll("[data-plan]").forEach(button => button.addEventListener("click", () => beginCheckout(button.dataset.plan)));
}

function submitAuthorizeNetHostedPayment(payload) {
  if (!payload?.url || !/^https:\/\/(accept|test)\.authorize\.net\/payment\/payment$/i.test(payload.url)) throw new Error("Checkout did not return a valid Authorize.Net hosted payment URL.");
  const token = String(payload.formFields?.token || payload.token || "").trim();
  if (!token) throw new Error("Authorize.Net hosted payment token was missing.");
  const form = document.createElement("form");
  form.method = "POST";
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

function renderEvents(events) {
  if (!events.length) {
    elements.events.innerHTML = '<p class="empty">No events received yet.</p>';
    elements.eventSummary.innerHTML = '<p class="empty">No recent alerts.</p>';
    return;
  }
  elements.events.innerHTML = events.map(eventMarkup).join("");
  elements.eventSummary.innerHTML = events.slice(0, 4).map(event => `<div class="compact-row"><span class="dot active"></span><strong>${escapeHtml(event.title)}</strong><time>${shortTime(event.occurredAt)}</time></div>`).join("");
}

function eventMarkup(event) {
  return `<article class="event"><div><strong>${escapeHtml(event.title)}</strong><p>${escapeHtml(event.message)}</p>${(event.deliveries || []).map(delivery => `<span class="delivery ${delivery.ok ? "ok" : "failed"}">${escapeHtml(delivery.channel)} ${delivery.ok ? "sent" : "failed"}</span>`).join("")}</div><time>${new Date(event.occurredAt).toLocaleString()}</time></article>`;
}

function compactChannel(label, active) {
  return `<div class="compact-row"><span class="dot ${active ? "active" : ""}"></span><strong>${escapeHtml(label)}</strong><span>${active ? "Ready" : "Setup required"}</span></div>`;
}

async function api(path, options = {}) {
  const token = elements.token.value.trim();
  if (!token) throw new Error("Enter the companion pairing token in Settings first.");
  const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) } });
  return parseResponse(response);
}

async function publicApi(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  return parseResponse(response);
}

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function showMessage(text, error = false) { elements.message.textContent = text; elements.message.className = `visible${error ? " error" : ""}`; }
function clearMessage() { elements.message.textContent = ""; elements.message.className = ""; }
function shortTime(value) { return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function byId(id) { return document.getElementById(id); }
function escapeHtml(value) { const node = document.createElement("span"); node.textContent = String(value || ""); return node.innerHTML; }
function providerLabel(provider) { return ({ google: "Google", wechat: "WeChat", wecom: "WeCom", whatsapp: "WhatsApp" })[provider] || provider; }

refresh();
setInterval(refresh, 15_000);
