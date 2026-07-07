export function renderStructuralAction(action = {}) {
  return {
    target: action.target || "runtime-diagnostics",
    mode: "recommendation",
    label: action.summary || "No structural action"
  };
}
