# 📋 DEPLOYMENT CHECKLIST & STEP-BY-STEP GUIDE

## 🔧 PRE-DEPLOYMENT SETUP

### Step 1: Create Production Secrets
Run these commands to generate secure keys:

```bash
# Generate JWT Secret (copy output)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT Refresh Secret
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Save these values - you'll need them for both services.

### Step 2: Prepare Your Accounts & Services

- [ ] MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
  - [ ] Create cluster
  - [ ] Create database user
  - [ ] Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/lms_db`
  - [ ] Whitelist Render IP (0.0.0.0/0 for now, later restrict)

- [ ] Google OAuth setup (https://console.cloud.google.com)
  - [ ] Create OAuth 2.0 credentials
  - [ ] Add authorized redirect URIs:
    - `https://lms-backend-xxxxx.onrender.com/api/auth/google/callback`
    - `http://localhost:4004/api/auth/google/callback`
  - [ ] Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

- [ ] MinIO/AWS S3 setup
  - [ ] Create bucket for file storage
  - [ ] Get access key, secret key, endpoint
  - [ ] Set CORS policy to allow your frontend URL

- [ ] Resend (Email) setup (https://resend.com)
  - [ ] Create account
  - [ ] Get API key
  - [ ] Verify sender email

- [ ] Render account (https://render.com)
  - [ ] Sign up
  - [ ] Connect GitHub repository

- [ ] Vercel account (https://vercel.com)
  - [ ] Sign up
  - [ ] Connect GitHub repository

---

## 🚀 DEPLOYMENT PROCESS

### PHASE 1: Backend Deployment (Render)

#### Step 1: Prepare Backend Repository
```bash
cd BE_LMS

# Ensure .gitignore has .env
echo ".env" >> .gitignore

# Push to GitHub
git add .
git commit -m "chore: add deployment configuration"
git push origin main
```

#### Step 2: Create Render Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select your GitHub repository
4. Configure:
   - **Name**: `lms-backend`
   - **Repository**: Select correct repo
   - **Branch**: `main`
   - **Root Directory**: `BE_LMS` ✅ IMPORTANT
   - **Runtime**: `Node`
   - **Region**: `Singapore` (or nearest to users)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter (or higher if needed)

#### Step 3: Add Environment Variables to Render
In Render Dashboard → Web Service → Environment:

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/lms_db
PORT=3000
NODE_ENV=production
JWT_SECRET=<paste generated secret here>
JWT_REFRESH_SECRET=<paste generated secret here>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
APP_ORIGIN=http://localhost:3000
BUCKET_NAME=lms-files
MINIO_ENDPOINT=<your minio endpoint>
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=<from MinIO>
MINIO_SECRET_KEY=<from MinIO>
EMAIL_SENDER=noreply@yourdomain.com
RESEND_API_KEY=<from Resend>
```

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Monitor logs in "Logs" tab
4. Once deployed, note your backend URL: `https://lms-backend-xxxxx.onrender.com`
5. Test: `curl https://lms-backend-xxxxx.onrender.com/health`

#### Step 5: Update Backend for Production
Once you have Frontend URL, update:

1. In Render dashboard, update environment variable:
   ```
   APP_ORIGIN=https://lms-frontend-xxxxx.vercel.app,http://localhost:3000
   ```

2. This will trigger automatic redeploy

---

### PHASE 2: Frontend Deployment (Vercel)

#### Step 1: Prepare Frontend Repository
```bash
cd FE_LMS

# Ensure .gitignore has .env
echo ".env" >> .gitignore

# Push to GitHub
git add .
git commit -m "chore: add deployment configuration"
git push origin main
```

#### Step 2: Import Project to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import GitHub repository
4. Configure:
   - **Project Name**: `lms-frontend`
   - **Framework**: `Vite`
   - **Root Directory**: `FE_LMS` ✅ IMPORTANT
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

#### Step 3: Add Environment Variables to Vercel
In Vercel Dashboard → Project Settings → Environment Variables:

For **Production**, **Preview**, and **Development**:
```
VITE_BASE_API=https://lms-backend-xxxxx.onrender.com
VITE_GOOGLE_CLIENT_ID=633098077079-941vf98v7ccl9m6q7utk78ovls09cncv.apps.googleusercontent.com
```

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Once deployed, note your frontend URL: `https://lms-frontend-xxxxx.vercel.app`
4. Click "Visit" to test

#### Step 5: Test Frontend
- [ ] Page loads without errors
- [ ] Console has no critical errors
- [ ] API requests go to correct backend URL
- [ ] Login page loads

---

### PHASE 3: Cross-Service Configuration

#### Step 1: Update Backend CORS
In Render Dashboard:
1. Go to Environment Variables
2. Update `APP_ORIGIN`:
   ```
   https://lms-frontend-xxxxx.vercel.app,http://localhost:3000
   ```
3. Save - This triggers redeploy

#### Step 2: Update Google OAuth Authorized URLs
In Google Cloud Console:
1. Go to OAuth 2.0 Consent Screen
2. Add authorized redirect URIs:
   ```
   https://lms-frontend-xxxxx.vercel.app
   https://lms-backend-xxxxx.onrender.com/api/auth/google/callback
   ```

#### Step 3: Update MinIO CORS
If using MinIO, add CORS:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": [
        "https://lms-frontend-xxxxx.vercel.app",
        "http://localhost:3000"
      ],
      "ExposeHeaders": ["*"]
    }
  ]
}
```

---

## ✅ TESTING CHECKLIST

### Backend Tests
- [ ] Health check works: `curl https://lms-backend-xxxxx.onrender.com/health`
- [ ] Database connection working (check Render logs)
- [ ] No errors in Render logs
- [ ] API responds to requests

