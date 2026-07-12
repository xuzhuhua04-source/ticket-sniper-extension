import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test(".env.example documents all commercial package checkout variables", async () => {
  const template = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  for (const key of [
    "PORT",
    "TICKET_SNIPER_BROWSER",
    "AUTHORIZE_NET_ENVIRONMENT",
    "AUTHORIZE_NET_API_LOGIN_ID",
    "AUTHORIZE_NET_TRANSACTION_KEY",
    "AUTHORIZE_NET_SIGNATURE_KEY",
    "AUTHORIZE_NET_STARTER_AMOUNT",
    "AUTHORIZE_NET_PROFESSIONAL_AMOUNT",
    "AUTHORIZE_NET_ENTERPRISE_AMOUNT",
    "AUTHORIZE_NET_DEV_MODE_PRO_AMOUNT",
    "AUTHORIZE_NET_DEVOPS_AMOUNT",
    "AUTHORIZE_NET_SECURITY_AMOUNT",
    "AUTHORIZE_NET_PERFORMANCE_AMOUNT",
    "AUTHORIZE_NET_AI_GOVERNANCE_AMOUNT",
    "AUTHORIZE_NET_ANALYTICS_AMOUNT",
    "AUTHORIZE_NET_OEM_PLATFORM_AMOUNT",
    "AUTHORIZE_NET_MERCHANT_PORTAL_URL",
    "SIG9_BEHAVIOR_INGEST_KEY",
    "WEB_BLOOMBERG_INGEST_KEY"
  ]) {
    assert.match(template, new RegExp(`^#?\\s*${key}=`, "m"), `${key} is missing from .env.example`);
  }
});
