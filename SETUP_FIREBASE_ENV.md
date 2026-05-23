# QUICK SETUP - Firebase for Private Notes

## Problem
Your `.env.local` file is missing. Firebase can't work without it.

## Solution: 3 Simple Steps

### Step 1: Create .env.local File
Create a new file in your project root:
- **Path**: `c:\Users\abhis\OneDrive\Desktop\vs code\Lovable\vision-board\.env.local`
- This file should be in the same folder as `package.json`

### Step 2: Get Firebase Credentials
1. Open [Firebase Console](https://console.firebase.google.com)
2. Click your project name
3. Click settings icon ⚙️ (top left)
4. Select "Project Settings"
5. Click the "General" tab
6. Scroll to "Your apps" section
7. Find your web app - copy this config:

```javascript
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

### Step 3: Paste Into .env.local

Paste this into your `.env.local` file, replacing the values from Step 2:

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

**Example** (this won't work, just showing format):
```
VITE_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=my-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-app-12345
VITE_FIREBASE_STORAGE_BUCKET=my-app-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

### Step 4: Restart Dev Server
1. Stop terminal running `npm run dev`
2. Run: `npm run dev`
3. Refresh your browser page

## Verify It Works

After restarting, you should see:
- ✅ "Connected to: Firebase Storage" (instead of "unknown-project")
- ✅ Click "Check Storage" - should show green checkmarks
- ✅ Upload photos/videos - should work
- ✅ Save paragraphs - should sync to cloud

## .env.local Location

```
vision-board/
  ├── package.json
  ├── .env.local          ← Create this file here
  ├── src/
  ├── public/
  └── ...
```

## Security Note
⚠️ Never commit `.env.local` to GitHub
- It's already in `.gitignore`
- Each developer gets their own copy
- Regenerate keys if you commit one accidentally

## Still Not Working?

1. Make sure ALL 6 variables are filled in (no blanks)
2. Copy exact values from Firebase - no extra spaces
3. Restart dev server after creating file
4. Clear browser cache (Ctrl+Shift+Del)
5. Open in incognito mode to test

## Need Firebase Project?

If you don't have a Firebase project yet:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name, continue with defaults
4. Follow Step 2 above to get credentials
