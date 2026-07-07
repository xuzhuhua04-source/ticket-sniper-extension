import { executeLayoutMSU } from "./autoLayout.js";
import { executeDomMSU } from "./autoDom.js";
import { executeCssMSU } from "./autoCss.js";
import { executeRuntimeMSU } from "./autoRuntime.js";
import { executeNetworkMSU } from "./autoNetwork.js";
import { executeSecurityMSU } from "./autoSecurity.js";

export const AUTOMATION_LAYER_VERSION = "stl-web-automation-v1";

export function executeMSU(msu = {}, options = {}) {
  const domain = msu.actionDomain || "runtime";
  const dispatcher = {
    layout: executeLayoutMSU,
    dom: executeDomMSU,
    css: executeCssMSU,
    runtime: executeRuntimeMSU,
    network: executeNetworkMSU,
    security: executeSecurityMSU
  }[domain] || executeRuntimeMSU;
  return dispatcher(msu, options);
}

export function buildAutomationLayerModel(msuList = [], options = {}) {
  const actions = (Array.isArray(msuList) ? msuList : []).slice(0, 160).map(msu => executeMSU(msu, { ...options, dryRun: true }));
  return {
    version: AUTOMATION_LAYER_VERSION,
    actions,
    executionStatus: {
      state: actions.length ? "automation_recommendations_ready" : "automation_waiting",
      dryRun: true,
      actionCount: actions.length
    },
    renderUpdates: actions.filter(action => action.renderUpdate).map(action => action.renderUpdate)
  };
}
