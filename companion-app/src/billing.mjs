import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const MODULE_DEFINITIONS = Object.freeze([
  { id: "devops", envKey: "DEVOPS", code: "DOP", name: "DevOps", tier: "starter", description: "Behavior and frequency monitoring for release health, regressions, and live runtime operations." },
  { id: "security", envKey: "SECURITY", code: "SEC", name: "Security", tier: "enterprise", description: "Behavior-risk intelligence for SOC, compliance, and hostile runtime signal review." },
  { id: "performance", envKey: "PERFORMANCE", code: "PERF", name: "Performance", tier: "professional", description: "Frequency and dependency analysis for performance storms, resource pressure, and regressions." },
  { id: "ai-governance", envKey: "AI_GOVERNANCE", code: "AIG", name: "AI Governance", tier: "enterprise", description: "AI-like inference, worker, WASM, GPU, and risk-frequency evidence for governance teams." },
  { id: "analytics", envKey: "ANALYTICS", code: "ANL", name: "Analytics", tier: "starter", description: "Buyer-readable behavior and dependency trends for product analytics and competitive monitoring." },
  { id: "oem-platform", envKey: "OEM_PLATFORM", code: "OEM", name: "OEM / Platform", tier: "enterprise", description: "All V1 organs packaged for platform embedding, data licensing, and enterprise integration." }
]);

export const PLAN_DEFINITIONS = Object.freeze([
  { id: "starter", envKey: "STARTER", name: "Starter", description: "Customer-readable monitoring for one live website target.", includedModules: ["devops", "analytics"], includedAddons: [], limits: { retentionDays: 7, maxTargets: 1, exportAccess: false, apiAccess: false, seats: 1 } },
  { id: "professional", envKey: "PROFESSIONAL", name: "Professional", description: "Commercial monitoring for teams that need performance, analytics, and DevOps visibility.", includedModules: ["devops", "performance", "analytics"], includedAddons: ["exports-api"], limits: { retentionDays: 30, maxTargets: 5, exportAccess: true, apiAccess: true, seats: 3 } },
  { id: "enterprise", envKey: "ENTERPRISE", name: "Enterprise", description: "Full SIG9 suite with security, risk, AI activity, and developer diagnostics.", includedModules: MODULE_DEFINITIONS.map(item => item.id), includedAddons: ["dev-mode-pro", "extended-retention", "team-seats", "exports-api"], limits: { retentionDays: 365, maxTargets: 50, exportAccess: true, apiAccess: true, seats: 25 } }
]);

export const ADDON_DEFINITIONS = Object.freeze([
  { id: "dev-mode-pro", envKey: "DEV_MODE_PRO", name: "Dev Mode Pro", description: "Raw runtime ledger, SIG9 internals, signatures, developer graphs, and advanced exports." },
  { id: "extended-retention", envKey: "EXTENDED_RETENTION", name: "Extended Retention", description: "Longer diagnostic history for audits and customer reports." },
  { id: "team-seats", envKey: "TEAM_SEATS", name: "Team Seats", description: "Additional workspace users for commercial teams." },
  { id: "exports-api", envKey: "EXPORTS_API", name: "Exports + API Access", description: "Commercial exports and API-ready diagnostic data." }
]);

const ALL_ITEMS = Object.freeze([...PLAN_DEFINITIONS, ...MODULE_DEFINITIONS, ...ADDON_DEFINITIONS]);

export function billingStatus(env = process.env, account = {}) {
  const configured = Boolean(authorizeNetCredentials(env));
  const plans = PLAN_DEFINITIONS.map(item => decorateBillingItem(item, "plan", env));
  const modules = MODULE_DEFINITIONS.map(item => decorateBillingItem(item, "module", env));
  const addons = ADDON_DEFINITIONS.map(item => decorateBillingItem(item, "addon", env));
  return {
    provider: "Authorize.Net Accept Hosted",
    mode: configured ? "authorize_net_accept_hosted" : "authorize_net_unconfigured",
    configured,
    portalAvailable: Boolean(validAuthorizeNetMerchantPortalUrl(env.AUTHORIZE_NET_MERCHANT_PORTAL_URL)),
    plans,
    modules,
    addons,
    legacyPlans: modules,
    entitlements: accountEntitlements(account, env)
  };
}

