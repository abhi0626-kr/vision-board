Local Firebase Emulator instructions

1. Install Firebase CLI (if not installed):

```bash
npm install -g firebase-tools
```

2. Ensure `.env.local` contains:

```
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_EMULATOR_HOST=localhost
VITE_FIREBASE_AUTH_EMULATOR_PORT=9099
VITE_FIREBASE_FIRESTORE_EMULATOR_PORT=8080
VITE_FIREBASE_STORAGE_EMULATOR_PORT=9199
```

3. Start emulators:

```bash
firebase emulators:start --only auth,firestore,storage
```

4. Start dev server in another terminal:

```bash
npm run dev
```

5. Visit `http://localhost:8081` (or the port Vite shows) to use the app connected to local emulators.

Notes:
- The emulator UI is available at http://localhost:4000 by default when running the emulators.
- To seed test users or files, use the `firebase` CLI or the emulator UI.
