const RUNTIME_LAYER_VERSION = "runtime-layer-structural-v1";

const RUNTIME_LAYER_FILES = Object.freeze([
  "dom.js",
  "cssom.js",
  "layout.js",
  "shadow.js",
  "a11y.js",
  "js-runtime.js",
  "worker.js",
  "vdom.js"
]);

const RUNTIME_STRUCTURAL_FACTS = Object.freeze([
  "dom/element_change",
  "dom/attribute_change",
  "dom/text_change",
  "dom/shadow_root",
  "cssom/css_rule_insert",
  "cssom/css_rule_delete",
  "layout/layout_shift",
  "layout/resize",
  "layout/scroll",
  "shadow/shadow_root_created",
  "shadow/shadow_mapping",
  "shadow/shadow_slot_change",
  "a11y/a11y_role_change",
  "a11y/a11y_state_change",
  "a11y/focus_change",
  "runtime/js_microtask",
  "runtime/js_promise_chain",
  "runtime/js_event_loop_render",
  "runtime/js_event_loop_idle",
  "runtime/timer_fired",
  "runtime/js_scheduler_task",
  "runtime/js_atomics_wait_async",
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
  "multicontext/broadcast_channel_created",
  "multicontext/broadcast_channel_message",
  "network/beacon",
  "network/request_start",
  "network/request_end",
  "network/response_start",
  "network/response_end",
  "network/resource_observed",
  "network/resource_error",
  "network/document_fetch",
  "network/websocket_open",
  "network/websocket_close",
  "network/websocket_message",
  "interaction/click",
  "interaction/input",
  "interaction/key_press",
  "interaction/pointer_move",
  "interaction/scroll",
  "interaction/wheel",
  "interaction/focus",
  "interaction/blur",
  "interaction/selection_change",
  "vdom/vdom_commit",
  "vdom/vdom_update",
  "vdom/vdom_diff"
]);

const RUNTIME_FACT_ALIASES = Object.freeze({
  "shadow/slot_change": "shadow/shadow_slot_change",
  "runtime/scheduling": "runtime/timer_fired",
  "network/request": "network/request_start",
  "network/response": "network/response_end",
  "network/resource-observed": "network/resource_observed",
  "network/error": "network/resource_error",
  "network/document-fetch": "network/document_fetch"
});

function isRuntimeStructuralFact(source, type) {
  return RUNTIME_STRUCTURAL_FACTS.includes(canonicalFactKey(source, type));
}

function normalizeFactPart(value) {
  return String(value || "fact").trim().toLowerCase().replace(/-/g, "_");
}

function canonicalFactKey(source, type) {
  const key = `${normalizeFactPart(source)}/${normalizeFactPart(type)}`;
  return RUNTIME_FACT_ALIASES[key] || key;
}

globalThis.TicketSniperRuntimeLayer = Object.freeze({
  version: RUNTIME_LAYER_VERSION,
  files: RUNTIME_LAYER_FILES,
  structuralFacts: RUNTIME_STRUCTURAL_FACTS,
  aliases: RUNTIME_FACT_ALIASES,
  canonicalFactKey,
  isRuntimeStructuralFact
});
