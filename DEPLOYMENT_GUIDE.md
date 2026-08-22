# 📚 LMS Deployment Guide

## Overview
This LMS project uses the following production architecture:
- **Frontend**: React 19 + Vite → Hosted on **Vercel**
- **Backend**: Express + TypeScript → Hosted on **Render**
- **Database**: MongoDB Atlas
- **Storage**: MinIO / Cloudflare R2 / AWS S3
- **Email**: Resend API
- **Real-Time**: Socket.io Engine

---

## 🚀 PART 1: BACKEND DEPLOYMENT ON RENDER

### Step 1: Prepare Render
1. Go to [render.com](https://render.com)
2. Sign in or create an account
3. Connect your GitHub account

### Step 2: Create Web Service on Render
1. Click **"New +"** → **"Web Service"**
2. Select the repository containing your LMS project
3. Choose the target branch (usually `main`)
4. Configure service settings:
   - **Name**: `lms-backend` (or your preferred name)
   - **Region**: Singapore (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: `BE_LMS` *(CRITICAL)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 3: Configure Environment Variables
In the Render Dashboard, navigate to **"Environment"**:
```ini
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms_db?retryWrites=true

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Object Storage (MinIO / Cloudflare R2 / AWS S3)
MINIO_ENDPOINT=your_minio_or_s3_endpoint
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
BUCKET_NAME=lms-files
PUBLIC_FILE_BASE_URL=https://media.example.com

# Resend Email Service
RESEND_API_KEY=your_resend_api_key
EMAIL_SENDER=noreply@example.com

# Server Environment
PORT=3000
NODE_ENV=production

# CORS Configuration - update once Frontend URL is generated
FRONTEND_URL=https://your-frontend-url.vercel.app
SOCKET_CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Step 4: Deploy Backend
1. Click **"Deploy"**
2. Wait for the build process to finish
3. Note down your backend live URL: `https://lms-backend-xxxxx.onrender.com`

---

## 🌐 PART 2: FRONTEND DEPLOYMENT ON VERCEL

### Step 1: Prepare Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in or create an account
3. Connect your GitHub account

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your GitHub repository
3. Configure project details:
   - **Project Name**: `lms-frontend`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `FE_LMS` *(CRITICAL)*

### Step 3: Build & Output Settings
Vercel automatically detects Vite configurations:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Configure Frontend Environment Variables
In the Vercel Dashboard under **"Settings"** → **"Environment Variables"**:

**Production**:
```ini
VITE_BASE_API=https://lms-backend-xxxxx.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**Preview & Development**:
```ini
VITE_BASE_API=https://lms-backend-xxxxx.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Step 5: Deploy Frontend
1. Click **"Deploy"**
2. Wait for build completion
3. Save your frontend live URL: `https://lms-frontend-xxxxx.vercel.app`

---

## 🔄 PART 3: CORS & ENVIRONMENT SYNCHRONIZATION

### Backend (Render)
1. Update production environment variables on Render:
   - `FRONTEND_URL=https://lms-frontend-xxxxx.vercel.app`
   - `SOCKET_CORS_ORIGIN=https://lms-frontend-xxxxx.vercel.app`
2. Save changes to trigger an automatic re-deploy on Render.

---

## 📝 PART 4: VERIFICATION & TROUBLESHOOTING

### Backend Verification
```bash
curl https://lms-backend-xxxxx.onrender.com/health
```

### Frontend Verification
- Visit `https://lms-frontend-xxxxx.vercel.app`
- Open Browser DevTools → Console to inspect for any runtime errors
- Check the Network tab to verify API endpoints point to the Render backend

### Common Troubleshooting

**❌ CORS Error**
- Verify `FRONTEND_URL` and `SOCKET_CORS_ORIGIN` in Render environment variables.
- Ensure the frontend URL includes `https://` without a trailing slash.

**❌ Backend Request Timeout / Cold Start**
- Render free-tier instances sleep after inactivity. The initial request may take 30-50 seconds to spin up.
- Check Render Dashboard → Logs for runtime crash errors.

**❌ Build Error**
- Ensure the Root Directory is set to `BE_LMS` for Render and `FE_LMS` for Vercel.
- Verify Node version compatibility in `package.json` (`node: "22.x"`).

**❌ MongoDB Atlas Connection Error**
- Verify that IP Access List in MongoDB Atlas is configured to allow access from anywhere (`0.0.0.0/0`) or Render egress IPs.
- Check that the database user credentials and URI encoding are correct.

---

## 🔐 PART 5: SECURITY BEST PRACTICES

1. **Never Commit Secrets**
   - Ensure all `.env` files are ignored in `.gitignore`.
2. **Use Strong Cryptographic Keys**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Database Protection**
   - Enforce strong database passwords and dedicated user roles on MongoDB Atlas.
4. **HTTPS & Cookie Flags**
   - Always serve over HTTPS with `httpOnly`, `secure`, and `sameSite` cookie options enabled.

---

## 📊 PART 6: MONITORING & LOGS

### Render Service Logs
- Dashboard → Web Service → **Logs** tab for real-time stdout/stderr.

### Vercel Deployment Logs
- Dashboard → Project → **Deployments** → Select deployment → **Runtime Logs**.
