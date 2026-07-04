import { createHash, randomBytes, randomInt } from "node:crypto";

const challenges = new Map();
const otpChallenges = new Map();
const CHALLENGE_LIFETIME = 10 * 60 * 1000;
const OTP_LIFETIME = 5 * 60 * 1000;

export function authProviderStatus(env = process.env) {
  return {
    google: Boolean(env.GOOGLE_AUTH_CLIENT_ID && env.GOOGLE_AUTH_CLIENT_SECRET),
    wechat: Boolean(env.WECHAT_LOGIN_APP_ID && env.WECHAT_LOGIN_APP_SECRET),
    wecom: Boolean(env.WECOM_CORP_ID && env.WECOM_AGENT_ID && env.WECOM_APP_SECRET),
    whatsapp: Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_AUTH_TEMPLATE_NAME)
  };
}

export function startOAuth(provider, env = process.env) {
  const available = authProviderStatus(env);
  if (!available[provider] || provider === "whatsapp") throw httpError(503, `${providerName(provider)} sign-in is not configured.`);
  pruneChallenges();
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  challenges.set(state, { provider, verifier, expiresAt: Date.now() + CHALLENGE_LIFETIME });
  const redirectUri = callbackUrl(provider, env);

  if (provider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    setParams(url, { client_id: env.GOOGLE_AUTH_CLIENT_ID, redirect_uri: redirectUri, response_type: "code", scope: "openid profile email", state, code_challenge: base64urlHash(verifier), code_challenge_method: "S256", prompt: "select_account" });
    return url.href;
  }
  if (provider === "wechat") {
    const url = new URL("https://open.weixin.qq.com/connect/qrconnect");
    setParams(url, { appid: env.WECHAT_LOGIN_APP_ID, redirect_uri: redirectUri, response_type: "code", scope: "snsapi_login", state });
    return `${url.href}#wechat_redirect`;
  }
  const url = new URL("https://login.work.weixin.qq.com/wwlogin/sso/login");
  setParams(url, { login_type: "CorpApp", appid: env.WECOM_CORP_ID, agentid: env.WECOM_AGENT_ID, redirect_uri: redirectUri, state });
  return url.href;
}

export async function finishOAuth(provider, code, state, env = process.env, fetchImpl = fetch) {
  pruneChallenges();
  const challenge = challenges.get(state);
  challenges.delete(state);
  if (!challenge || challenge.provider !== provider || challenge.expiresAt <= Date.now()) throw httpError(400, "The sign-in request expired or failed its state check.");
  if (!code) throw httpError(400, "The identity provider did not return an authorization code.");
  if (provider === "google") return finishGoogle(code, challenge.verifier, env, fetchImpl);
  if (provider === "wechat") return finishWeChat(code, env, fetchImpl);
  if (provider === "wecom") return finishWeCom(code, env, fetchImpl);
  throw httpError(400, "Unsupported identity provider.");
}

