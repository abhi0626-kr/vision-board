# Firebase Environment Variables Diagnostic

## What to Check

Your Private Notes Vault needs Firebase to be properly configured. If you're still seeing "Cloud sync is unavailable", follow these steps:

### Step 1: Verify Environment Variables

Check your `.env.local` file (or `.env`) in the project root directory for these variables:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**All 6 variables must be present and non-empty.**

### Step 2: Find Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon ⚙️ → **Project Settings**
4. Click the **General** tab
5. Scroll down to "Your apps" section
6. Click on your web app (if none exist, click **+ Add app** and select web)
7. Copy the config object that looks like:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123...",
}
```

### Step 3: Update .env.local

Create or update your `.env.local` file:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
```

### Step 4: Restart Dev Server

1. Stop your dev server (Ctrl+C in terminal)
2. Run: `npm run dev` (or `bun run dev`)
3. Clear browser cache or open in incognito mode
4. Refresh the page

### Step 5: Check Browser Console

Open DevTools (F12) → **Console** tab and look for:

- `[Firebase] Configuration status:` - should show `configured: true`
- `[SecretNotes] Loading note...` - indicates it's trying to fetch from Firestore
- Look for any error messages in red

### Step 6: Verify Firestore & Storage in Console

**Firestore:**
1. Firebase Console → **Firestore Database**
2. Verify it's created and running (not greyed out)
3. Click **Rules** tab
4. Verify rules are deployed (should show recently deployed timestamp)

**Storage:**
1. Firebase Console → **Storage**
2. Verify it's created and running
3. Click **Rules** tab
4. Verify rules are deployed

## Common Issues

### "Firebase not configured"
- Missing or incorrect environment variables
- Variable names must start with `VITE_`
- Restart dev server after adding variables

### "Cloud sync is unavailable"
- Firestore/Storage not enabled in Firebase
- Security rules not deployed
- User not authenticated (check Auth tab in DevTools)

### Storage files not loading
- Storage bucket name incorrect (should end in `.appspot.com`)
- Storage security rules have wrong path patterns
- Files uploaded with old path structure

## Debugging Steps

1. **Check Auth:** Open DevTools → Console and run:
   ```javascript
   firebase.auth().currentUser
   ```
   Should show your user object, not `null`

2. **Check Firestore Connection:** Run in Console:
   ```javascript
   db !== null  // Should be true
   ```

3. **Check Env Vars:** In DevTools → Console:
   ```javascript
   import.meta.env.VITE_FIREBASE_PROJECT_ID  // Should show your project ID
   ```

4. **Check Recent Logs:** In Console, look for logs starting with `[Firebase]` or `[SecretNotes]`

## If Still Not Working

1. Check browser console (F12) for specific error messages
2. Copy the full error and check [Firebase Documentation](https://firebase.google.com/docs)
3. Verify:
   - Firebase project exists and is accessible
   - Firestore database is created and running (green status)
   - Storage is created and running (green status)
   - Security rules are published (not in draft)
   - User is authenticated with Firebase (not just app login)