export function accountEntitlements(account = {}, env = process.env) {
  const status = normalizeEntitlementStatus(account.status || (account.email ? "demo" : "signed_out"));
  const plan = normalizePlanId(account.plan || (status === "signed_out" ? "" : "starter"));
  const planDef = PLAN_DEFINITIONS.find(item => item.id === plan);
  const modules = new Set(planDef?.includedModules || []);
  const addons = new Set(planDef?.includedAddons || []);
  for (const moduleId of account.modules || []) {
    const id = normalizeModuleId(moduleId);
    if (id) modules.add(id);
  }
  for (const addonId of account.addons || []) {
    const id = normalizeAddonId(addonId);
    if (id) addons.add(id);
  }
  if (plan === "enterprise") addons.add("dev-mode-pro");
  return {
    plan,
    modules: [...modules],
    addons: [...addons],
    status,
    limits: {
      retentionDays: planDef?.limits?.retentionDays || 0,
      exportAccess: Boolean(planDef?.limits?.exportAccess || addons.has("exports-api")),
      maxTargets: planDef?.limits?.maxTargets || 0,
      apiAccess: Boolean(planDef?.limits?.apiAccess || addons.has("exports-api")),
      seats: planDef?.limits?.seats || 1
    },
    source: account.source || (status === "demo" ? "local_demo" : "server")
  };
}

export function checkoutUrl(selection, env = process.env) {
  const item = resolveBillingItem(selection);
  if (!authorizeNetCredentials(env) || !authorizeNetAmount(item, env)) throw httpError(503, `${item.name} checkout is not configured.`);
  return authorizeNetHostedPaymentUrl(env);
}