export async function requestWhatsAppOtp(phone, env = process.env, fetchImpl = fetch) {
  if (!authProviderStatus(env).whatsapp) throw httpError(503, "WhatsApp sign-in is not configured.");
  const normalized = normalizePhone(phone);
  const existing = otpChallenges.get(normalized);
  if (existing && existing.sentAt > Date.now() - 60_000) throw httpError(429, "Wait one minute before requesting another code.");
  const code = String(randomInt(100000, 1000000));
  otpChallenges.set(normalized, { codeHash: hashOtp(normalized, code), expiresAt: Date.now() + OTP_LIFETIME, sentAt: Date.now(), attempts: 0 });
  const version = /^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_VERSION || "") ? env.WHATSAPP_GRAPH_VERSION : "v23.0";
  const response = await fetchImpl(`https://graph.facebook.com/${version}/${encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: normalized.slice(1), type: "template", template: {
      name: env.WHATSAPP_AUTH_TEMPLATE_NAME,
      language: { code: env.WHATSAPP_AUTH_TEMPLATE_LANGUAGE || "en_US" },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] }
      ]
    } })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(body.messages)) {
    otpChallenges.delete(normalized);
    throw httpError(502, `WhatsApp could not send the authentication code: ${body.error?.message || response.status}`);
  }
  return normalized;
}

export function verifyWhatsAppOtp(phone, code) {
  const normalized = normalizePhone(phone);
  const challenge = otpChallenges.get(normalized);
  if (!challenge || challenge.expiresAt <= Date.now()) { otpChallenges.delete(normalized); throw httpError(400, "The WhatsApp code expired."); }
  challenge.attempts += 1;
  if (challenge.attempts > 5) { otpChallenges.delete(normalized); throw httpError(429, "Too many incorrect attempts. Request a new code."); }
  if (challenge.codeHash !== hashOtp(normalized, String(code || ""))) throw httpError(400, "The WhatsApp code is incorrect.");
  otpChallenges.delete(normalized);
  return { provider: "whatsapp", subject: normalized, displayName: `WhatsApp ${normalized.slice(-4)}`, avatarUrl: "" };
}

async function finishGoogle(code, verifier, env, fetchImpl) {
  const token = await fetchJson(fetchImpl, "https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: env.GOOGLE_AUTH_CLIENT_ID, client_secret: env.GOOGLE_AUTH_CLIENT_SECRET, redirect_uri: callbackUrl("google", env), grant_type: "authorization_code", code_verifier: verifier }) });
  const profile = await fetchJson(fetchImpl, "https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!profile.sub) throw httpError(502, "Google did not return a stable account identifier.");
  return { provider: "google", subject: profile.sub, displayName: profile.name || profile.email || "Google user", avatarUrl: profile.picture || "" };
}

async function finishWeChat(code, env, fetchImpl) {
  const url = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  setParams(url, { appid: env.WECHAT_LOGIN_APP_ID, secret: env.WECHAT_LOGIN_APP_SECRET, code, grant_type: "authorization_code" });
  const token = await fetchJson(fetchImpl, url);
  const profileUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
  setParams(profileUrl, { access_token: token.access_token, openid: token.openid, lang: "en" });
  const profile = await fetchJson(fetchImpl, profileUrl);
  const subject = token.unionid || token.openid;
  if (!subject) throw httpError(502, "WeChat did not return a stable account identifier.");
  return { provider: "wechat", subject, displayName: profile.nickname || "WeChat user", avatarUrl: profile.headimgurl || "" };
}

async function finishWeCom(code, env, fetchImpl) {
  const tokenUrl = new URL("https://qyapi.weixin.qq.com/cgi-bin/gettoken");
  setParams(tokenUrl, { corpid: env.WECOM_CORP_ID, corpsecret: env.WECOM_APP_SECRET });
  const token = await fetchJson(fetchImpl, tokenUrl);
  const identityUrl = new URL("https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo");
  setParams(identityUrl, { access_token: token.access_token, code });
  const identity = await fetchJson(fetchImpl, identityUrl);
  const subject = identity.userid || identity.openid;
  if (!subject) throw httpError(502, "WeCom did not return a user identity.");
  return { provider: "wecom", subject, displayName: identity.userid || "WeCom user", avatarUrl: "" };
}

async function fetchJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.errcode || body.error) throw httpError(502, body.errmsg || body.error_description || body.error?.message || `Identity provider request failed (${response.status}).`);
  return body;
}

function callbackUrl(provider, env) {
  const base = new URL(env.AUTH_BASE_URL || "http://127.0.0.1:4390");
  if (!(["http:", "https:"].includes(base.protocol)) || (base.protocol === "http:" && !["127.0.0.1", "localhost"].includes(base.hostname))) throw httpError(500, "AUTH_BASE_URL must use HTTPS or local loopback HTTP.");
  return new URL(`/api/auth/callback/${provider}`, base).href;
}
function normalizePhone(value) {
  const phone = String(value || "").replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw httpError(400, "Enter the WhatsApp number in international format, such as +12025550123.");
  return phone;
}
function providerName(value) { return ({ google: "Google", wechat: "WeChat", wecom: "WeCom", whatsapp: "WhatsApp" })[value] || "Provider"; }
function setParams(url, values) { for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value); }
function base64urlHash(value) { return createHash("sha256").update(value).digest("base64url"); }
function hashOtp(phone, code) { return createHash("sha256").update(`${phone}:${code}`).digest("hex"); }
function pruneChallenges() { for (const [key, value] of challenges) if (value.expiresAt <= Date.now()) challenges.delete(key); }
function httpError(status, message) { const error = new Error(message); error.status = status; return error; }
