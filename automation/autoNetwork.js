import { renderStructuralAction } from "./render.js";

export function executeNetworkMSU(msu = {}) {
  const action = {
    domain: "network",
    status: "recommended",
    summary: "Review suspicious or high-pressure network/resource patterns.",
    msu
  };
  return { ...action, renderUpdate: renderStructuralAction(action) };
}
