#!/usr/bin/env node
// Usage: node scripts/upsertLocalToSupabase.js ./localDump.json
// Expects env vars: SUPABASE_URL, SUPABASE_ANON, USER_ID

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};

  const parsed = {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

const envFromFile = loadEnvFile(path.join(__dirname, '..', '.env'));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || envFromFile.SUPABASE_URL || envFromFile.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON || process.env.VITE_SUPABASE_ANON_KEY || envFromFile.SUPABASE_ANON || envFromFile.VITE_SUPABASE_ANON_KEY;
const SUPABASE_AUTH_TOKEN = process.env.SUPABASE_AUTH_TOKEN || envFromFile.SUPABASE_AUTH_TOKEN || null;
const USER_ID = process.env.USER_ID || envFromFile.USER_ID;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON environment variables.');
  process.exit(1);
}

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: node scripts/upsertLocalToSupabase.js ./localDump.json');
  process.exit(1);
}

const dumpPath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(dumpPath)) {
  console.error('File not found:', dumpPath);
  process.exit(1);
}

const raw = fs.readFileSync(dumpPath, 'utf8');
let payload;
try {
  payload = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(1);
}

function normalizeCategory(value) {
  if (value == null) return null;

  const raw = String(value).trim().toLowerCase();
  const aliases = {
    'personal growth': 'personal',
    personal: 'personal',
    career: 'career',
    health: 'health',
    travel: 'travel',
    creativity: 'creativity',
    relationships: 'relationships',
  };

  return aliases[raw] || raw;
}

function getUserIdFromPayload(payload) {
  return (
    process.env.USER_ID ||
    envFromFile.USER_ID ||
    payload.userId ||
    payload.user_id ||
    payload.userID ||
    null
  );
}

function isPlaceholderValue(value) {
  if (value == null) return false;
  const text = String(value).trim();
  return text === '...' || text.includes('...');
}

function assertRealPayload(payload) {
  const collections = [payload.theories, payload.wishes, payload.images].filter(Array.isArray);
  const hasRealItem = collections.some(items =>
    items.some(item => Object.values(item).some(value => !isPlaceholderValue(value)))
  );

  if (!hasRealItem) {
    throw new Error('localDump.json still looks like a placeholder sample. Replace the ... values with your real export before importing.');
  }
}

function hasPlaceholderFields(value, requiredFields) {
  return requiredFields.some(field => isPlaceholderValue(value[field]));
}

