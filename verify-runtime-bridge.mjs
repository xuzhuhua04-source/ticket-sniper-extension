import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SecureBrowserRuntime } from "./secure-browser-runtime.mjs";

const profileDir = await mkdtemp(join(tmpdir(), "sig9-runtime-bridge-"));
const server = createServer((request, response) => {
  if (request.url === "/api/pulse") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end('{"ok":true}');
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(`<!doctype html>
    <html><head><title>SIG9 bridge fixture</title></head>
    <body><main id="fixture">ready</main><script>
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
  assert.ok(bridgeFacts.some(fact => fact.transportLayer === "facts"), "structural facts did not cross the browser bridge");
  assert.ok(bridgeFacts.some(fact => fact.transportLayer === "diagnostics"), "diagnostic facts did not cross the browser bridge");
  assert.ok([...channels].some(channel => channel.startsWith("dom/")), "DOM activity was not captured");
  assert.ok([...channels].some(channel => /network|resource/.test(channel)), "network/resource activity was not captured");
  assert.ok(!facts.some(fact => fact.type === "collector-injection-warning"), "collector injection emitted a warning");

  const firstCount = runtime.runtimeFacts.length;
  await runtime.page.evaluate(() => {
    const node = document.createElement("aside");
    node.textContent = "continuous bridge mutation";
    document.body.append(node);
    queueMicrotask(() => document.body.toggleAttribute("data-continuous"));
  });
  await new Promise(resolve => setTimeout(resolve, 300));
  await runtime.analyze(targetUrl);
  assert.ok(runtime.runtimeFacts.length > firstCount, "persistent page activity did not continue streaming between samples");

  const secondTarget = `http://127.0.0.1:${address.port}/second`;
  await runtime.analyze(secondTarget);
  assert.ok(runtime.runtimeFacts.every(fact => {
    const pageUrl = fact.context?.bridgePageUrl || fact.context?.pageUrl || "";
    return !pageUrl || new URL(pageUrl).pathname === "/second";
  }), "facts from the previous target leaked into the new target ledger");
  console.log(JSON.stringify({
    ok: true,
    factCount: facts.length,
    channelCount: channels.size,
    channels: [...channels].sort()
  }, null, 2));
} finally {
  await runtime.close();
  await new Promise(resolve => server.close(resolve));
  await rm(profileDir, { recursive: true, force: true });
}
