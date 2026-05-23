# Firestore Emulator -> Production (One-Time Migration)

This repo now includes a safe migration script:

- `scripts/migrateFirestoreEmulatorToProd.js`

It copies Firestore documents from your local emulator into production Firestore.

## Safety Defaults

- Dry-run by default (no writes).
- Requires both `--execute` and `--confirm <target-project-id>` for real writes.
- Supports `--user-id` to migrate only one user's data.
- Uses merge writes by default (safer). Use `--overwrite` only if you intentionally want full overwrite.

## Prerequisites

1. Firestore emulator is running and contains the data you want to migrate.
2. You are authenticated for production writes, either:
   - `gcloud auth application-default login`
   - or set `GOOGLE_APPLICATION_CREDENTIALS` to a Firebase service-account JSON path.
3. Install dependencies:
   - `npm install`

## Default Collections Migrated

- `vision_images`
- `vision_videos`
- `vision_theories`
- `vision_wishes`
- `user_profiles`
- `user_reflections`
- `secret_notes`

## Recommended Flow

### 1) Dry-run first (required)

```bash
npm run migrate:firestore:emulator-to-prod -- --user-id YOUR_FIREBASE_UID
```

This prints how many docs would be copied per collection.

### 2) Execute migration

```bash
npm run migrate:firestore:emulator-to-prod -- --execute --confirm vision-board-28cc5 --user-id YOUR_FIREBASE_UID
```

Replace `vision-board-28cc5` with your real target project id if different.

## Optional Flags

- `--source-host 127.0.0.1:8080`
- `--source-project vision-board-28cc5`
- `--target-project vision-board-28cc5`
- `--collections vision_images,vision_wishes`
- `--overwrite` (danger: replaces doc content instead of merge)

## Notes

- This migrates Firestore documents only.
- Firebase Storage files are not copied by this script.
- For Storage migration, upload files to production Storage separately.
