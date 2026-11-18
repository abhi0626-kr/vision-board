import crypto from 'node:crypto';
import fs from 'node:fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('./vision-board-28cc5-firebase-adminsdk-fbsvc-1551500a08.json', 'utf8')
);

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createSignedJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = signer.sign(serviceAccount.private_key, 'base64url');

  return `${unsigned}.${signature}`;
}

async function deploy() {
  console.log('Signing JWT with service account RSA key...');
  const jwt = createSignedJwt();

  console.log('Requesting OAuth2 access token from Google...');
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('OAuth token exchange failed:', tokenData);
    return;
  }
  console.log('Access token acquired!');

  const rulesContent = fs.readFileSync('./firestore.rules', 'utf8');

  // 1. Create a new ruleset
  console.log('Creating ruleset on Firebase Rules API...');
  const rulesetRes = await fetch('https://firebaserules.googleapis.com/v1/projects/vision-board-28cc5/rulesets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent,
          },
        ],
      },
    }),
  });

  const rulesetData = await rulesetRes.json();
  if (!rulesetRes.ok) {
    console.error('Failed to create ruleset:', JSON.stringify(rulesetData, null, 2));
    return;
  }
  console.log('Ruleset created:', rulesetData.name);

  // 2. Update release cloud.firestore
  console.log('Releasing ruleset to cloud.firestore...');
  const releaseRes = await fetch(
    'https://firebaserules.googleapis.com/v1/projects/vision-board-28cc5/releases/cloud.firestore',
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        release: {
          name: 'projects/vision-board-28cc5/releases/cloud.firestore',
          rulesetName: rulesetData.name,
        },
      }),
    }
  );

  const releaseData = await releaseRes.json();
  if (!releaseRes.ok) {
    console.warn('PATCH release returned status', releaseRes.status, releaseData);
    const createReleaseRes = await fetch('https://firebaserules.googleapis.com/v1/projects/vision-board-28cc5/releases', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'projects/vision-board-28cc5/releases/cloud.firestore',
        rulesetName: rulesetData.name,
      }),
    });
    console.log('Release created:', await createReleaseRes.json());
  } else {
    console.log('SUCCESS: Firestore security rules successfully deployed to Firebase Cloud!', releaseData.name);
  }
}

deploy().catch(console.error);
