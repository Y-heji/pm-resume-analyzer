import { join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import type { WaitlistEntry } from "./types";
import { Redis } from "@upstash/redis";

// ── Storage path (lazy) ──

let _dataFile: string | null = null;
function getDataFile(): string {
  if (_dataFile) return _dataFile;
  const dir = process.env.VERCEL ? "/tmp" : join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  _dataFile = join(dir, "waitlist.json");
  return _dataFile;
}

// ── Backend detection ──

function hasRedis() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// ── Filesystem ──

function fsRead(): WaitlistEntry[] {
  const file = getDataFile();
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function fsWrite(entries: WaitlistEntry[]) {
  writeFileSync(getDataFile(), JSON.stringify(entries, null, 2), "utf-8");
}

// ── Redis ──

const REDIS_KEY = "waitlist:entries";

async function redisRead(): Promise<WaitlistEntry[]> {
  const redis = getRedis();
  const data = await redis.get<WaitlistEntry[]>(REDIS_KEY);
  return data ?? [];
}

async function redisWrite(entries: WaitlistEntry[]) {
  const redis = getRedis();
  await redis.set(REDIS_KEY, entries);
}

// ── Public API ──

export async function getEntries(): Promise<WaitlistEntry[]> {
  if (hasRedis()) return redisRead();
  return fsRead();
}

export async function addEntry(entry: WaitlistEntry): Promise<WaitlistEntry[]> {
  if (hasRedis()) {
    const entries = await redisRead();
    entries.push(entry);
    await redisWrite(entries);
    return entries;
  }

  const entries = fsRead();
  entries.push(entry);
  fsWrite(entries);
  return entries;
}
