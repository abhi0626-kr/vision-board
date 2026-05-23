#!/usr/bin/env node

/**
 * One-time migration: Firestore emulator -> production Firestore.
 *
 * Safety defaults:
 * - Dry-run by default (no writes)
 * - Requires --execute and --confirm <TARGET_PROJECT_ID> for real writes
 * - Optional --user-id filter to migrate only one user's docs
 *
 * Usage examples:
 *   node scripts/migrateFirestoreEmulatorToProd.js --user-id <UID>
 *   node scripts/migrateFirestoreEmulatorToProd.js --execute --confirm vision-board-28cc5 --user-id <UID>
 */

import process from 'node:process';
import admin from 'firebase-admin';

const DEFAULT_COLLECTIONS = [
  'vision_images',
  'vision_videos',
  'vision_theories',
  'vision_wishes',
  'user_profiles',
  'user_reflections',
  'secret_notes',
];

function parseArgs(argv) {
  const args = {
    execute: false,
    overwrite: false,
    confirm: '',
    sourceHost: process.env.SOURCE_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',
    sourceProjectId:
      process.env.SOURCE_FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'vision-board-28cc5',
    targetProjectId:
      process.env.TARGET_FIREBASE_PROJECT_ID ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      'vision-board-28cc5',
    collections: [...DEFAULT_COLLECTIONS],
    userId: process.env.MIGRATE_USER_ID || '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    const next = argv[i + 1];

    if (current === '--execute') {
      args.execute = true;
      continue;
    }

    if (current === '--overwrite') {
      args.overwrite = true;
      continue;
    }

    if (current === '--confirm' && next) {
      args.confirm = next;
      i += 1;
      continue;
    }

    if (current === '--source-host' && next) {
      args.sourceHost = next;
      i += 1;
      continue;
    }

    if (current === '--source-project' && next) {
      args.sourceProjectId = next;
      i += 1;
      continue;
    }

    if (current === '--target-project' && next) {
      args.targetProjectId = next;
      i += 1;
      continue;
    }

    if (current === '--collections' && next) {
      args.collections = next
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (current === '--user-id' && next) {
      args.userId = next;
      i += 1;
      continue;
    }
  }

  return args;
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;

  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('bytesValue' in value) return value.bytesValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;

  if ('arrayValue' in value) {
    const arrayValues = value.arrayValue?.values || [];
    return arrayValues.map((entry) => decodeFirestoreValue(entry));
  }

  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, nested]) => [key, decodeFirestoreValue(nested)])
    );
  }

  return null;
}

function decodeFirestoreDocument(document) {
  const fields = document.fields || {};
  const data = Object.fromEntries(
    Object.entries(fields).map(([key, rawValue]) => [key, decodeFirestoreValue(rawValue)])
  );

  const id = String(document.name || '').split('/').pop() || '';
  return {
    id,
    data,
    name: document.name,
  };
}

async function fetchCollectionDocs(sourceHost, sourceProjectId, collection) {
  const docs = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams();
    params.set('pageSize', '300');
    if (pageToken) params.set('pageToken', pageToken);

    const url = `http://${sourceHost}/v1/projects/${sourceProjectId}/databases/(default)/documents/${collection}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Failed to read ${collection} from emulator (${response.status}): ${bodyText}`);
    }

    const body = await response.json();
    const pageDocs = Array.isArray(body.documents)
      ? body.documents.map((document) => decodeFirestoreDocument(document))
      : [];

    docs.push(...pageDocs);
    pageToken = body.nextPageToken || '';
  } while (pageToken);

  return docs;
}

function shouldKeepDoc(collection, decodedDoc, userId) {
  if (!userId) return true;

  const dataUserId = decodedDoc.data?.userId || decodedDoc.data?.user_id;
  if (dataUserId === userId) return true;

  // Some collections are keyed by uid directly.
  if ((collection === 'user_profiles' || collection === 'user_reflections' || collection === 'secret_notes') && decodedDoc.id === userId) {
    return true;
  }

  return false;
}

function chunkArray(values, size) {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

async function ensureAdminInitialized(targetProjectId) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: targetProjectId,
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: targetProjectId,
  });
}

async function writeCollection(db, collection, docs, overwrite) {
  const chunks = chunkArray(docs, 400);

  for (const group of chunks) {
    const batch = db.batch();

    for (const docEntry of group) {
      const docRef = db.collection(collection).doc(docEntry.id);
      batch.set(docRef, docEntry.data, { merge: !overwrite });
    }

    await batch.commit();
  }
}

function printPlan(args) {
  console.log('--- Firestore Migration Plan ---');
  console.log(`Mode            : ${args.execute ? 'EXECUTE' : 'DRY-RUN'}`);
  console.log(`Source host     : ${args.sourceHost}`);
  console.log(`Source project  : ${args.sourceProjectId}`);
  console.log(`Target project  : ${args.targetProjectId}`);
  console.log(`Collections     : ${args.collections.join(', ')}`);
  console.log(`User filter     : ${args.userId || '(none - all docs in listed collections)'}`);
  console.log(`Write strategy  : ${args.overwrite ? 'overwrite docs' : 'merge docs (safer default)'}`);
  console.log('-------------------------------\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  printPlan(args);

  if (args.execute && args.confirm !== args.targetProjectId) {
    throw new Error(
      `Safety check failed: pass --confirm ${args.targetProjectId} to execute writes.`
    );
  }

  const summary = {
    scanned: 0,
    kept: 0,
    byCollection: {},
  };

  const docsByCollection = {};

  for (const collection of args.collections) {
    const docs = await fetchCollectionDocs(args.sourceHost, args.sourceProjectId, collection);
    const keptDocs = docs.filter((docEntry) => shouldKeepDoc(collection, docEntry, args.userId));

    summary.scanned += docs.length;
    summary.kept += keptDocs.length;
    summary.byCollection[collection] = {
      scanned: docs.length,
      kept: keptDocs.length,
    };

    docsByCollection[collection] = keptDocs;

    console.log(`${collection}: scanned=${docs.length}, selected=${keptDocs.length}`);
  }

  console.log(`\nTotal scanned: ${summary.scanned}`);
  console.log(`Total selected: ${summary.kept}`);

  if (!args.execute) {
    console.log('\nDry-run complete. No production writes were made.');
    console.log(`Run with: --execute --confirm ${args.targetProjectId}`);
    return;
  }

  await ensureAdminInitialized(args.targetProjectId);
  const db = admin.firestore();

  for (const collection of args.collections) {
    const docs = docsByCollection[collection] || [];
    if (docs.length === 0) continue;

    await writeCollection(db, collection, docs, args.overwrite);
    console.log(`Wrote ${docs.length} docs to production collection: ${collection}`);
  }

  console.log('\nMigration complete.');
  console.log('Important: this script migrates Firestore documents only (not Storage files).');
}

main().catch((error) => {
  console.error('\nMigration failed:', error.message || error);

  if (String(error?.message || '').includes('default credentials')) {
    console.error('\nAuth hint: Firestore production writes need server credentials.');
    console.error('Option 1 (recommended): set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file.');
    console.error('PowerShell example:');
    console.error('  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\service-account.json"');
    console.error('  node scripts/migrateFirestoreEmulatorToProd.js --execute --confirm vision-board-28cc5 --user-id <UID>');
    console.error('Option 2: set FIREBASE_SERVICE_ACCOUNT_JSON with the full JSON content.');
  }

  process.exit(1);
});
