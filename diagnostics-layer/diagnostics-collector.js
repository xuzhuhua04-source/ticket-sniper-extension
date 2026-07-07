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
  "cssom/css_rule_change",
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
  "runtime/console_log",
  "runtime/console_error",
  "runtime/diagnostics_tick",
  "runtime/collector_state",
  "runtime/layer_coverage",
  "runtime/navigation",
  "runtime/health_heartbeat",
  "storage/storage_snapshot",
  "storage/local_storage",
  "storage/session_storage",
  "storage/cookie_change",
  "storage/indexeddb_change",
  "network/request_start",
  "network/request_end",
  "network/response_start",
  "network/response_end",
  "network/resource_error",
  "network/resource_observed",
  "web_bloomberg/behavior_window",
  "anti_crawler/crawler_challenge",
  "anti_crawler/crawler_fingerprint",
  "anti_crawler/crawler_block",
  "anti_crawler/crawler_pattern",
  "vdom/vdom_topology",
  "vdom/vdom_capability",
  "vdom/vdom_break"
]);

const DIAGNOSTIC_FACT_ALIASES = Object.freeze({
  "cssom/css_rule": "cssom/css_rule_change",
  "runtime/console": "runtime/console_log",
  "runtime/script-error": "runtime/script_error",
  "runtime/unhandled_rejection": "runtime/console_error",
  "runtime/unhandled-rejection": "runtime/console_error",
  "storage/storage_change": "storage/storage_snapshot",
  "storage/indexeddb_open": "storage/indexeddb_change",
  "network/request": "network/request_start",
  "network/response": "network/response_end",
  "network/error": "network/resource_error",
  "network/resource-observed": "network/resource_observed",
  "anti_crawler/challenge": "anti_crawler/crawler_challenge",
  "anti_crawler/fingerprint": "anti_crawler/crawler_fingerprint",
  "anti_crawler/block": "anti_crawler/crawler_block",
  "anti_crawler/crawler-pattern": "anti_crawler/crawler_pattern"
});

function isDiagnosticFact(source, type) {
  return DIAGNOSTIC_FACTS.includes(canonicalFactKey(source, type));
}

function normalizeFactPart(value) {
  return String(value || "fact").trim().toLowerCase().replace(/-/g, "_");
}

function canonicalFactKey(source, type) {
  const key = `${normalizeFactPart(source)}/${normalizeFactPart(type)}`;
  return DIAGNOSTIC_FACT_ALIASES[key] || key;
}

globalThis.TicketSniperDiagnosticsLayer = Object.freeze({
  version: DIAGNOSTICS_LAYER_VERSION,
  files: DIAGNOSTICS_LAYER_FILES,
  diagnosticFacts: DIAGNOSTIC_FACTS,
  aliases: DIAGNOSTIC_FACT_ALIASES,
  canonicalFactKey,
  isDiagnosticFact
});
