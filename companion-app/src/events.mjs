const ALLOWED_TYPES = new Set(["calendar_changed", "public_site_changed", "earlier_appointment", "gmail_message", "test"]);

export function sanitizeEvent(value) {
  if (!value || typeof value !== "object") throw new Error("Event payload must be an object.");
  const type = String(value.type || "");
  if (!ALLOWED_TYPES.has(type)) throw new Error("Unsupported event type.");
  const title = clean(value.title, 100);
  const message = clean(value.message, 400);
  if (!title || !message) throw new Error("Event title and message are required.");
  return Object.freeze({
    id: clean(value.id, 120) || `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    message,
    url: sanitizeUrl(value.url),
    occurredAt: finiteTimestamp(value.occurredAt),
    receivedAt: Date.now()
  });
}

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function finiteTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Date.now();
}

function sanitizeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