### Frontend Tests
- [ ] Page loads without 404s
- [ ] Console has no "Cannot GET" errors
- [ ] API calls go to correct backend URL
- [ ] Network requests succeed

### Integration Tests
- [ ] Login page loads
- [ ] Click "Login with Google" button
- [ ] Redirects to Google OAuth
- [ ] After OAuth, redirects back to app
- [ ] User dashboard loads
- [ ] Can upload files
- [ ] Real-time features work (if any)

---

## 🐛 TROUBLESHOOTING

### ❌ Backend Not Starting
**Check Logs**: Render Dashboard → Logs
**Common Issues**:
- Missing environment variables → Add to Render env vars
- Wrong node version → Check `package.json` engines
- Database connection → Test `MONGO_URI` separately
- Port conflicts → Check PORT variable

### ❌ Frontend Build Fails
**Check Logs**: Vercel Dashboard → Deployments → [deployment] → Logs
**Common Issues**:
- Wrong root directory → Set to `FE_LMS`
- Missing dependencies → Check `package.json`
- Env var not loaded → Check `VITE_` prefix
- TypeScript errors → Fix locally first

### ❌ CORS Errors in Console
```
Access to XMLHttpRequest blocked by CORS
```
**Solution**:
1. Check `APP_ORIGIN` in Render includes your frontend URL
2. Include both HTTP and HTTPS URLs
3. Check backend CORS middleware in `src/app.ts`
4. Redeploy backend after updating env vars

### ❌ API Returns 404
**Check**:
- Backend URL correct in `.env`
- API endpoint path correct
- Backend is actually running (check logs)
- Not hitting /health instead of actual endpoint

### ❌ Static Files Not Loading
**Check**:
- Files in `FE_LMS/public/` folder
- Build output in `dist/` folder
- Vercel sees `dist` as output directory

---

## 📊 MONITORING AFTER DEPLOYMENT

### Daily Checks
- [ ] Render logs for errors: https://dashboard.render.com
- [ ] Vercel deployment status: https://vercel.com/dashboard
- [ ] Check frontend functionality manually

### Monthly Reviews
- [ ] Database performance
- [ ] Storage usage
- [ ] Error rates
- [ ] User feedback

### Useful Commands

**View Render Logs** (via dashboard):
```
Render → [Service] → Logs → Real-time
```

**View Vercel Logs** (via dashboard):
```
Vercel → [Project] → Deployments → [Deployment] → Logs
```

**Test API Endpoints**:
```bash
curl -X GET https://lms-backend-xxxxx.onrender.com/health
curl -X GET https://lms-backend-xxxxx.onrender.com/api/subjects
```

**Check Environment Variables**:
```bash
# Backend (via Render dashboard)
Render → Web Service → Settings → Environment Variables

# Frontend (via Vercel dashboard)
Vercel → Settings → Environment Variables
```

---

## 🔐 POST-DEPLOYMENT SECURITY

### Checklist
- [ ] Change default passwords everywhere
- [ ] Enable 2FA on Render, Vercel, MongoDB
- [ ] Rotate JWT secrets periodically
- [ ] Monitor for unauthorized API calls
- [ ] Set up alerting for errors
- [ ] Restrict MongoDB IP whitelist (don't use 0.0.0.0)
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Set up rate limiting on API
- [ ] Regular security updates for dependencies

---

## 📞 SUPPORT & RESOURCES

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Express.js**: https://expressjs.com
- **React Vite**: https://vitejs.dev

---

## 🎯 FINAL SUMMARY

| Service | URL Format | Status Check |
|---------|-----------|--------------|
| Backend | `https://lms-backend-xxxxx.onrender.com` | `/health` endpoint |
| Frontend | `https://lms-frontend-xxxxx.vercel.app` | Visit & check console |
| Database | MongoDB Atlas | Check connection in logs |

Once all tests pass, your LMS is live! 🎉
