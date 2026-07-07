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
  a11y: A11Y_FACT_TYPES
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
  "anti_crawler/crawler_pattern": "anti_crawler/crawler_pattern"
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
