# GitScout Firebase Setup Guide

This guide will walk you through setting up Firebase Authentication and Firestore for the GitScout application.

## Overview

**What's Been Implemented (Phase 1 & 2):**

- ✅ Firebase Admin SDK backend integration
- ✅ Firebase client SDK frontend integration
- ✅ Authentication with Email/Password, Google OAuth, and GitHub OAuth
- ✅ Protected routes requiring authentication
- ✅ Centralized API client with automatic auth headers
- ✅ Login/Signup modal UI

**What's Next (Phase 3-5):**

- ⏳ Firestore data persistence (saved searches, starred candidates)
- ⏳ Cloud Run deployment
- ⏳ Vercel frontend deployment

---

## Prerequisites

1. **Node.js** (v20+) and **Python** (3.13+)
2. **Google Account** (for Firebase Console)
3. **GitHub Account** (optional, for GitHub OAuth)

---

## Step 1: Create Firebase Project

### 1.1 Create Project in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `gitscout-demo` (or your preferred name)
4. **Disable** Google Analytics (not needed for this demo)
5. Click **"Create project"**

### 1.2 Enable Authentication Providers

1. In the Firebase Console, go to **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable the following providers:

    **a) Email/Password:**
    - Click "Email/Password"
    - Toggle "Enable"
    - Click "Save"

    **b) Google:**
    - Click "Google"
    - Toggle "Enable"
    - Set a project support email (your email)
    - Click "Save"

    **c) GitHub (Optional):**
    - First, create a GitHub OAuth App:
        - Go to [GitHub Developer Settings](https://github.com/settings/developers)
        - Click "New OAuth App"
        - Application name: `GitScout Demo`
        - Homepage URL: `https://gitscout-demo.firebaseapp.com` (replace with your project ID)
        - Authorization callback URL: (Firebase will provide this)
    - Back in Firebase Console, click "GitHub"
    - Toggle "Enable"
    - Copy the callback URL shown
    - Paste it into your GitHub OAuth App settings
    - Copy GitHub Client ID and Client Secret
    - Paste them into Firebase
    - Click "Save"

### 1.3 Enable Firestore Database

1. In Firebase Console, go to **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add security rules later)
4. Choose location: **us-central** (or closest to you)
5. Click **"Enable"**

### 1.4 Get Firebase Web Configuration

1. Go to **Project Settings** (gear icon) > **"Your apps"** section
2. Click the **Web icon** (`</>`)
3. Register app with nickname: `GitScout Web`
4. **Do NOT** check "Also set up Firebase Hosting"
5. Click **"Register app"**
6. Copy the `firebaseConfig` object

It will look like this:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "gitscout-demo.firebaseapp.com",
    projectId: "gitscout-demo",
    storageBucket: "gitscout-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123",
};
```

```javascript
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyAyymuXmBHVOJXc3oXyfeDnoYG7hbVBHac",
    authDomain: "gitscout-d9240.firebaseapp.com",
    projectId: "gitscout-d9240",
    storageBucket: "gitscout-d9240.firebasestorage.app",
    messagingSenderId: "774285251684",
    appId: "1:774285251684:web:4a72a676bc03bae00e7b71",
    measurementId: "G-EP92VK4GE6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

**Save these values** - you'll need them for the frontend `.env` file.

### 1.5 Generate Service Account Key (for Backend)

1. In Firebase Console, go to **Project Settings** > **"Service Accounts"** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"** in the confirmation dialog
4. A JSON file will download - **rename it to `serviceAccountKey.json`**
5. **IMPORTANT:** Keep this file secure and **never commit it to Git**

---

## Step 2: Configure Backend

### 2.1 Place Service Account Key

Move the `serviceAccountKey.json` file to the backend directory:

```bash
mv ~/Downloads/serviceAccountKey.json backend/
```

### 2.2 Create Backend `.env` File

Create `backend/.env` (copy from `backend/.env.example`):

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your values:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=gitscout-demo
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json

# CORS (add your frontend URL)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# GitHub API (your existing token)
GITHUB_TOKEN=ghp_your_github_token_here

# LLM Provider (your existing key)
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_LLM_PROVIDER=gemini
```

### 2.3 Install Backend Dependencies

```bash
cd backend
uv sync
```

This will install `firebase-admin>=6.5.0` and other dependencies.

### 2.4 Verify Backend Setup

Start the backend:

```bash
cd backend
uvicorn app.main:app --reload
```

You should see in the logs:

```
✓ Firebase initialized with credentials from ./serviceAccountKey.json
✓ Firestore client initialized for project: gitscout-demo
```

Test the health endpoint:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{
    "status": "ok",
    "firebase": "connected"
}
```

---

## Step 3: Configure Frontend

### 3.1 Create Frontend `.env` File

Create `frontend/.env` (copy from `frontend/.env.example`):

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and add your Firebase config values (from Step 1.4):

```bash
# Backend API
VITE_API_BASE_URL=http://localhost:8000

# Firebase Web Config (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSy...your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=gitscout-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gitscout-demo
VITE_FIREBASE_STORAGE_BUCKET=gitscout-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3.2 Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install `firebase@^11.3.0` and other dependencies.

### 3.3 Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The app should start at `http://localhost:5173`

