import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";

import { accountEntitlements, billingStatus, checkoutUrl, createCheckoutSession, portalUrl, verifyAuthorizeNetWebhook } from "../companion-app/src/billing.mjs";
import { startStandaloneServer } from "../standalone-server.mjs";

test("billing status exposes core plans, paid modules, add-ons, and entitlements", () => {
  const status = billingStatus({});
  assert.equal(status.provider, "Authorize.Net Accept Hosted");
  assert.equal(status.plans.length, 3);
  assert.equal(status.modules.length, 5);
  assert.equal(status.addons.some(addon => addon.id === "dev-mode-pro"), true);
  assert.deepEqual(status.plans.map(plan => plan.id), [
    "starter",
    "professional",
    "enterprise"
  ]);
  assert.equal(status.configured, false);
  assert.equal(status.entitlements.status, "signed_out");
});

test("checkout URL requires Authorize.Net credentials and item amounts", () => {
  const env = {
    AUTHORIZE_NET_API_LOGIN_ID: "login",
    AUTHORIZE_NET_TRANSACTION_KEY: "transaction",
    AUTHORIZE_NET_PERFORMANCE_SPECTRUM_AMOUNT: "499.00",
    AUTHORIZE_NET_PERFORMANCE_SPECTRUM_PRICE_LABEL: "$499/mo"
  };
  assert.equal(checkoutUrl("performance-spectrum", env), "https://test.authorize.net/payment/payment");
  assert.throws(() => checkoutUrl("update-radar", env), /checkout is not configured/);
  assert.throws(() => checkoutUrl("starter", env), /checkout is not configured/);
  assert.throws(() => checkoutUrl("unknown", env), /Unknown Organ9/);
});

test("Authorize.Net Accept Hosted token creation validates provider response", async () => {
  const env = {
    AUTHORIZE_NET_API_LOGIN_ID: "login",
    AUTHORIZE_NET_TRANSACTION_KEY: "transaction",
    AUTHORIZE_NET_PROFESSIONAL_AMOUNT: "199.00",
    AUTHORIZE_NET_SUCCESS_URL: "https://organ9.example/success",
    AUTHORIZE_NET_CANCEL_URL: "https://organ9.example/cancel"
  };
  const calls = [];
  const session = await createCheckoutSession({ planId: "professional" }, { email: "buyer@example.com" }, env, async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({ token: "hosted-token-123", messages: { resultCode: "Ok", message: [{ text: "Successful." }] } })
    };
  });
  assert.equal(session.mode, "authorize_net_accept_hosted");
  assert.equal(session.url, "https://test.authorize.net/payment/payment");
  assert.equal(session.formFields.token, "hosted-token-123");
  assert.equal(calls[0].url, "https://apitest.authorize.net/xml/v1/request.api");
  assert.match(String(calls[0].options.body), /getHostedPaymentPageRequest/);
  assert.match(String(calls[0].options.body), /organ9_item_id/);
});

test("entitlements unlock Dev Mode Pro only through addon or enterprise", () => {
  const starter = accountEntitlements({ email: "a@example.com", plan: "starter", status: "active" });
  const proAddon = accountEntitlements({ email: "a@example.com", plan: "professional", addons: ["dev-mode-pro"], status: "active" });
  const enterprise = accountEntitlements({ email: "a@example.com", plan: "enterprise", status: "active" });
  assert.equal(starter.addons.includes("dev-mode-pro"), false);
  assert.equal(proAddon.addons.includes("dev-mode-pro"), true);
  assert.equal(enterprise.addons.includes("dev-mode-pro"), true);
  assert.equal(enterprise.modules.length, 5);
});

test("merchant portal accepts only Authorize.Net merchant portal hosts", () => {
  assert.equal(portalUrl({ AUTHORIZE_NET_MERCHANT_PORTAL_URL: "https://sandbox.authorize.net/" }), "https://sandbox.authorize.net/");
  assert.throws(() => portalUrl({ AUTHORIZE_NET_MERCHANT_PORTAL_URL: "https://buy.stripe.com/not-portal" }), /Authorize.Net merchant portal URL is not configured/);
});

test("Authorize.Net webhook rejects invalid signatures and accepts valid signed payloads", () => {
  const body = JSON.stringify({ eventType: "net.authorize.payment.authcapture.created", payload: { userFields: { userField: [{ name: "organ9_item_id", value: "enterprise" }] } } });
  const secret = "00112233445566778899AABBCCDDEEFF";
  const signature = createHmac("sha512", Buffer.from(secret, "hex")).update(body).digest("hex").toUpperCase();
  assert.equal(verifyAuthorizeNetWebhook(body, `sha512=${signature}`, { AUTHORIZE_NET_SIGNATURE_KEY: secret }).eventType, "net.authorize.payment.authcapture.created");
  assert.throws(() => verifyAuthorizeNetWebhook(body, "sha512=bad", { AUTHORIZE_NET_SIGNATURE_KEY: secret }), /Invalid Authorize.Net webhook signature/);
});

test("billing checkout API reports unconfigured packages as service unavailable", async () => {
  const app = await startStandaloneServer({ port: 4792 });
  try {
    const response = await fetch(`${app.url}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: "performance-spectrum" })
    });
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.match(payload.error, /checkout is not configured/);
  } finally {
    await new Promise(resolve => app.server.close(resolve));
  }
});

test("account entitlements API returns server-side access state", async () => {
  const app = await startStandaloneServer({ port: 4793 });
  try {
    const response = await fetch(`${app.url}/api/account/entitlements`, {
      headers: { "X-Organ9-Account-Email": "buyer@example.com", "X-Organ9-Plan": "enterprise" }
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.entitlements.plan, "enterprise");
    assert.equal(payload.entitlements.addons.includes("dev-mode-pro"), true);
  } finally {
    await new Promise(resolve => app.server.close(resolve));
  }
});
