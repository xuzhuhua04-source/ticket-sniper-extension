export const RUNTIME_LAYER_VERSION = "runtime-layer-structural-v1";

export const RUNTIME_LAYER_FILES = Object.freeze([
  "dom.js",
  "cssom.js",
  "layout.js",
  "shadow.js",
  "a11y.js",
  "js-runtime.js",
  "worker.js",
  "vdom.js"
]);

export const RUNTIME_STRUCTURAL_FACTS = Object.freeze([
  "dom/element_change",
  "dom/attribute_change",
  "dom/text_change",
  "dom/shadow_root",
  "cssom/css_rule_insert",
  "cssom/css_rule_delete",
  "layout/layout_shift",
  "shadow/shadow_root_created",
  "shadow/shadow_mapping",
  "shadow/slot_change",
  "a11y/a11y_role_change",
  "a11y/a11y_state_change",
  "runtime/js_microtask",
  "runtime/js_promise_chain",
  "runtime/js_event_loop_render",
  "runtime/js_event_loop_idle",
  "runtime/scheduling",
  "multicontext/iframe_created",
  "multicontext/iframe_loaded",
  "multicontext/post_message",
  "multicontext/worker_created",
  "multicontext/worker_message",
  "multicontext/worker_post",
  "multicontext/message_channel_created",
  "multicontext/message_channel_message",
  "multicontext/sw_register",
  "multicontext/sw_activated",
  "multicontext/sw_fetch",
  "vdom/vdom_commit",
  "vdom/vdom_update",
  "vdom/vdom_diff"
]);

export function isRuntimeStructuralFact(source, type) {
  return RUNTIME_STRUCTURAL_FACTS.includes(`${normalizeFactPart(source)}/${normalizeFactPart(type)}`);
}

export function normalizeFactPart(value) {
  return String(value || "fact").trim().toLowerCase().replace(/-/g, "_");
}
