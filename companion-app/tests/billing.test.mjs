import assert from "node:assert/strict";
import test from "node:test";
import { billingStatus, checkoutUrl, portalUrl } from "../src/billing.mjs";

test("billing exposes configured Authorize.Net hosted checkout without exposing secrets", () => {
  const env = {
    AUTHORIZE_NET_API_LOGIN_ID: "login",
    AUTHORIZE_NET_TRANSACTION_KEY: "transaction",
    AUTHORIZE_NET_STARTER_AMOUNT: "9.00",
    AUTHORIZE_NET_STARTER_PRICE_LABEL: "$9 / month",
    AUTHORIZE_NET_MERCHANT_PORTAL_URL: "https://sandbox.authorize.net/"
  };
  const status = billingStatus(env);
  assert.equal(status.configured, true);
  assert.equal(status.portalAvailable, true);
  assert.equal(status.plans[0].priceLabel, "$9 / month");
  assert.equal("checkoutUrl" in status.plans[0], false);
  assert.equal(checkoutUrl("starter", env), "https://test.authorize.net/payment/payment");
  assert.equal(portalUrl(env), "https://sandbox.authorize.net/");
});

test("billing rejects incomplete Authorize.Net checkout configuration", () => {
  assert.throws(() => checkoutUrl("starter", { AUTHORIZE_NET_API_LOGIN_ID: "login", AUTHORIZE_NET_STARTER_AMOUNT: "9.00" }), /not configured/i);
  assert.throws(() => checkoutUrl("starter", { AUTHORIZE_NET_API_LOGIN_ID: "login", AUTHORIZE_NET_TRANSACTION_KEY: "transaction", AUTHORIZE_NET_STARTER_AMOUNT: "free" }), /not configured/i);
  assert.throws(() => checkoutUrl("unknown", {}), /Unknown Organ9 package/i);
});
