export const VDOM_FACT_TYPES = Object.freeze([
  "vdom_diff",
  "vdom_commit",
  "vdom_update",
  "vdom_topology"
]);

export const STORAGE_FACT_TYPES = Object.freeze([
  "storage_snapshot",
  "local_storage",
  "session_storage",
  "cookie_change",
  "indexeddb_change"
]);

export const SHADOW_FACT_TYPES = Object.freeze([
  "shadow_root_created",
  "shadow_mapping",
  "shadow_slot_change",
  "shadow_topology"
]);

export const RUNTIME_FACT_TYPES = Object.freeze([
  "js_microtask",
  "js_promise_chain",
  "timer_fired",
  "console_log",
  "console_error",
  "script_error"
]);

export const NETWORK_FACT_TYPES = Object.freeze([
  "request_start",
  "request_end",
  "response_start",
  "response_end",
  "resource_observed",
  "resource_error",
  "document_fetch"
]);

export const LAYOUT_FACT_TYPES = Object.freeze([
  "layout_shift",
  "forced_reflow",
  "layout_tree"
]);

export const DOM_FACT_TYPES = Object.freeze([
  "element_change",
  "attribute_change",
  "text_change",
  "structure_snapshot"
]);

export const CSSOM_FACT_TYPES = Object.freeze([
  "css_rule_insert",
  "css_rule_delete",
  "css_rule_change",
  "stylesheet_change"
]);

export const BLOOMBERG_BUCKETS = Object.freeze([10, 50, 100, 1000]);

export function bucketTimestamp(timestamp, bucketMs) {
  const time = Number(timestamp) || Date.now();
  const size = BLOOMBERG_BUCKETS.includes(Number(bucketMs)) ? Number(bucketMs) : 1000;
  return Math.floor(time / size) * size;
}

export const ANTI_CRAWLER_FACT_TYPES = Object.freeze([
  "crawler_challenge",
  "crawler_fingerprint",
  "crawler_block",
  "crawler_pattern"
]);

export const A11Y_FACT_TYPES = Object.freeze([
  "a11y_role_change",
  "a11y_state_change",
  "a11y_topology",
  "a11y_break"
]);

export const DEVICE_FACT_TYPES = Object.freeze([
  "device_cpu_usage",
  "device_cpu_spike",
  "device_cpu_throttle",
  "device_cpu_scheduler_delay",
  "device_gpu_usage",
  "device_gpu_raster_load",
  "device_gpu_command_buffer",
  "device_gpu_overload",
  "device_memory_pressure",
  "device_memory_swap",
  "device_memory_low",
  "device_memory_gc_storm",
  "device_battery_drop",
  "device_battery_low",
  "device_battery_saver_mode",
  "device_thermal_throttle",
  "device_thermal_warning",
  "device_thermal_shutdown_prevented",
  "device_io_block",
  "device_io_latency",
  "device_io_write_stall",
  "device_io_read_stall"
]);

export const BROWSER_INTERNAL_FACT_TYPES = Object.freeze([
  "browser_process_start",
  "browser_process_crash",
  "browser_ipc_message",
  "renderer_process_start",
  "renderer_process_crash",
  "renderer_dom_snapshot",
  "renderer_cssom_snapshot",
  "renderer_layout_pass",
  "renderer_style_recalc",
  "renderer_js_gc",
  "renderer_js_exception",
  "renderer_shadow_internal",
  "compositor_frame_commit",
  "compositor_scroll_inertial",
  "compositor_scroll_begin",
  "compositor_scroll_end",
  "compositor_layer_update",
  "compositor_animation_tick",
  "gpu_process_start",
  "gpu_process_crash",
  "gpu_memory_pressure",
  "gpu_command_buffer",
  "gpu_raster_pass",
  "network_request_start",
  "network_request_end",
  "network_dns_lookup",
  "network_tls_handshake",
  "network_h2_stream",
  "network_h3_quic_event",
  "network_cache_hit",
  "network_cache_miss",
  "io_cookie_write",
  "io_cookie_delete",
  "io_storage_write",
  "io_storage_delete",
  "io_indexeddb_transaction",
  "io_service_worker_intercept"
]);

export const SECURITY_FACT_TYPES = Object.freeze([
  "security_sandbox_violation",
  "security_sandbox_escape_attempt",
  "security_permission_request",
  "security_permission_granted",
  "security_permission_denied",
  "security_isolation_process_split",
  "security_isolation_cross_origin_block",
  "security_tls_error",
  "security_certificate_invalid",
  "security_mixed_content_block",
  "security_cors_violation",
  "security_cookie_flag_violation",
  "security_storage_partition_violation",
  "security_storage_overwrite",
  "security_renderer_crash",
  "security_gpu_crash",
  "security_exploit_detected",
  "security_ai_dom_overwrite",
  "security_ai_request_abuse",
  "security_ai_loop"
]);