export async function createCheckoutSession(selection, account = {}, env = process.env, fetchImpl = globalThis.fetch) {
  const item = resolveBillingItem(selection);
  const credentials = authorizeNetCredentials(env);
  const amount = authorizeNetAmount(item, env);
  if (!credentials || !amount) throw httpError(503, `${item.name} checkout is not configured.`);
  if (typeof fetchImpl !== "function") throw httpError(500, "Authorize.Net checkout requires fetch support.");
  const referenceId = `organ9-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const payload = {
    getHostedPaymentPageRequest: {
      merchantAuthentication: credentials,
      refId: referenceId,
      transactionRequest: {
        transactionType: "authCaptureTransaction",
        amount,
        order: {
          invoiceNumber: referenceId.slice(0, 20),
          description: cleanDescription(`SIG9 ${item.name}`)
        },
        customer: account.email ? { email: account.email } : undefined,
        userFields: {
          userField: [
            { name: "organ9_item_id", value: item.id },
            { name: "organ9_item_kind", value: item.kind },
            { name: "organ9_account_email", value: account.email || "" }
          ]
        }
      },
      hostedPaymentSettings: {
        setting: [
          {
            settingName: "hostedPaymentReturnOptions",
            settingValue: JSON.stringify({
              showReceipt: true,
              url: cleanUrl(env.AUTHORIZE_NET_SUCCESS_URL) || "http://127.0.0.1:4391/runtime-diagnostics.html?checkout=success",
              urlText: "Return to SIG9",
              cancelUrl: cleanUrl(env.AUTHORIZE_NET_CANCEL_URL) || "http://127.0.0.1:4391/runtime-diagnostics.html?checkout=cancel",
              cancelUrlText: "Cancel"
            })
          },
          {
            settingName: "hostedPaymentButtonOptions",
            settingValue: JSON.stringify({ text: `Pay ${item.name}`.slice(0, 40) })
          },
          {
            settingName: "hostedPaymentOrderOptions",
            settingValue: JSON.stringify({ show: true, merchantName: cleanLabel(env.AUTHORIZE_NET_MERCHANT_NAME) || "SIG9" })
          },
          {
            settingName: "hostedPaymentSecurityOptions",
            settingValue: JSON.stringify({ captcha: false })
          }
        ]
      }
    }
  };
  const response = await fetchImpl(authorizeNetApiEndpoint(env), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  const message = result.messages?.message?.[0]?.text || result.messages?.message?.text || "";
  if (!response.ok || result.messages?.resultCode !== "Ok" || !result.token) {
    throw httpError(response.status || 502, message || "Authorize.Net hosted payment token could not be created.");
  }
  return {
    mode: "authorize_net_accept_hosted",
    provider: "authorize.net",
    url: authorizeNetHostedPaymentUrl(env),
    method: "POST",
    formFields: { token: result.token },
    token: result.token,
    referenceId,
    item
  };
}

export function portalUrl(env = process.env) {
  const url = validAuthorizeNetMerchantPortalUrl(env.AUTHORIZE_NET_MERCHANT_PORTAL_URL);
  if (!url) throw httpError(503, "Authorize.Net merchant portal URL is not configured.");
  return url;
}

export function verifyAuthorizeNetWebhook(rawBody, signatureHeader, env = process.env) {
  const key = cleanSecret(env.AUTHORIZE_NET_SIGNATURE_KEY || env.AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY);
  if (!key) throw httpError(503, "Authorize.Net webhook signature key is not configured.");
  const signature = parseAuthorizeNetSignature(signatureHeader);
  const hmacKey = /^[a-f0-9]{32,}$/i.test(key) && key.length % 2 === 0 ? Buffer.from(key, "hex") : key;
  const expected = createHmac("sha512", hmacKey).update(rawBody).digest("hex").toUpperCase();
  if (!safeEqualHex(signature, expected)) {
    throw httpError(400, "Invalid Authorize.Net webhook signature.");
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    throw httpError(400, "Authorize.Net webhook body must be valid JSON.");
  }
}

export function entitlementsFromAuthorizeNetEvent(event = {}) {
  const payload = event.payload || event.notification || {};
  const fields = payload.userFields?.userField || payload.userField || [];
  const fieldMap = Object.fromEntries((Array.isArray(fields) ? fields : [fields])
    .filter(Boolean)
    .map(field => [normalizeBillingId(field.name), String(field.value || "")]));
  const status = normalizeAuthorizeNetStatus(event.eventType || payload.responseCode || payload.transactionStatus || "");
  const itemId = normalizeBillingId(fieldMap.organ9_item_id || payload.merchantReferenceId || payload.invoiceNumber || payload.order?.invoiceNumber || "");
  const email = payload.email || payload.customer?.email || fieldMap.organ9_account_email || "";
  const patch = { email, status, source: "authorize_net_webhook" };
  const item = itemId ? resolveBillingItem(itemId, { optional: true }) : null;
  if (item?.kind === "plan") patch.plan = item.id;
  if (item?.kind === "module") patch.modules = [item.id];
  if (item?.kind === "addon") patch.addons = [item.id];
  return patch;
}

function decorateBillingItem(item, kind, env) {
  const amount = authorizeNetAmount(item, env);
  const configured = Boolean(authorizeNetCredentials(env) && amount);
  return {
    ...item,
    kind,
    available: configured,
    checkoutMode: configured ? "authorize_net_accept_hosted" : "unconfigured",
    amountConfigured: Boolean(amount),
    hostedPaymentConfigured: configured,
    priceLabel: cleanLabel(env[`AUTHORIZE_NET_${item.envKey}_PRICE_LABEL`]) || defaultPriceLabel(item.id)
  };
}

function resolveBillingItem(selection, options = {}) {
  const id = normalizeBillingId(typeof selection === "string" ? selection : selection?.priceId || selection?.planId || selection?.moduleId || selection?.addonId || selection?.id);
  const item = ALL_ITEMS.find(candidate => candidate.id === id);
  if (!item && options.optional) return null;
  if (!item) throw httpError(400, "Unknown SIG9 package, plan, module, or add-on.");
  return {
    ...item,
    kind: PLAN_DEFINITIONS.some(candidate => candidate.id === item.id) ? "plan" :
      MODULE_DEFINITIONS.some(candidate => candidate.id === item.id) ? "module" : "addon"
  };
}

function normalizeBillingId(value) {
  return String(value || "").trim().toLowerCase().replace(/_/g, "-");
}

function normalizePlanId(value) {
  const id = normalizeBillingId(value);
  return PLAN_DEFINITIONS.some(item => item.id === id) ? id : "";
}

function normalizeModuleId(value) {
  const id = normalizeBillingId(value);
  return MODULE_DEFINITIONS.some(item => item.id === id) ? id : "";
}

function normalizeAddonId(value) {
  const id = normalizeBillingId(value);
  return ADDON_DEFINITIONS.some(item => item.id === id) ? id : "";
}

function normalizeEntitlementStatus(value) {
  const status = normalizeBillingId(value);
  return ["trialing", "active", "past-due", "past_due", "canceled", "demo", "signed-out", "signed_out"].includes(status)
    ? status.replace("-", "_")
    : "demo";
}

function normalizeAuthorizeNetStatus(value) {
  const status = normalizeEntitlementStatus(value);
  if (status === "demo" && /payment|authcapture|created|settled|captured|subscription\.created|subscription\.updated/i.test(String(value || ""))) return "active";
  if (/void|refund|declined|cancel|suspend|terminate/i.test(String(value || ""))) return "canceled";
  return status;
}

function authorizeNetCredentials(env = process.env) {
  const name = cleanSecret(env.AUTHORIZE_NET_API_LOGIN_ID);
  const transactionKey = cleanSecret(env.AUTHORIZE_NET_TRANSACTION_KEY);
  return name && transactionKey ? { name, transactionKey } : null;
}

function authorizeNetAmount(item, env = process.env) {
  const raw = String(env[`AUTHORIZE_NET_${item.envKey}_AMOUNT`] || "").trim();
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(raw)) return "";
  const amount = Number(raw);
  return amount > 0 ? amount.toFixed(2) : "";
}

function authorizeNetApiEndpoint(env = process.env) {
  return /^prod|production|live$/i.test(String(env.AUTHORIZE_NET_ENVIRONMENT || ""))
    ? "https://api.authorize.net/xml/v1/request.api"
    : "https://apitest.authorize.net/xml/v1/request.api";
}

function authorizeNetHostedPaymentUrl(env = process.env) {
  return /^prod|production|live$/i.test(String(env.AUTHORIZE_NET_ENVIRONMENT || ""))
    ? "https://accept.authorize.net/payment/payment"
    : "https://test.authorize.net/payment/payment";
}

function validAuthorizeNetMerchantPortalUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !["account.authorize.net", "sandbox.authorize.net"].includes(host)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function parseAuthorizeNetSignature(value) {
  const match = /^sha512=([a-f0-9]+)$/i.exec(String(value || "").trim());
  if (!match) throw httpError(400, "Missing Authorize.Net webhook signature.");
  return match[1].toUpperCase();
}

function safeEqualHex(left, right) {
  try {
    const a = Buffer.from(left, "hex");
    const b = Buffer.from(right, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function cleanSecret(value) {
  return String(value || "").trim();
}

function cleanUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function cleanDescription(value) {
  return cleanLabel(value).slice(0, 255);
}

function cleanLabel(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 48).trim();
}

function defaultPriceLabel(id) {
  return ({
    starter: "$499/mo",
    professional: "$1,999/mo",
    enterprise: "From $12,000/mo",
    devops: "$99/mo",
    security: "$999/mo",
    performance: "$499/mo",
    "ai-governance": "$999/mo",
    analytics: "$199/mo",
    "oem-platform": "$50k-$150k/yr",
    "dev-mode-pro": "$799/mo add-on",
    "extended-retention": "$499/mo add-on",
    "team-seats": "$199/seat/mo",
    "exports-api": "$699/mo add-on"
  })[id] || "Module subscription";
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
