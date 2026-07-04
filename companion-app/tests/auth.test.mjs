import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AccountStore } from "../src/account-store.mjs";
import { authProviderStatus, requestWhatsAppOtp, startOAuth, verifyWhatsAppOtp } from "../src/auth.mjs";

test("account store creates an identity and remembers a hashed session", async () => {
  const directory = await mkdtemp(join(tmpdir(), "visa-monitor-account-"));
  try {
    const file = join(directory, "accounts.json");
    const first = new AccountStore(file);
    await first.load();
    const user = await first.upsertIdentity({ provider: "google", subject: "subject-1", displayName: "Test User", avatarUrl: "https://example.com/avatar.png" });
    const session = await first.createSession(user.id);
    assert.equal(first.userForSession(session).displayName, "Test User");
    const second = new AccountStore(file);
    await second.load();
    assert.equal(second.userForSession(session).providers[0], "google");
    assert.equal(JSON.stringify(second.data).includes(session), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("Google OAuth start uses state and PKCE", () => {
  const url = new URL(startOAuth("google", { GOOGLE_AUTH_CLIENT_ID: "client", GOOGLE_AUTH_CLIENT_SECRET: "secret", AUTH_BASE_URL: "http://127.0.0.1:4390" }));
  assert.equal(url.hostname, "accounts.google.com");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("state"));
  assert.equal(url.searchParams.get("redirect_uri"), "http://127.0.0.1:4390/api/auth/callback/google");
});

test("WhatsApp authentication sends and verifies a short-lived code", async () => {
  const env = { WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_AUTH_TEMPLATE_NAME: "login", WHATSAPP_AUTH_TEMPLATE_LANGUAGE: "en_US", WHATSAPP_GRAPH_VERSION: "v23.0" };
  assert.equal(authProviderStatus(env).whatsapp, true);
  let code = "";
  const fetchImpl = async (_url, options) => {
    const payload = JSON.parse(options.body);
    code = payload.template.components[0].parameters[0].text;
    return new Response(JSON.stringify({ messages: [{ id: "message-1" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  await requestWhatsAppOtp("+1 202 555 0123", env, fetchImpl);
  const identity = verifyWhatsAppOtp("+12025550123", code);
  assert.equal(identity.provider, "whatsapp");
  assert.equal(identity.subject, "+12025550123");
});

test("unconfigured providers and invalid phone numbers fail closed", async () => {
  assert.throws(() => startOAuth("wechat", {}), /not configured/i);
  await assert.rejects(() => requestWhatsAppOtp("not-a-phone", { WHATSAPP_PHONE_NUMBER_ID: "1", WHATSAPP_ACCESS_TOKEN: "x", WHATSAPP_AUTH_TEMPLATE_NAME: "login" }), /international format/i);
});
