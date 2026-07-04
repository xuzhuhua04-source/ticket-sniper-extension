import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import playwright from "../../../vintage-house-browser/node_modules/playwright-core/index.js";

const output = resolve(import.meta.dirname, "..", "verification");
const appUrl = process.env.VERIFY_URL || "http://127.0.0.1:4390/";
mkdirSync(output, { recursive: true });
const browser = await playwright.chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });
try {
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(appUrl, { waitUntil: "networkidle" });
  const report = await page.evaluate(() => ({
    title: document.querySelector("h1")?.textContent,
    service: document.getElementById("service")?.textContent,
    channelCards: document.querySelectorAll(".channel-card").length,
    planCards: document.querySelectorAll(".plan-card").length,
    views: document.querySelectorAll(".view").length,
    manifest: document.querySelector("link[rel='manifest']")?.getAttribute("href"),
    bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  }));
  await page.screenshot({ path: resolve(output, "companion-desktop.png"), fullPage: true });
  await page.click('[data-view="account"]');
  const authReport = await page.evaluate(() => ({
    providerButtons: document.querySelectorAll("[data-provider]").length,
    authModes: document.querySelectorAll("[data-auth-mode]").length,
    whatsappForm: Boolean(document.getElementById("whatsapp-request-form")),
    disabledProviders: document.querySelectorAll("[data-provider]:disabled").length
  }));
  await page.screenshot({ path: resolve(output, "companion-auth-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[data-view="account"]');
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.screenshot({ path: resolve(output, "companion-auth-mobile.png"), fullPage: true });
  if (errors.length || report.title !== "Overview" || report.service !== "Online" || report.channelCards !== 3 || report.planCards !== 3 || report.views !== 6 || report.manifest !== "/app.webmanifest" || report.bodyOverflow || mobileOverflow || authReport.providerButtons !== 3 || authReport.authModes !== 2 || !authReport.whatsappForm) {
    throw new Error(JSON.stringify({ report, authReport, mobileOverflow, errors }));
  }
  console.log(JSON.stringify({ report, authReport, mobileOverflow, errors }, null, 2));
} finally {
  await browser.close();
}
