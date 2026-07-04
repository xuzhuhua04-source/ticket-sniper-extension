import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import playwright from "../vintage-house-browser/node_modules/playwright-core/index.js";
const { chromium } = playwright;

const extensionPath = resolve(import.meta.dirname);
const profile = mkdtempSync(join(tmpdir(), "visa-slot-alert-roblox-"));

const context = await chromium.launchPersistentContext(profile, {
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});

try {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 20000 });
  await worker.evaluate(() => chrome.storage.sync.set({ runtimeDiagnosticsSettings: { enabled: true, notifyHighSeverity: true } }));

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("https://www.roblox.com/discover", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(9000);

  const data = await worker.evaluate(() => chrome.storage.local.get(["runtimeFactChannels", "runtimeFactStatus"]));
  const channels = Object.keys(data.runtimeFactChannels || {}).sort();
  const ok = channels.some(channel => channel.startsWith("network/"))
    && channels.some(channel => channel.startsWith("dom/") || channel.startsWith("runtime/"))
    && Boolean(data.runtimeFactStatus?.host?.includes("roblox.com"));

  if (!ok) throw new Error(JSON.stringify({ channels, status: data.runtimeFactStatus, errors }, null, 2));
  console.log(JSON.stringify({
    ok,
    url: page.url(),
    channels,
    latest: data.runtimeFactStatus,
    errors
  }, null, 2));
} finally {
  await context.close();
  rmSync(profile, { recursive: true, force: true });
}
