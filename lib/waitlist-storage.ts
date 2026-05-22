import { Redis } from "@upstash/redis";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import type { WaitlistEntry } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "waitlist.json");
const REDIS_KEY = "waitlist:entries";

function isVercel() {
  return !!process.env.VERCEL || !!process.env.UPSTASH_REDIS_REST_URL;
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required on Vercel"
    );
  }
  return new Redis({ url, token });
}

// ─── Filesystem (local dev) ───

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function fsRead(): WaitlistEntry[] {
  ensureDir();
  if (!existsSync(DATA_FILE)) return [];
  return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function fsWrite(entries: WaitlistEntry[]) {
  ensureDir();
  writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

// ─── Redis (Vercel production) ───

async function redisRead(): Promise<WaitlistEntry[]> {
  const redis = getRedis();
  const data = await redis.get<WaitlistEntry[]>(REDIS_KEY);
  return data ?? [];
}

async function redisWrite(entries: WaitlistEntry[]) {
  const redis = getRedis();
  await redis.set(REDIS_KEY, entries);
}

// ─── Public API ───

export async function getEntries(): Promise<WaitlistEntry[]> {
  if (isVercel()) return redisRead();
  return fsRead();
}

export async function addEntry(entry: WaitlistEntry): Promise<WaitlistEntry[]> {
  if (isVercel()) {
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
