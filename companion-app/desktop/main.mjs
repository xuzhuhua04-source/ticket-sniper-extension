import { app, BrowserWindow, dialog, shell } from "electron";
import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

let window;
let service;

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) app.quit();

app.whenReady().then(async () => {
  const userData = app.getPath("userData");
  process.env.VISA_MONITOR_DATA_DIR = userData;
  process.env.VISA_MONITOR_ENV ||= resolve(userData, ".env");
  await ensureConfiguration(process.env.VISA_MONITOR_ENV);
  const { startServer } = await import("../server.mjs");
  try {
    service = await startServer();
  } catch (error) {
    dialog.showErrorBox("Visa Monitor could not start", error.message || String(error));
    app.quit();
    return;
  }
  createWindow(service.url);
});

async function ensureConfiguration(target) {
  try {
    await mkdir(resolve(target, ".."), { recursive: true });
    await copyFile(resolve(app.getAppPath(), ".env.example"), target, 1);
  } catch (error) {
    if (error.code !== "EEXIST") console.warn(`Configuration template could not be created: ${error.message}`);
  }
}

function createWindow(url) {
  window = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 880,
    minHeight: 620,
    backgroundColor: "#0b1014",
    show: false,
    title: "Visa Monitor Companion",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });
  window.removeMenu();
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https:\/\/(accept|test|account|sandbox)\.authorize\.net\//i.test(target)) shell.openExternal(target);
    if (/^https:\/\/(accounts\.google\.com|open\.weixin\.qq\.com|login\.work\.weixin\.qq\.com)\//i.test(target)) {
      return { action: "allow", overrideBrowserWindowOptions: { width: 520, height: 720, parent: window, modal: true, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } } };
    }
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, target) => {
    if (!target.startsWith(url)) event.preventDefault();
  });
  window.once("ready-to-show", () => window.show());
  window.loadURL(url);
}

app.on("second-instance", () => {
  if (window) { if (window.isMinimized()) window.restore(); window.focus(); }
});

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => service?.server?.close());
