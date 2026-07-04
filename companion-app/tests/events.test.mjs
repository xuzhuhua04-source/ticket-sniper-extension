import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeEvent } from "../src/events.mjs";
import { channelStatus, dispatchEvent } from "../src/channels.mjs";

test("event sanitizer accepts supported events and removes unsafe URL schemes", () => {
  const event = sanitizeEvent({ type: "calendar_changed", title: "Calendar changed", message: "Review manually", url: "javascript:alert(1)", occurredAt: 42 });
  assert.equal(event.type, "calendar_changed");
  assert.equal(event.url, "");
  assert.equal(event.occurredAt, 42);
  assert.throws(() => sanitizeEvent({ type: "unknown", title: "x", message: "y" }), /unsupported/i);
});

test("channel status exposes only fully configured providers", () => {
  assert.deepEqual(channelStatus({ WECOM_WEBHOOK_URL: "https://example.test/hook" }), { wecom: true, wechat: false, whatsapp: false });
});

test("WeCom delivery uses a text webhook without exposing provider secrets", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ errcode: 0 }) };
  };
  const event = sanitizeEvent({ type: "test", title: "Test", message: "Ready", occurredAt: 100 });
  const result = await dispatchEvent(event, { WECOM_WEBHOOK_URL: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=secret" }, fetchImpl);
  assert.equal(result[0].ok, true);
  assert.match(request.url, /^https:\/\/qyapi\.weixin\.qq\.com\//);
  assert.equal(JSON.parse(request.options.body).msgtype, "text");
});
