import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000;

export class AccountStore {
  constructor(filePath) {
    this.filePath = resolve(filePath);
    this.data = { users: [], sessions: [] };
    this.writeQueue = Promise.resolve();
  }

  async load() {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
      this.data.users = Array.isArray(parsed.users) ? parsed.users : [];
      this.data.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    } catch (error) {
      if (error.code !== "ENOENT") console.warn(`Account data could not be loaded: ${error.message}`);
    }
    this.pruneSessions();
  }

  async upsertIdentity(identity) {
    const existing = this.data.users.find(user => user.identities.some(item => item.provider === identity.provider && item.subject === identity.subject));
    if (existing) {
      existing.displayName = identity.displayName || existing.displayName;
      existing.avatarUrl = safeAvatar(identity.avatarUrl) || existing.avatarUrl;
      existing.lastSignInAt = Date.now();
      await this.save();
      return existing;
    }
    const user = {
      id: randomUUID(),
      displayName: String(identity.displayName || "Visa Monitor user").slice(0, 100),
      avatarUrl: safeAvatar(identity.avatarUrl),
      identities: [{ provider: identity.provider, subject: String(identity.subject).slice(0, 256) }],
      createdAt: Date.now(),
      lastSignInAt: Date.now()
    };
    this.data.users.push(user);
    await this.save();
    return user;
  }

  async createSession(userId) {
    this.pruneSessions();
    const token = randomBytes(32).toString("base64url");
    this.data.sessions.push({ tokenHash: hash(token), userId, expiresAt: Date.now() + SESSION_LIFETIME });
    await this.save();
    return token;
  }

  userForSession(token) {
    if (!token) return null;
    this.pruneSessions();
    const session = this.data.sessions.find(item => item.tokenHash === hash(token) && item.expiresAt > Date.now());
    if (!session) return null;
    return publicUser(this.data.users.find(user => user.id === session.userId));
  }

  async removeSession(token) {
    const tokenHash = hash(token || "");
    this.data.sessions = this.data.sessions.filter(item => item.tokenHash !== tokenHash);
    await this.save();
  }

  pruneSessions() {
    this.data.sessions = this.data.sessions.filter(item => item.expiresAt > Date.now());
  }

  async save() {
    this.writeQueue = this.writeQueue.then(() => this.persist());
    await this.writeQueue;
  }

  async persist() {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(this.data, null, 2), { encoding: "utf8", mode: 0o600 });
    await rename(temporary, this.filePath);
  }
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, providers: user.identities.map(item => item.provider), createdAt: user.createdAt };
}

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function safeAvatar(value) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; }
  catch { return ""; }
}
