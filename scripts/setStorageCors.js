#!/usr/bin/env node

/**
 * One-time Firebase Storage CORS configuration helper.
 *
 * Usage:
 *   node scripts/setStorageCors.js
 *
 * By default this uses the service-account JSON in the repo root:
 *   vision-board-28cc5-firebase-adminsdk-fbsvc-1551500a08.json
 *
 * Override with:
 *   GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json>
 */

import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Storage } from '@google-cloud/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultCredentials = path.join(__dirname, '..', 'vision-board-28cc5-firebase-adminsdk-fbsvc-1551500a08.json');

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultCredentials;
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'vision-board-28cc5.appspot.com';

const corsRules = [
  {
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'https://vision-board-inky.vercel.app',
      'https://vision-board-olx70s0n4-abhishek636kr-2535s-projects.vercel.app',
    ],
    method: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    responseHeader: ['Content-Type', 'Authorization', 'x-goog-resumable', 'x-goog-upload-command'],
    maxAgeSeconds: 3600,
  },
];

async function main() {
  console.log('--- Firebase Storage CORS Setup ---');
  console.log(`Bucket      : ${bucketName}`);
  console.log(`Credentials : ${credentialsPath}`);
  console.log(`Origins     : ${corsRules[0].origin.join(', ')}`);

  const storage = new Storage({
    keyFilename: credentialsPath,
  });

  const bucket = storage.bucket(bucketName);

  await bucket.setCorsConfiguration(corsRules);
  console.log('\nCORS configuration updated successfully.');
  console.log('If uploads still fail, hard refresh the app and try again.');
}

main().catch((error) => {
  console.error('\nCORS setup failed:', error.message || error);
  process.exit(1);
});
