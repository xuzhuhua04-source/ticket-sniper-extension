import { windowSeverity } from "./windowSeverity.js";

export function windowToMSU(window = {}) {
  const severity = windowSeverity(window);
  const metrics = window.metrics || {};
  const dominant = Object.entries(metrics).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || "behavior";
  return {
    id: `window:${window.window_id || window.start_ts || Date.now()}`,
    kind: "window_msu",
    severity,
    dominantMetric: dominant,
    actionDomain: actionDomainForMetric(dominant),
    payload: {
      window_id: window.window_id || "",
      site_id: window.site_id || "",
      page_id: window.page_id || "",
      bucket_ms: window.bucket_ms || 1000
    }
  };
}

function actionDomainForMetric(metric) {
  if (metric === "layout") return "layout";
  if (metric === "dom") return "dom";
  if (metric === "network") return "network";
  if (metric === "interaction") return "interaction";
  if (["malicious", "protection"].includes(metric)) return "security";
  return "runtime";
}