export const WEB_RUNTIME_FACT_TYPES = Object.freeze([
  "web_dom_mutation",
  "web_dom_insert",
  "web_dom_remove",
  "web_css_change",
  "web_layout_shift",
  "web_layout_reflow",
  "web_js_error",
  "web_js_promise_rejection",
  "web_fetch_request",
  "web_fetch_response",
  "web_storage_set",
  "web_storage_get",
  "web_interaction_click",
  "web_interaction_input",
  "web_interaction_scroll"
]);

export const AI_FACT_TYPES = Object.freeze([
  "ai_action_generate",
  "ai_action_execute",
  "ai_action_fail",
  "ai_dom_create",
  "ai_dom_delete",
  "ai_dom_overwrite",
  "ai_request_generate",
  "ai_request_burst",
  "ai_interaction_click",
  "ai_interaction_sequence",
  "ai_state_change",
  "ai_state_loop"
]);

export const FACT_TYPE_GROUPS = Object.freeze({
  vdom: VDOM_FACT_TYPES,
  storage: STORAGE_FACT_TYPES,
  shadow: SHADOW_FACT_TYPES,
  runtime: RUNTIME_FACT_TYPES,
  network: NETWORK_FACT_TYPES,
  layout: LAYOUT_FACT_TYPES,
  dom: DOM_FACT_TYPES,
  cssom: CSSOM_FACT_TYPES,
  anti_crawler: ANTI_CRAWLER_FACT_TYPES,
  a11y: A11Y_FACT_TYPES,
  device: DEVICE_FACT_TYPES,
  browser_internal: BROWSER_INTERNAL_FACT_TYPES,
  security: SECURITY_FACT_TYPES,
  web: WEB_RUNTIME_FACT_TYPES,
  ai: AI_FACT_TYPES
});

export const FACT_TYPE_ALIASES = Object.freeze({
  "dom/element-change": "dom/element_change",
  "dom/attribute-change": "dom/attribute_change",
  "dom/text-change": "dom/text_change",
  "dom/structure-snapshot": "dom/structure_snapshot",
  "cssom/css-rule": "cssom/css_rule_change",
  "cssom/css_rule": "cssom/css_rule_change",
  "cssom/stylesheet-change": "cssom/stylesheet_change",
  "shadow/slot_change": "shadow/shadow_slot_change",
  "storage/storage-snapshot": "storage/storage_snapshot",
  "storage/storage_change": "storage/storage_snapshot",
  "storage/local-storage": "storage/local_storage",
  "storage/session-storage": "storage/session_storage",
  "storage/indexeddb_open": "storage/indexeddb_change",
  "runtime/timer": "runtime/timer_fired",
  "runtime/scheduling": "runtime/timer_fired",
  "runtime/console": "runtime/console_log",
  "runtime/console_error": "runtime/console_error",
  "runtime/script-error": "runtime/script_error",
  "runtime/unhandled-rejection": "runtime/console_error",
  "runtime/unhandled_rejection": "runtime/console_error",
  "network/request": "network/request_start",
  "network/response": "network/response_end",
  "network/resource-observed": "network/resource_observed",
  "network/error": "network/resource_error",
  "network/document-fetch": "network/document_fetch",
  "anti_crawler/challenge": "anti_crawler/crawler_challenge",
  "anti_crawler/fingerprint": "anti_crawler/crawler_fingerprint",
  "anti_crawler/block": "anti_crawler/crawler_block",
  "anti_crawler/crawler-pattern": "anti_crawler/crawler_pattern",
  "anti_crawler/crawler_pattern": "anti_crawler/crawler_pattern",
  "web/web_dom_mutation": "dom/element_change",
  "web/web_dom_insert": "dom/element_change",
  "web/web_dom_remove": "dom/element_change",
  "web/web_css_change": "cssom/css_rule_change",
  "web/web_layout_shift": "layout/layout_shift",
  "web/web_layout_reflow": "layout/forced_reflow",
  "web/web_js_error": "runtime/script_error",
  "web/web_js_promise_rejection": "runtime/console_error",
  "web/web_fetch_request": "network/request_start",
  "web/web_fetch_response": "network/response_end",
  "web/web_storage_set": "storage/storage_snapshot",
  "web/web_storage_get": "storage/storage_snapshot",
  "web/web_interaction_click": "interaction/click",
  "web/web_interaction_input": "interaction/input",
  "web/web_interaction_scroll": "interaction/scroll"
});

export function normalizeFactSource(value) {
  return String(value || "runtime").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 60) || "runtime";
}

export function normalizeFactType(value) {
  return String(value || "fact").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 80) || "fact";
}

export function canonicalFactKey(source, type) {
  const normalizedSource = normalizeFactSource(source);
  const normalizedType = normalizeFactType(type);
  const rawKey = `${normalizedSource}/${normalizedType}`;
  return FACT_TYPE_ALIASES[rawKey] || rawKey;
}

export function canonicalFactParts(source, type) {
  const [canonicalSource, canonicalType] = canonicalFactKey(source, type).split("/");
  return { source: canonicalSource || "runtime", type: canonicalType || "fact" };
}
