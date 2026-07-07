const DIAGNOSTICS_LAYER_VERSION = "diagnostics-layer-v1";

const DIAGNOSTICS_LAYER_FILES = Object.freeze([
  "anti-crawler.js",
  "protection-surface.js",
  "behavior.js",
  "performance.js",
  "storage.js",
  "network.js",
  "vdom-scan.js",
  "layout-scan.js",
  "cssom-scan.js",
  "a11y-scan.js",
  "bloomberg.js"
]);

const DIAGNOSTIC_FACTS = Object.freeze([
  "dom/mutation_burst",
  "dom/structure_snapshot",
  "dom/calendar_structure",
  "dom/iframe_observed",
  "cssom/css_rule",
  "cssom/stylesheet_change",
  "cssom/css_animation",
  "cssom/css_transition",
  "cssom/style_recalc",
  "cssom/forced_style_recalc",
  "layout/forced_reflow",
  "layout/layout_rhythm",
  "layout/layout_dependency",
  "layout/layout_tree",
  "layout/layout_type_change",
  "layout/paint_order_change",
  "layout/stacking_context_change",
  "shadow/shadow_topology",
  "a11y/a11y_topology",
  "a11y/a11y_break",
  "a11y/a11y_conflict",
  "runtime/js_block",
  "runtime/js_error",
  "runtime/script_error",
  "runtime/unhandled_rejection",
  "runtime/console",
  "runtime/diagnostics_tick",
  "runtime/collector_state",
  "runtime/layer_coverage",
  "runtime/navigation",
  "runtime/health_heartbeat",
  "storage/storage_snapshot",
  "storage/storage_change",
  "storage/indexeddb_open",
  "network/request",
  "network/response",
  "network/error",
  "network/resource_observed",
  "web_bloomberg/behavior_window",
  "anti_crawler/challenge",
  "anti_crawler/fingerprint",
  "anti_crawler/block",
  "vdom/vdom_topology",
  "vdom/vdom_capability",
  "vdom/vdom_break"
]);

function isDiagnosticFact(source, type) {
  return DIAGNOSTIC_FACTS.includes(`${normalizeFactPart(source)}/${normalizeFactPart(type)}`);
}

function normalizeFactPart(value) {
  return String(value || "fact").trim().toLowerCase().replace(/-/g, "_");
}

globalThis.TicketSniperDiagnosticsLayer = Object.freeze({
  version: DIAGNOSTICS_LAYER_VERSION,
  files: DIAGNOSTICS_LAYER_FILES,
  diagnosticFacts: DIAGNOSTIC_FACTS,
  isDiagnosticFact
});
