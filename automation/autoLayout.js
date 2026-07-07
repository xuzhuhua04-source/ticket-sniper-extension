import { renderStructuralAction } from "./render.js";

export function executeLayoutMSU(msu = {}) {
  const action = {
    domain: "layout",
    status: "recommended",
    summary: "Reduce layout instability and inspect shift/reflow sources.",
    msu
  };
  return { ...action, renderUpdate: renderStructuralAction(action) };
}
