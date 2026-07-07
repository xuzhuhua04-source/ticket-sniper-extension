export function windowSeverity(window = {}) {
  const metrics = window.metrics || {};
  const hints = Array.isArray(window.risk_hints) ? window.risk_hints : [];
  const total = Object.values(metrics).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const highHints = hints.filter(hint => ["high", "critical"].includes(hint.severity)).length;
  if (highHints || total >= 80) return "high";
  if (hints.length || total >= 25) return "medium";
  return "low";
}
