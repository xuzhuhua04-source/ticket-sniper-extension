import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package scripts expose a release verification command", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(manifest.scripts.start, "node standalone-server.mjs");
  assert.equal(manifest.scripts.check, "node --check standalone-server.mjs && node --check runtime-diagnostics.js");
  assert.equal(manifest.scripts.verify, "npm run check && npm test");
  assert.match(manifest.scripts.test, /node --test/);
});
