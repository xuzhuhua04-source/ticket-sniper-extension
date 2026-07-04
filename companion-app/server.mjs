import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { AccountStore } from "./src/account-store.mjs";
import { authProviderStatus, finishOAuth, requestWhatsAppOtp, startOAuth, verifyWhatsAppOtp } from "./src/auth.mjs";
import { billingStatus, checkoutUrl, portalUrl } from "./src/billing.mjs";
import { channelStatus, dispatchEvent } from "./src/channels.mjs";
import { EventStore } from "./src/event-store.mjs";
import { sanitizeEvent } from "./src/events.mjs";

try { process.loadEnvFile?.(process.env.VISA_MONITOR_ENV || undefined); } catch { /* Environment configuration is optional. */ }

const root = resolve(import.meta.dirname);
const publicRoot = resolve(root, "public");
const defaultDataRoot = resolve(process.env.VISA_MONITOR_DATA_DIR || root, "data");
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json"
};

export async function startServer(options = {}) {
  const port = Math.max(1024, Number(options.port ?? process.env.PORT) || 4390);
  const host = options.host || "127.0.0.1";
  const store = new EventStore(options.eventFile || resolve(defaultDataRoot, "events.json"));
  const accounts = new AccountStore(options.accountFile || resolve(defaultDataRoot, "accounts.json"));
  await store.load();
  await accounts.load();

  const server = createServer(async (request, response) => {
    try {
      setSecurityHeaders(response);
      setCors(request, response, port);
      if (request.method === "OPTIONS") return response.writeHead(204).end();
      const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

      if (url.pathname === "/api/auth/status" && request.method === "GET") {
        return json(response, 200, { ok: true, authenticated: Boolean(currentUser(request, accounts)), user: currentUser(request, accounts), providers: authProviderStatus() });
      }
      if (url.pathname.startsWith("/api/auth/start/") && request.method === "GET") {
        const provider = url.pathname.split("/").pop();
        return redirect(response, startOAuth(provider));
      }
      if (url.pathname.startsWith("/api/auth/callback/") && request.method === "GET") {
        const provider = url.pathname.split("/").pop();
        const identity = await finishOAuth(provider, url.searchParams.get("code"), url.searchParams.get("state"));
        const user = await accounts.upsertIdentity(identity);
        const session = await accounts.createSession(user.id);
        setSessionCookie(response, session);
        return authComplete(response);
      }
      if (url.pathname === "/api/auth/whatsapp/request" && request.method === "POST") {
        const body = await readJson(request);
        const phone = await requestWhatsAppOtp(body.phone);
        return json(response, 202, { ok: true, phone, expiresInSeconds: 300 });
      }
      if (url.pathname === "/api/auth/whatsapp/verify" && request.method === "POST") {
        const body = await readJson(request);
        const identity = verifyWhatsAppOtp(body.phone, body.code);
        const user = await accounts.upsertIdentity(identity);
        const session = await accounts.createSession(user.id);
        setSessionCookie(response, session);
        return json(response, 200, { ok: true, user: accounts.userForSession(session) });
      }
      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        await accounts.removeSession(sessionToken(request));
        clearSessionCookie(response);
        return json(response, 200, { ok: true });
      }

      if (url.pathname === "/api/status" && request.method === "GET") {
        return json(response, 200, { ok: true, channels: channelStatus(), billing: billingStatus(), auth: { authenticated: Boolean(currentUser(request, accounts)), user: currentUser(request, accounts), providers: authProviderStatus() }, eventCount: store.count() });
      }
      if (url.pathname === "/api/events" && request.method === "GET") {
        requireToken(request);
        return json(response, 200, { ok: true, events: store.list() });
      }
      if (url.pathname === "/api/events" && request.method === "POST") {
        requireToken(request);
        const event = sanitizeEvent(await readJson(request));
        const deliveries = await dispatchEvent(event);
        await store.add({ ...event, deliveries });
        return json(response, 202, { ok: true, event, deliveries });
      }
      if (url.pathname === "/api/test" && request.method === "POST") {
        requireToken(request);
        const event = sanitizeEvent({ type: "test", title: "Visa Monitor test", message: "Companion notification channels are connected.", occurredAt: Date.now() });
        const deliveries = await dispatchEvent(event);
        await store.add({ ...event, deliveries });
        return json(response, 202, { ok: true, event, deliveries });
      }
      if (url.pathname === "/api/billing/checkout" && request.method === "POST") {
        requireToken(request);
        const body = await readJson(request);
        return json(response, 200, { ok: true, url: checkoutUrl(String(body.plan || "")) });
      }
      if (url.pathname === "/api/billing/portal" && request.method === "POST") {
        requireToken(request);
        return json(response, 200, { ok: true, url: portalUrl() });
      }
      await serveStatic(url.pathname, response);
    } catch (error) {
      json(response, error.status || (error.code === "ENOENT" ? 404 : 500), { ok: false, error: error.message || String(error) });
    }
  });

  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolveListen);
  });
  console.log(`Visa Monitor Companion: http://${host}:${port}`);
  return { server, port, host, url: `http://${host}:${port}` };
}

function requireToken(request) {
  const expected = process.env.COMPANION_TOKEN || "";
  if (!expected || expected.length < 16) throw httpError(503, "Set COMPANION_TOKEN to a value of at least 16 characters.");
  const supplied = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!timingSafeEqual(supplied, expected)) throw httpError(401, "Invalid companion token.");
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw httpError(413, "Request body is too large.");
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch { throw httpError(400, "Request body must be valid JSON."); }
}

async function serveStatic(pathname, response) {
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  let file = resolve(publicRoot, relative);
  if (!file.startsWith(publicRoot + sep) && file !== publicRoot) throw httpError(403, "Forbidden.");
  if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
  const body = await readFile(file);
  response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": relative === "sw.js" ? "no-cache" : "no-store" });
  response.end(body);
}

function setSecurityHeaders(response) {
  response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
}

function setCors(request, response, port) {
  const origin = String(request.headers.origin || "");
  if (origin.startsWith("chrome-extension://") || origin.startsWith("extension://") || origin === `http://127.0.0.1:${port}`) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function json(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

function redirect(response, location) {
  response.writeHead(302, { Location: location, "Cache-Control": "no-store" });
  response.end();
}

function currentUser(request, accounts) { return accounts.userForSession(sessionToken(request)); }
function sessionToken(request) {
  const cookies = String(request.headers.cookie || "").split(";").map(value => value.trim());
  const session = cookies.find(value => value.startsWith("visa_session="));
  return session ? decodeURIComponent(session.slice("visa_session=".length)) : "";
}
function setSessionCookie(response, token) {
  response.setHeader("Set-Cookie", `visa_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
}
function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", "visa_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}
function authComplete(response) {
  const body = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sign-in complete</title><link rel="stylesheet" href="/style.css"></head><body class="auth-complete"><main><section class="surface"><h1>Signed in</h1><p>Your Visa Monitor account is ready. You can close this window.</p></section></main><script src="/auth-complete.js"></script></body></html>';
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(body);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  startServer().catch(error => { console.error(error); process.exitCode = 1; });
}
