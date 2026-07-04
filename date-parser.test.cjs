const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { globalThis: {} };
context.globalThis.globalThis = context.globalThis;
vm.runInNewContext(fs.readFileSync("date-parser.js", "utf8"), context.globalThis, { filename: "date-parser.js" });
const parser = context.globalThis.VisaDateParser;

test("parses ISO and written appointment dates", () => {
  assert.equal(parser.dayKey(parser.parseDateText("2026-08-14")), "2026-08-14");
  assert.equal(parser.dayKey(parser.parseDateText("August 14, 2026")), "2026-08-14");
  assert.equal(parser.dayKey(parser.parseDateText("14 Aug 2026")), "2026-08-14");
});

test("respects portal numeric date order", () => {
  assert.equal(parser.dayKey(parser.parseDateText("04/09/2026", "mdy")), "2026-04-09");
  assert.equal(parser.dayKey(parser.parseDateText("04/09/2026", "dmy")), "2026-09-04");
});

test("combines a calendar day with its month header", () => {
  assert.equal(parser.dayKey(parser.parseCalendarDay("7", "September 2026")), "2026-09-07");
  assert.equal(parser.parseCalendarDay("31", "February 2026"), null);
});
