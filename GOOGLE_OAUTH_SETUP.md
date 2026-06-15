# Google OAuth Setup Guide

## Overview
Google OAuth login has been implemented for both Backend and Frontend. Users can now login using their Google account.

## Setup Steps

### 1. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable "Google+ API"
4. Go to "Credentials" → Create "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000` (for local development)
   - `http://localhost:4004` (backend)
   - Your production URLs
7. Copy the **Client ID**

### 2. Backend Configuration (.env)
Add this to your `.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

Example:
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmno.apps.googleusercontent.com
```

### 3. Frontend Configuration (.env.local)
Create `.env.local` in `FE_LMS/` directory:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Example:
```
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmno.apps.googleusercontent.com
```

## Backend Implementation

### What was added:
- ✅ **Service**: `googleLogin()` in `src/services/auth.service.ts`
- ✅ **Controller**: `googleLoginHandler` in `src/controller/auth.controller.ts`
- ✅ **Route**: `POST /auth/google` 
- ✅ **Database**: Added `googleId` field to User model
- ✅ **Types**: Updated `IUser` interface

### Endpoint
```
POST /auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_from_frontend"
}

Response:
{
  "data": { user object },
  "message": "Login with Google successfully"
}
```

### Features:
- Auto-creates user if doesn't exist
- Extracts email, name, and profile picture from Google
- Auto-assigns role based on email domain (`@fe.edu.vn` = TEACHER, others = STUDENT)
- Enforces single session for students
- Auto-verifies email for Google users

## Frontend Implementation

### What was added:
- ✅ **Package**: `@react-oauth/google`
- ✅ **Main wrapper**: GoogleOAuthProvider in `src/main.tsx`
- ✅ **Service**: `googleLogin()` method in `src/services/index.ts`
- ✅ **Login component**: Google button with handler in `src/pages/auth/Login.tsx`
- ✅ Hook: `useGoogleLogin` from @react-oauth/google

### Google Button
The Google login button in the Login page:
- Calls `useGoogleLogin()` hook
- Sends ID token to backend
- Handles user redirect based on role
- Shows loading state while processing
- Displays errors if login fails

## Testing

### 1. Start Backend
```bash
cd BE_LMS
npm run dev
```

### 2. Start Frontend
```bash
cd FE_LMS
npm run dev
```

### 3. Test Google Login
1. Go to `http://localhost:3000/login`
2. Click the Google button
3. Sign in with your Google account
4. Should be redirected based on your role

## Troubleshooting

### Error: "Invalid Google token"
- Check that `GOOGLE_CLIENT_ID` matches frontend `VITE_GOOGLE_CLIENT_ID`
- Ensure authorized redirect URIs include your localhost URL

### Error: "Email not provided by Google"
- Some Google accounts may not share email, user needs to approve sharing

### CORS Issues
- Add frontend URL to backend CORS configuration if needed

## Database Notes
- First-time Google login creates new user account automatically
- User profile picture from Google is stored in `avatar_url`
- Google ID is stored in `googleId` field (optional, for reference)
- Email is required and used as unique identifier

## Security Notes
- ID tokens are verified using Google's OAuth2Client library
- Tokens are received from frontend and verified on backend (not trusted)
- HTTP-only cookies used for storing session tokens
- Single session enforcement for students prevents concurrent logins
