import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export class EventStore {
  constructor(filePath, limit = 100) {
    this.filePath = resolve(filePath);
    this.limit = limit;
    this.events = [];
    this.writeQueue = Promise.resolve();
  }

  async load() {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
      this.events = Array.isArray(parsed) ? parsed.slice(0, this.limit) : [];
    } catch (error) {
      if (error.code !== "ENOENT") console.warn(`Event history could not be loaded: ${error.message}`);
      this.events = [];
    }
    return this.events;
  }

  list() { return this.events.slice(); }
  count() { return this.events.length; }

  async add(event) {
    this.events.unshift(event);
    this.events.splice(this.limit);
    this.writeQueue = this.writeQueue.then(() => this.persist()).catch(error => console.warn(`Event history could not be saved: ${error.message}`));
    await this.writeQueue;
  }

  async persist() {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(this.events, null, 2), { encoding: "utf8", mode: 0o600 });
    await rename(temporary, this.filePath);
  }
}
