import test from "node:test";
import assert from "node:assert/strict";
import { compactDiagnosticsResult } from "../standalone-server.mjs";

function fact(index) {
  return {
    timestamp: 1_720_000_000_000 + index,
    source: "runtime",
    type: `event_${index}`,
    value: {
      severity: index % 7 === 0 ? "high" : "low",
      token: `secret-${index}`,
      summary: `Synthetic fact ${index}`
    },
    metadata: {
      authorization: "Bearer private",
      path: `/item/${index}`
    },
    channel: "runtime/events",
    runtimeLayer: {
      treeId: "js",
      type: "JSRuntime.ExecutionChanged",
      highlightKind: "changed",
      target: `js:event-${index}`,
      captureMode: "page_injection"
    },
    captureMode: "page_injection",
    confidence: 0.9,
    organ: "Rhythm",
    context: {
      email: "person@example.com"
    }
  };
}

test("standalone diagnostics compaction caps facts and redacts sensitive fields", () => {
  const facts = Array.from({ length: 60 }, (_, index) => fact(index));
  const compacted = compactDiagnosticsResult({
    ok: true,
    analyzedAt: "2026-07-03T12:00:00.000Z",
    requestedUrl: "https://example.com/private?session=keep-out",
    finalUrl: "https://example.com/private?session=keep-out",
    fallback: {
      used: true,
      reason: "Rendered failed at https://example.com/private?token=secret",
      mode: "structural-url-analysis"
    },
    diagnostics: {
      runtimeFactHistory: facts,
      runtimeFactChannels: {
        "runtime/events": facts,
        "runtime/other": facts
      },
      runtimeFactStatus: {
        state: "ok",
        severity: "high",
        host: "example.com",
        message: "ready",
        fact: facts[0]
      },
      organFrequencySpectrumLatest: {
        commercialPackages: [{ id: "structure-monitor", evidence: ["runtime/events"] }]
      },
      runtimeLayerCoverage: {
        javascript: {
          status: "full",
          captureMode: "page_injection",
          confidence: 0.9,
          reason: "collector active",
          evidenceCount: 10
        }
      }
    }
  }, { factLimit: 10, channelFactLimit: 6 });

  assert.equal(compacted.compacted, true);
  assert.equal(compacted.requestedUrl, "https://example.com/private");
  assert.equal(compacted.finalUrl, "https://example.com/private");
  assert.equal(compacted.fallback.used, true);
  assert.equal(compacted.fallback.reason.includes("token=secret"), false);
  assert.equal(compacted.fallback.mode, "structural-url-analysis");
  assert.equal(compacted.diagnostics.runtimeFactHistory.length, 10);
  assert.equal(compacted.diagnostics.runtimeFactChannels["runtime/events"].length, 6);
  assert.equal(compacted.diagnostics.runtimeFactStatus.fact.value.token, "[redacted]");
  assert.equal(compacted.diagnostics.runtimeFactStatus.fact.metadata.authorization, "[redacted]");
  assert.equal(compacted.diagnostics.runtimeFactStatus.fact.context.email, "[redacted]");
  assert.equal(compacted.diagnostics.organFrequencySpectrumLatest.commercialPackages[0].id, "structure-monitor");
  assert.equal(compacted.diagnostics.runtimeLayerCoverage.javascript.status, "full");
  assert.equal(compacted.diagnostics.runtimeFactHistory[0].runtimeLayer.treeId, "js");
  assert.equal(compacted.diagnostics.runtimeFactHistory[0].runtimeLayer.type, "JSRuntime.ExecutionChanged");
  assert.equal(compacted.diagnostics.runtimeFactHistory[0].captureMode, "page_injection");
  assert.equal(compacted.diagnostics.runtimeFactHistory[0].organ, "Rhythm");
});
