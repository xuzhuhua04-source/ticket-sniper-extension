import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { EventStore } from "../src/event-store.mjs";

test("event store persists bounded local history", async () => {
  const directory = await mkdtemp(join(tmpdir(), "visa-monitor-store-"));
  const file = join(directory, "events.json");
  try {
    const store = new EventStore(file, 2);
    await store.load();
    await store.add({ id: "one" });
    await store.add({ id: "two" });
    await store.add({ id: "three" });
    assert.deepEqual(store.list().map(item => item.id), ["three", "two"]);
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")).map(item => item.id), ["three", "two"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
