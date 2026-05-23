# Firebase Secret Notes Migration Setup

## Summary of Changes

The Private Notes Vault has been migrated from Supabase to Firebase. This resolves the authentication mismatch that was preventing cloud sync.

### What Changed

1. **Data Storage**: Now uses Firestore instead of Supabase PostgreSQL
   - Notes are stored in the `secret_notes` collection
   - Each user has one document with ID = their Firebase UID

2. **Media Storage**: Now uses Firebase Storage instead of Supabase Storage
   - Images: `secret-note-images/{userId}/{filename}`
   - Videos: `secret-note-videos/{userId}/{filename}`

3. **Authentication**: Uses Firebase Auth (already configured in your app)

## Firebase Setup Instructions

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. In the left sidebar, click **Firestore Database**
4. Click **Create Database**
5. Choose **Start in production mode**
6. Select your preferred region (e.g., `us-central1`)
7. Click **Create**

### 2. Deploy Firestore Security Rules

1. In the Firestore Database section, click the **Rules** tab
2. Replace the default rules with the content from `firestore.rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read and write their own secret notes
       match /secret_notes/{userId} {
         allow read, write: if request.auth.uid == userId;
       }
   
       // Deny all other access
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
3. Click **Publish**

### 3. Enable Firebase Storage

1. In the left sidebar, click **Storage**
2. Click **Get Started**
3. Select "Start in production mode"
4. Choose your preferred region
5. Click **Done**

### 4. Create Storage Buckets (Optional)

Firebase Storage uses a single bucket per project by default. The security rules organize data by path. No additional bucket creation needed.

### 5. Deploy Storage Security Rules

1. In the Storage section, click the **Rules** tab
2. Replace the default rules with the content from `storage.rules`:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Allow authenticated users to upload photos to their own folder
       match /secret-note-images/{userId}/{allPaths=**} {
         allow read, write: if request.auth.uid == userId;
       }
   
       // Allow authenticated users to upload videos to their own folder
       match /secret-note-videos/{userId}/{allPaths=**} {
         allow read, write: if request.auth.uid == userId;
       }
   
       // Deny all other access
       match /{allPaths=**} {
         allow read, write: if false;
       }
     }
   }
   ```
3. Click **Publish**

## Testing

1. Go to the Secret Notes page in your app
2. Enter the passcode (default: `0626`)
3. Click **Check Storage** to verify both Firestore and Storage are accessible
4. Try adding a paragraph and uploading an image/video
5. Refresh the page to verify data syncs correctly

## Troubleshooting

### "Cloud sync is unavailable" Error

**Cause**: Security rules not deployed or user not authenticated
**Fix**: 
- Verify you're logged in with Firebase Auth
- Check that Firestore and Storage security rules were published
- Check browser console for specific error messages

### "Could not create signed URL" Error

**Cause**: The file access check failed
**Fix**:
- Verify Storage Security Rules are correctly deployed
- Check that the file path matches the pattern: `secret-note-{images|videos}/{userId}/*`

### Upload Fails

**Cause**: Storage not enabled or rules deny access
**Fix**:
- Verify Storage is enabled in Firebase Console
- Confirm Storage Security Rules are published
- Check user ID matches Firebase UID

## Key Differences from Supabase

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Database | PostgreSQL + RLS | Firestore |
| File Storage | Separate buckets | Single bucket, path-based |
| Auth | Supabase Auth | Firebase Auth |
| Auth Sync | Automatic with RLS | Manual with Security Rules |
| Signed URLs | 7-day expiry | No expiry (auth-based) |

## File Structure

```
secret-note-images/
  {userId}/
    2026-05-20-uuid-filename.jpg
    ...
secret-note-videos/
  {userId}/
    2026-05-20-uuid-filename.mp4
    ...
```

Firestore:
```
secret_notes/
  {userId}:
    content: "{serialized JSON with paragraphs, images refs, videos refs}"
```

## Migration from Supabase (If You Had Existing Data)

The app will automatically migrate legacy data on first load. Old data URLs (data:// format) are detected and uploaded to Firebase Storage.

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)