const headers = {
  apikey: SUPABASE_ANON,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

headers.Authorization = `Bearer ${SUPABASE_AUTH_TOKEN || SUPABASE_ANON}`;

async function request(method, url, body) {
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  return { ok: res.ok, status: res.status, body: json };
}

async function upsertRow(table, row) {
  // If row has id, try PATCH by id
  if (row.id) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(row.id)}`;
    const r = await request('PATCH', url, row);
    if (r.ok && Array.isArray(r.body) && r.body.length > 0) return { action: 'updated', row: r.body[0] };
    // If not updated, fall through to insert
  }
  const insertUrl = `${SUPABASE_URL}/rest/v1/${table}`;
  const ins = await request('POST', insertUrl, row);
  if (ins.ok && Array.isArray(ins.body) && ins.body.length > 0) return { action: 'inserted', row: ins.body[0] };
  return { action: 'error', error: ins };
}

async function upsertWishRow(row) {
  const retryableCodes = new Set(['42703', 'PGRST204']);

  const writePayload = async (payload) => {
    if (row.id) {
      const updateUrl = `${SUPABASE_URL}/rest/v1/vision_wishes?id=eq.${encodeURIComponent(row.id)}`;
      const update = await request('PATCH', updateUrl, payload);
      if (update.ok && Array.isArray(update.body) && update.body.length > 0) {
        return { action: 'updated', row: update.body[0] };
      }
      // If update returned 0 rows (id doesn't exist), fall through to insert
    }

    const insert = await request('POST', `${SUPABASE_URL}/rest/v1/vision_wishes`, payload);
    if (insert.ok && Array.isArray(insert.body) && insert.body.length > 0) {
      return { action: 'inserted', row: insert.body[0] };
    }
    return { action: 'error', error: insert };
  };

  const firstAttempt = await writePayload(row);
  if (firstAttempt.action !== 'error') return firstAttempt;

  if (firstAttempt.error?.body?.code && retryableCodes.has(firstAttempt.error.body.code)) {
    const { achieved_at, ...withoutAchievedAt } = row;
    return writePayload(withoutAchievedAt);
  }

  return firstAttempt;
}

async function upsertReflection(reflection, userId) {
  if (!userId) {
    console.error('USER_ID env var required to write reflections.');
    return { action: 'skipped', reason: 'missing user id' };
  }
  // Try update existing by user_id
  const url = `${SUPABASE_URL}/rest/v1/user_reflections?user_id=eq.${encodeURIComponent(userId)}`;
  const r = await request('PATCH', url, { long_notes: reflection.longNotes });
  if (r.ok && Array.isArray(r.body) && r.body.length > 0) return { action: 'updated', row: r.body[0] };
  // Insert
  const ins = await request('POST', `${SUPABASE_URL}/rest/v1/user_reflections`, { user_id: userId, long_notes: reflection.longNotes });
  if (ins.ok && Array.isArray(ins.body) && ins.body.length > 0) return { action: 'inserted', row: ins.body[0] };
  return { action: 'error', error: ins };
}

(async () => {
  const summary = { theories: [], wishes: [], images: [], reflection: null };
  const userId = getUserIdFromPayload(payload);

  assertRealPayload(payload);

  // The payload may be either an object with keys or raw arrays.
  const theories = Array.isArray(payload.theories) ? payload.theories : (Array.isArray(payload.theory) ? payload.theory : []);
  const wishes = Array.isArray(payload.wishes) ? payload.wishes : (Array.isArray(payload.wish) ? payload.wish : []);
  const images = Array.isArray(payload.images) ? payload.images : (Array.isArray(payload.image) ? payload.image : []);
  const reflection = payload.reflection || payload.homeLongNotes || payload.reflections || null;

  for (const t of theories) {
    if (hasPlaceholderFields(t, ['title', 'content', 'category'])) {
      console.log('theory: skipped placeholder row');
      continue;
    }

    const row = {
      user_id: userId || t.user_id || null,
      title: t.title,
      content: t.content,
      author: t.author ?? null,
      category: normalizeCategory(t.category),
      id: t.id
    };
    const res = await upsertRow('vision_theories', row);
    summary.theories.push(res);
    console.log('theory:', res.action, res.row ?? res.error);
  }

  for (const w of wishes) {
    if (hasPlaceholderFields(w, ['title', 'category', 'id'])) {
      console.log('wish: skipped placeholder row');
      continue;
    }

    const row = {
      user_id: userId || w.user_id || null,
      id: w.id,
      title: w.title,
      description: w.description ?? null,
      category: normalizeCategory(w.category),
      completed: !!w.completed,
      progress: w.progress ?? null,
      created_at: w.createdAt ?? w.created_at ?? null,
      achieved_at: w.achievedAt ?? w.achieved_at ?? null,
    };
    const res = await upsertWishRow(row);
    summary.wishes.push(res);
    console.log('wish:', res.action, res.row ?? res.error);
  }

  for (const img of images) {
    if (hasPlaceholderFields(img, ['src', 'alt', 'category'])) {
      console.log('image: skipped placeholder row');
      continue;
    }

    const row = {
      user_id: userId || img.user_id || null,
      id: img.id,
      src: img.src,
      alt: img.alt ?? null,
      category: normalizeCategory(img.category),
    };
    const res = await upsertRow('vision_images', row);
    summary.images.push(res);
    console.log('image:', res.action, res.row ?? res.error);
  }

  if (reflection) {
    const reflObj = typeof reflection === 'string' ? { longNotes: reflection } : reflection;
    const res = await upsertReflection({ longNotes: reflObj.longNotes || reflObj.long_notes || '' }, userId);
    summary.reflection = res;
    console.log('reflection:', res.action, res.row ?? res.error);
  }

  console.log('\nSummary:');
  console.log(JSON.stringify(summary, null, 2));
})();
