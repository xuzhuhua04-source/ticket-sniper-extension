import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SecureBrowserRuntime } from "./secure-browser-runtime.mjs";

const profileDir = await mkdtemp(join(tmpdir(), "sig9-runtime-bridge-"));
const fixtureCards = Array.from({ length: 12 }, (_, index) => `
  <article class="card card-${index}" style="position: relative; display: flex; overflow: hidden">
    <h2>Runtime card ${index}</h2>
    <p>Bridge verification text segment ${index} should be visible to the runtime surface sampler.</p>
    <button aria-label="Open runtime card ${index}">Open</button>
    <input name="runtime-filter-${index}" aria-expanded="false">
    <img src="/asset-${index}.png" alt="Runtime card ${index}">
  </article>
`).join("");
const server = createServer((request, response) => {
  if (request.url === "/api/pulse") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end('{"ok":true}');
    return;
  }
  if (/^\/asset-\d+\.png/.test(request.url || "")) {
    response.writeHead(204, { "Content-Type": "image/png" });
    response.end();
    return;
  }
  if (request.url === "/app.css") {
    response.writeHead(200, { "Content-Type": "text/css" });
    response.end(".grid{display:grid}.card{contain:content}.card[aria-busy='true']{opacity:.8}");
    return;
  }
  if (request.url === "/app.js") {
    response.writeHead(200, { "Content-Type": "text/javascript" });
    response.end("queueMicrotask(()=>document.body.setAttribute('data-script-ready','true'));");
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(`<!doctype html>
    <html><head>
      <title>SIG9 bridge fixture</title>
      <link rel="stylesheet" href="/app.css">
      <script src="/app.js"></script>
      <style>@media (min-width: 800px) {.grid { display: grid; }}</style>
    </head>
    <body><main id="fixture" class="grid" role="main">${fixtureCards}</main><script>
      setTimeout(() => {
        const node = document.createElement("section");
        node.id = "live-node";
        node.textContent = "collector mutation";
        document.body.append(node);
        document.body.setAttribute("data-runtime-state", "changed");
        const style = document.createElement("style");
        style.textContent = "#live-node { display: block; }";
        document.head.append(style);
        fetch("/api/pulse").catch(() => {});
        console.warn("sig9 bridge fixture warning");
      }, 150);
    </script></body></html>`);
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();
const targetUrl = `http://127.0.0.1:${address.port}/fixture`;
const runtime = new SecureBrowserRuntime({
  profileDir,
  profileLabel: "bridge-verification",
  headless: true
});

try {
  await runtime.open(targetUrl);
  await new Promise(resolve => setTimeout(resolve, 1800));
  const result = await runtime.analyze(targetUrl);
  const facts = result.diagnostics.runtimeFactHistory || [];
  const channels = new Set(facts.map(fact => `${fact.source}/${fact.type}`));
  const bridgeFacts = runtime.runtimeFacts || [];
  const bridgeChannels = new Set(bridgeFacts.map(fact => `${fact.source}/${fact.type}`));
  assert.ok(facts.length >= 140, `expected at least 140 exported facts, got ${facts.length}`);
  assert.ok(bridgeFacts.length >= 80, `expected at least 80 live bridge facts, got ${bridgeFacts.length}`);
  assert.ok(bridgeChannels.size >= 8, `expected at least 8 live bridge channels, got ${bridgeChannels.size}`);
  assert.ok(bridgeFacts.some(fact => fact.transportLayer === "facts"), "structural facts did not cross the browser bridge");
  assert.ok(bridgeFacts.some(fact => fact.transportLayer === "diagnostics"), "diagnostic facts did not cross the browser bridge");
  assert.ok([...channels].some(channel => channel.startsWith("dom/")), "DOM activity was not captured");
  assert.ok([...channels].some(channel => /network|resource/.test(channel)), "network/resource activity was not captured");
  for (const requiredChannel of [
    "dom/element_change",
    "dom/attribute_change",
    "dom/text_change",
    "network/resource_observed",
    "interaction/click",
    "interaction/input",
    "layout/cdp_layout_pass",
    "runtime/cdp_script_duration"
  ]) {
    assert.ok(channels.has(requiredChannel), `exported facts missing ${requiredChannel}`);
  }
  assert.ok(!facts.some(fact => fact.type === "collector-injection-warning"), "collector injection emitted a warning");

  const firstCount = runtime.runtimeFacts.length;
  const activityStartedAt = Date.now();
  await runtime.page.evaluate(() => {
    const node = document.createElement("aside");
    node.textContent = "continuous bridge mutation";
    document.body.append(node);
    queueMicrotask(() => document.body.toggleAttribute("data-continuous"));
  });
  await new Promise(resolve => setTimeout(resolve, 300));
  await runtime.analyze(targetUrl);
  const newFactsAfterActivity = runtime.runtimeFacts.filter(fact => Number(fact.timestamp) >= activityStartedAt);
  assert.ok(runtime.runtimeFacts.length > firstCount || newFactsAfterActivity.length >= 12, "persistent page activity did not continue streaming between samples");

  const beforeSameSiteNavigation = runtime.runtimeFacts.length;
  await runtime.analyze(`http://127.0.0.1:${address.port}/second`);
  assert.ok(runtime.runtimeFacts.length >= beforeSameSiteNavigation, "same-site navigation incorrectly reset the rolling ledger");

  const secondServer = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><title>Second origin</title><main>isolated</main>");
  });
  await new Promise((resolve, reject) => {
    secondServer.once("error", reject);
    secondServer.listen(0, "127.0.0.1", resolve);
  });
  const secondAddress = secondServer.address();
  const secondTarget = `http://127.0.0.1:${secondAddress.port}/second`;
  await runtime.analyze(secondTarget);
  const secondOriginIsolated = runtime.runtimeFacts.every(fact => {
    const pageUrl = fact.context?.bridgePageUrl || fact.context?.pageUrl || "";
    return !pageUrl || new URL(pageUrl).origin === new URL(secondTarget).origin;
  });
  secondServer.closeAllConnections?.();
  await new Promise(resolve => secondServer.close(resolve));
  assert.ok(secondOriginIsolated, "facts from the previous target leaked into the new target ledger");
  console.log(JSON.stringify({
    ok: true,
    factCount: facts.length,
    bridgeFactCount: bridgeFacts.length,
    channelCount: channels.size,
    bridgeChannelCount: bridgeChannels.size,
    channels: [...channels].sort()
  }, null, 2));
} finally {
  await runtime.close();
  server.closeAllConnections?.();
  server.closeIdleConnections?.();
  await new Promise(resolve => server.close(resolve));
  await rm(profileDir, { recursive: true, force: true });
}
