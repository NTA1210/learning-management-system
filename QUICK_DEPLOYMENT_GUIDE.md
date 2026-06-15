# 🚀 QUICK DEPLOYMENT COMMANDS & TIPS

## 1️⃣ GENERATE SECRET KEYS

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output and use as JWT_SECRET and JWT_REFRESH_SECRET
```

---

## 2️⃣ PREPARE & PUSH CODE TO GITHUB

### Backend
```bash
cd BE_LMS

# Add to git
git add .
git commit -m "feat: add deployment configuration"

# Push
git push origin main
```

### Frontend
```bash
cd FE_LMS

# Add to git  
git add .
git commit -m "feat: add deployment configuration"

# Push
git push origin main
```

---

## 3️⃣ ENVIRONMENT VARIABLES MAPPING

### Backend → Render Environment Variables

| Variable | Example Value | Source |
|----------|---------------|--------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster0.mongodb.net/lms_db` | MongoDB Atlas |
| `PORT` | `3000` | Default (Render will override) |
| `NODE_ENV` | `production` | Fixed |
| `JWT_SECRET` | `a1b2c3d4...` | Generate with node |
| `JWT_REFRESH_SECRET` | `e5f6g7h8...` | Generate with node |
| `GOOGLE_CLIENT_ID` | `633098077079-...` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google Cloud Console |
| `APP_ORIGIN` | `https://lms-frontend-xxxxx.vercel.app,http://localhost:3000` | Vercel URL + local |
| `BUCKET_NAME` | `lms-files` | MinIO/S3 |
| `MINIO_ENDPOINT` | `s3.amazonaws.com` or `minio.example.com` | Your storage |
| `MINIO_PORT` | `443` | Default |
| `MINIO_USE_SSL` | `true` | Default |
| `MINIO_ACCESS_KEY` | `AKIAIOSFODNN7EXAMPLE` | MinIO/AWS |
| `MINIO_SECRET_KEY` | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | MinIO/AWS |
| `EMAIL_SENDER` | `noreply@yourdomain.com` | Your domain |
| `RESEND_API_KEY` | `re_xxxxx` | Resend dashboard |

### Frontend → Vercel Environment Variables

| Variable | Example Value | When |
|----------|---------------|------|
| `VITE_BASE_API` | `https://lms-backend-xxxxx.onrender.com` | Production/Preview |
| `VITE_GOOGLE_CLIENT_ID` | `633098077079-...` | All environments |

---

## 4️⃣ STEP-BY-STEP DEPLOYMENT ORDER

### Phase 1: Backend (20-30 minutes)
```
1. Generate secrets → 2 min
2. Setup MongoDB Atlas → 5 min
3. Setup Google OAuth → 5 min
4. Push code to GitHub → 2 min
5. Create Render service → 5 min
6. Add env vars to Render → 2 min
7. Deploy & wait → 10 min
8. Test backend with curl → 2 min
9. Get backend URL → 1 min
```

### Phase 2: Frontend (15-20 minutes)
```
1. Update env with backend URL → 2 min
2. Push code to GitHub → 2 min
3. Create Vercel project → 5 min
4. Add env vars to Vercel → 2 min
5. Deploy & wait → 5 min
6. Test frontend in browser → 3 min
7. Get frontend URL → 1 min
```

### Phase 3: Cross-Service (5-10 minutes)
```
1. Update Render env with frontend URL → 1 min
2. Update Google OAuth URLs → 2 min
3. Redeploy backend → 5 min
4. Final testing → 3 min
```

**Total Time: 40-60 minutes**

---

## 5️⃣ TESTING COMMANDS

### Test Backend is Running
```bash
# Should return 200 status
curl https://lms-backend-xxxxx.onrender.com/health

# With more details
curl -v https://lms-backend-xxxxx.onrender.com/health
```

### Check API is Accessible
```bash
# Example: Get all subjects
curl https://lms-backend-xxxxx.onrender.com/api/subjects

# With auth header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://lms-backend-xxxxx.onrender.com/api/protected-route
```

### Frontend Browser Console Tests
```javascript
// Check env variables loaded
console.log(import.meta.env.VITE_BASE_API);

// Test API call
fetch(`${import.meta.env.VITE_BASE_API}/api/subjects`)
  .then(r => r.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err))
```

---

## 6️⃣ COMMON URL PATTERNS

### After Deployment
- **Frontend**: `https://lms-frontend-{YOUR_PROJECT_NAME}.vercel.app`
- **Backend**: `https://lms-backend-{YOUR_PROJECT_NAME}.onrender.com`
- **API Endpoint**: `https://lms-backend-{YOUR_PROJECT_NAME}.onrender.com/api/...`

### Update These URLs
Replace `{YOUR_PROJECT_NAME}` with your actual Vercel/Render project names in:
1. `FE_LMS/.env.production` → `VITE_BASE_API`
2. Render Environment → `APP_ORIGIN`
3. Google Cloud Console → Authorized URIs
4. MinIO CORS policies
5. Any hardcoded URLs in code

---

## 7️⃣ IF SOMETHING BREAKS

### Check Logs First

**Render Logs**:
```
1. Go to render.com/dashboard
2. Click your web service
3. Click "Logs" tab
4. Look for ERROR in red text
```

**Vercel Logs**:
```
1. Go to vercel.com/dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment
5. Click "Logs" tab
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'express'` | Missing npm install | Push to GitHub, Render will reinstall |
| `ECONNREFUSED` | Database unreachable | Check MONGO_URI, IP whitelist |
| `401 Unauthorized` | Missing JWT secret | Add JWT_SECRET to env vars |
| `CORS error` | Wrong origin in APP_ORIGIN | Update to exact frontend URL |
| `404 Not Found` | Wrong Root Directory | Set Root Directory to BE_LMS or FE_LMS |

---

## 8️⃣ ROLLBACK IF NEEDED

### Render Rollback
```
1. Dashboard → Web Service → Deployments
2. Find previous good deployment
3. Click "Redeploy"
```

### Vercel Rollback
```
1. Dashboard → Project → Deployments
2. Find previous good deployment
3. Click "..." → "Redeploy"
```

Or revert Git commit:
```bash
git revert HEAD
git push origin main
# Services will auto-redeploy
```

---

## 9️⃣ USEFUL LINKS

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Resend**: https://resend.com/dashboard

---

## 🔟 FINAL CHECKLIST

### Before Pushing Code
- [ ] Remove `.env` files from git tracking
- [ ] Update environment variable examples
- [ ] Test locally: `npm run dev`
- [ ] No console errors
- [ ] No hardcoded URLs (use env vars)

### Before Deploying Backend
- [ ] All env vars documented
- [ ] Database connection tested
- [ ] Google OAuth credentials ready
- [ ] MinIO/S3 access ready
- [ ] Resend email configured
- [ ] Correct Root Directory: `BE_LMS`
- [ ] Correct Build Command: `npm install && npm run build`
- [ ] Correct Start Command: `npm start`

### Before Deploying Frontend
- [ ] Backend URL finalized
- [ ] Environment variables set in Vercel
- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors
- [ ] Correct Root Directory: `FE_LMS`
- [ ] No hardcoded API URLs

### After Deployment
- [ ] Backend health check passes
- [ ] Frontend loads in browser
- [ ] No 404 errors
- [ ] Console has no critical errors
- [ ] API calls reach backend
- [ ] Login functionality works
- [ ] Test one complete user flow

---

✅ **Ready to Deploy!** Follow the steps above and your LMS will be live. 🎉
