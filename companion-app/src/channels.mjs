const tokenCache = { value: "", expiresAt: 0 };

export function channelStatus(env = process.env) {
  return {
    wecom: Boolean(env.WECOM_WEBHOOK_URL),
    wechat: Boolean(env.WECHAT_APP_ID && env.WECHAT_APP_SECRET && env.WECHAT_OPEN_ID && env.WECHAT_TEMPLATE_ID),
    whatsapp: Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_TO && env.WHATSAPP_TEMPLATE_NAME)
  };
}

export async function dispatchEvent(event, env = process.env, fetchImpl = fetch) {
  const configured = channelStatus(env);
  const jobs = [];
  if (configured.wecom) jobs.push(runChannel("wecom", () => sendWeCom(event, env, fetchImpl)));
  if (configured.wechat) jobs.push(runChannel("wechat", () => sendWeChat(event, env, fetchImpl)));
  if (configured.whatsapp) jobs.push(runChannel("whatsapp", () => sendWhatsApp(event, env, fetchImpl)));
  return Promise.all(jobs);
}

async function runChannel(channel, operation) {
  try {
    const result = await operation();
    return { channel, ok: true, result };
  } catch (error) {
    return { channel, ok: false, error: error.message || String(error) };
  }
}

async function sendWeCom(event, env, fetchImpl) {
  const response = await fetchImpl(assertHttpsUrl(env.WECOM_WEBHOOK_URL, "WeCom webhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msgtype: "text", text: { content: messageText(event) } })
  });
  return requireProviderSuccess(response, "WeCom", body => body.errcode === 0);
}

async function sendWeChat(event, env, fetchImpl) {
  const accessToken = await getWeChatAccessToken(env, fetchImpl);
  const endpoint = new URL("https://api.weixin.qq.com/cgi-bin/message/template/send");
  endpoint.searchParams.set("access_token", accessToken);
  const data = {};
  data[env.WECHAT_TEMPLATE_FIELD_TITLE || "first"] = { value: event.title };
  data[env.WECHAT_TEMPLATE_FIELD_TYPE || "keyword1"] = { value: event.type };
  data[env.WECHAT_TEMPLATE_FIELD_MESSAGE || "keyword2"] = { value: event.message };
  data[env.WECHAT_TEMPLATE_FIELD_TIME || "keyword3"] = { value: new Date(event.occurredAt).toLocaleString() };
  data[env.WECHAT_TEMPLATE_FIELD_REMARK || "remark"] = { value: event.url || "Open Visa Monitor for details." };
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ touser: env.WECHAT_OPEN_ID, template_id: env.WECHAT_TEMPLATE_ID, url: event.url || undefined, data })
  });
  return requireProviderSuccess(response, "WeChat", body => body.errcode === 0);
}

async function getWeChatAccessToken(env, fetchImpl) {
  if (tokenCache.value && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  const endpoint = new URL("https://api.weixin.qq.com/cgi-bin/token");
  endpoint.searchParams.set("grant_type", "client_credential");
  endpoint.searchParams.set("appid", env.WECHAT_APP_ID);
  endpoint.searchParams.set("secret", env.WECHAT_APP_SECRET);
  const response = await fetchImpl(endpoint);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error(`WeChat token request failed: ${body.errmsg || response.status}`);
  tokenCache.value = body.access_token;
  tokenCache.expiresAt = Date.now() + Math.max(300, Number(body.expires_in) || 7200) * 1000;
  return tokenCache.value;
}

async function sendWhatsApp(event, env, fetchImpl) {
  const version = /^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_VERSION || "") ? env.WHATSAPP_GRAPH_VERSION : "v23.0";
  const endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID)}/messages`;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: env.WHATSAPP_TO,
      type: "template",
      template: {
        name: env.WHATSAPP_TEMPLATE_NAME,
        language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" },
        components: [{ type: "body", parameters: [
          { type: "text", text: event.title },
          { type: "text", text: event.message },
          { type: "text", text: new Date(event.occurredAt).toLocaleString() }
        ] }]
      }
    })
  });
  return requireProviderSuccess(response, "WhatsApp", body => Array.isArray(body.messages) && body.messages.length > 0);
}

async function requireProviderSuccess(response, provider, predicate) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !predicate(body)) throw new Error(`${provider} rejected the message: ${body.errmsg || body.error?.message || response.status}`);
  return body;
}

function assertHttpsUrl(value, label) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} is invalid.`); }
  if (url.protocol !== "https:") throw new Error(`${label} must use HTTPS.`);
  return url.href;
}

function messageText(event) {
  return [event.title, event.message, new Date(event.occurredAt).toLocaleString(), event.url].filter(Boolean).join("\n");
}