---

## Step 4: Test Authentication

### 4.1 Test Email/Password Registration

1. Open `http://localhost:5173` in your browser
2. Click **"Log in"** button in the navigation
3. In the modal, click **"Sign up"** at the bottom
4. Fill in:
    - Name: `Test User`
    - Email: `test@example.com`
    - Password: `password123`
5. Click **"Create account"**
6. You should be signed in and see your email in the navigation

### 4.2 Test Sign Out

1. Navigate to `/dashboard` (or click "Dashboard" in nav)
2. You should see your email in the top right
3. Click **"Sign Out"**
4. You should be redirected to the landing page

### 4.3 Test Email/Password Login

1. Click **"Log in"** again
2. Enter the same credentials:
    - Email: `test@example.com`
    - Password: `password123`
3. Click **"Sign in"**
4. You should be signed in successfully

### 4.4 Test Google OAuth

1. Sign out if logged in
2. Click **"Log in"**
3. Click **"Continue with Google"**
4. Select your Google account
5. You should be signed in with your Google profile

### 4.5 Test GitHub OAuth (if configured)

1. Sign out if logged in
2. Click **"Log in"**
3. Click **"Continue with GitHub"**
4. Authorize the app
5. You should be signed in with your GitHub profile

### 4.6 Test Protected Routes

1. Sign out
2. Try to navigate directly to `http://localhost:5173/dashboard`
3. You should be redirected to the landing page (not authenticated)
4. Sign in
5. Navigate to `/dashboard` again
6. You should now see the dashboard (authenticated)

---

## Step 5: Verify Firebase Console

### 5.1 Check Authenticated Users

1. Go to Firebase Console > **Authentication** > **Users** tab
2. You should see the users you created (email, Google, GitHub)
3. Each user has a unique UID

### 5.2 Check Firestore (Empty for Now)

1. Go to Firebase Console > **Firestore Database**
2. You should see an empty database (no collections yet)
3. Phase 3 will add `savedSearches` and `starredCandidates` collections

---

## Troubleshooting

### Backend Issues

**"Firebase initialization failed"**

- Check that `FIREBASE_PROJECT_ID` matches your project
- Verify `serviceAccountKey.json` exists in `backend/` directory
- Ensure the JSON file is valid

**"Health check shows firebase: not configured"**

- Firebase initialization failed - check backend logs
- Verify environment variables are set correctly

### Frontend Issues

**"Missing Firebase configuration fields"**

- Check that all `VITE_FIREBASE_*` variables are set in `frontend/.env`
- Restart the dev server after changing `.env`

**"Firebase API key is invalid"**

- Verify you copied the correct values from Firebase Console
- Check for typos in the `.env` file

**Login modal doesn't open**

- Check browser console for errors
- Ensure Firebase SDK is loaded (no import errors)

**OAuth popup blocked**

- Allow popups for `localhost` in your browser
- Some browsers block popups by default

**"Sign in cancelled" error**

- This is normal if you close the OAuth popup
- Try again and complete the sign-in flow

### Network Issues

**CORS errors**

- Ensure backend `CORS_ORIGINS` includes `http://localhost:5173`
- Restart the backend after changing `.env`

**API requests fail with 401**

- Check that the Firebase token is being sent
- Open browser DevTools > Network > Headers
- Look for `Authorization: Bearer <token>` header

---

## Next Steps

### Phase 3: Data Persistence (Coming Soon)

Once authentication is working, the next phase will implement:

1. **Saved Searches** - Auto-save search results to Firestore
2. **Search History** - View and reload previous searches
3. **Starred Candidates** - Save favorite candidates with notes

### Phase 4: Favorites & Notes (Coming Soon)

1. **Star/Unstar** candidates from the dashboard
2. **Add notes and tags** to starred candidates
3. **Filter favorites** by tags

### Phase 5: Production Deployment (Coming Soon)

1. **Cloud Run** backend deployment
2. **Vercel** frontend deployment
3. **Firestore security rules**

---

## Security Notes

### What's Safe to Commit

✅ **Frontend Firebase config** (`VITE_FIREBASE_*` values)

- These are public identifiers for your Firebase project
- They're meant to be exposed in the browser
- Security is enforced by Firestore rules (server-side)

✅ **Backend environment variable names** (in `.env.example`)

### What's SECRET - Never Commit

❌ **Backend service account key** (`serviceAccountKey.json`)

- This has admin access to your Firebase project
- Add to `.gitignore` (already done)

❌ **GitHub API token** (`GITHUB_TOKEN`)

- Personal access token with repo access

❌ **LLM API keys** (`GEMINI_API_KEY`, etc.)

- Cost money if leaked

❌ **Actual `.env` files**

- Already in `.gitignore`

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review browser console for frontend errors
3. Check backend terminal logs for server errors
4. Verify all environment variables are set correctly
5. Ensure Firebase project is configured properly in the console

---

**Congratulations!** You now have a fully functional authentication system powered by Firebase. Users can sign up, log in, and access protected routes. The next phases will add data persistence and production deployment capabilities.
