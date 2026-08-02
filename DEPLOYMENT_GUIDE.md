# 📚 Hướng Dẫn Triển Khai LMS

## Tổng Quan
Dự án LMS này sử dụng:
- **Frontend**: React + Vite → Vercel
- **Backend**: Express + TypeScript → Render
- **Database**: MongoDB
- **Storage**: MinIO / AWS S3
- **Email**: Resend

---

## 🚀 PHẦN 1: TRIỂN KHAI BACKEND TRÊN RENDER

### Bước 1: Chuẩn Bị Render
1. Truy cập [render.com](https://render.com)
2. Đăng nhập hoặc tạo tài khoản
3. Kết nối GitHub account của bạn

### Bước 2: Tạo Web Service trên Render
1. Nhấp vào "New +" → "Web Service"
2. Chọn repository GitHub chứa dự án
3. Chọn branch (thường là `main`)
4. Cấu hình:
   - **Name**: `lms-backend` (hoặc tên bạn muốn)
   - **Region**: Singapore (hoặc gần nhất với người dùng)
   - **Branch**: main
   - **Root Directory**: `BE_LMS` (QUAN TRỌNG!)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Bước 3: Cấu Hình Biến Môi Trường
Trong Render Dashboard, vào "Environment":
```
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms_db?retryWrites=true

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth
GOOGLE_CLIENT_ID=633098077079-941vf98v7ccl9m6q7utk78ovls09cncv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MinIO / S3
MINIO_ENDPOINT=your_minio_or_s3_endpoint
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
BUCKET_NAME=lms-files
# Cloudflare R2: use an enabled r2.dev URL or custom domain, not MINIO_ENDPOINT.
PUBLIC_FILE_BASE_URL=https://media.example.com

# Resend Email
RESEND_API_KEY=your_resend_api_key

# Server
PORT=3000
NODE_ENV=production

# CORS - cập nhật sau khi có Frontend URL
FRONTEND_URL=https://your-frontend-url.vercel.app

# Socket.IO CORS
SOCKET_CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Bước 4: Deploy
1. Nhấp "Deploy"
2. Chờ quá trình build hoàn tất
3. Lưu lại URL Backend: `https://lms-backend-xxxxx.onrender.com`

---

## 🌐 PHẦN 2: TRIỂN KHAI FRONTEND TRÊN VERCEL

### Bước 1: Chuẩn Bị Vercel
1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập hoặc tạo tài khoản
3. Kết nối GitHub account

### Bước 2: Import Project
1. Nhấp "Add New..." → "Project"
2. Chọn repository GitHub
3. Cấu hình:
   - **Project Name**: `lms-frontend` (hoặc tên bạn muốn)
   - **Framework**: Vite
   - **Root Directory**: `FE_LMS` (QUAN TRỌNG!)

### Bước 3: Cấu Hình Build & Development
Vercel sẽ tự động detect:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Development Command**: `npm run dev` (hoặc để trống)

### Bước 4: Cấu Hình Biến Môi Trường
Trong Vercel Dashboard, vào "Settings" → "Environment Variables":

**Production**:
```
VITE_BASE_API=https://lms-backend-xxxxx.onrender.com
VITE_GOOGLE_CLIENT_ID=633098077079-941vf98v7ccl9m6q7utk78ovls09cncv.apps.googleusercontent.com
```

**Preview & Development**:
```
VITE_BASE_API=https://lms-backend-xxxxx.onrender.com
VITE_GOOGLE_CLIENT_ID=633098077079-941vf98v7ccl9m6q7utk78ovls09cncv.apps.googleusercontent.com
```

### Bước 5: Deploy
1. Nhấp "Deploy"
2. Chờ build hoàn tất
3. Lưu lại URL Frontend: `https://lms-frontend-xxxxx.vercel.app`

---

## 🔄 PHẦN 3: CẬP NHẬT CORS & ENVIRONMENT

### Backend (Render)
1. Cập nhật `.env` production:
   - `FRONTEND_URL=https://lms-frontend-xxxxx.vercel.app`
   - `SOCKET_CORS_ORIGIN=https://lms-frontend-xxxxx.vercel.app`

2. Trong [BE_LMS/server.js](BE_LMS/server.js), cập nhật CORS:
```javascript
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "https://lms-frontend-xxxxx.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

3. Push lên GitHub
4. Render sẽ tự động redeploy

### Frontend (Vercel)
Đã cấu hình ở bước trên, sẽ tự động redeploy khi push code.

---

## 📝 PHẦN 4: KIỂM TRA & TROUBLESHOOTING

### Kiểm Tra Backend
```bash
curl https://lms-backend-xxxxx.onrender.com/health
```

### Kiểm Tra Frontend
- Truy cập `https://lms-frontend-xxxxx.vercel.app`
- Mở DevTools → Console để kiểm tra lỗi API
- Kiểm tra Network tab xem request API có đến đúng endpoint không

### Lỗi Thường Gặp

**❌ CORS Error**
- Kiểm tra `FRONTEND_URL` và `SOCKET_CORS_ORIGIN` trong backend
- Đảm bảo frontend có phép truy cập API

**❌ Backend Request Timeout**
- Kiểm tra Render logs: Dashboard → Logs
- Đảm bảo database connection string đúng
- Kiểm tra firewall/network settings trên Render

**❌ Build Error**
- Xem Render Logs hoặc Vercel Logs chi tiết
- Đảm bảo Root Directory đúng
- Kiểm tra node version trong package.json

**❌ Database Connection Error**
- Kiểm tra `MONGODB_URI` đúng
- Đảm bảo IP của Render được whitelist trên MongoDB Atlas
- Kiểm tra database password không có ký tự đặc biệt cần escape

---

## 🔐 PHẦN 5: SECURITY BEST PRACTICES

1. **Không commit .env files**
   - Kiểm tra `.gitignore` chứa `.env`

2. **Sử dụng Strong Secret Keys**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Database Security**
   - Sử dụng MongoDB Atlas với IP whitelist
   - Tạo user riêng cho database
   - Sử dụng strong passwords

4. **API Security**
   - Enable HTTPS (mặc định trên Render/Vercel)
   - Sử dụng rate limiting
   - Validate input dữ liệu

5. **Secret Management**
   - Sử dụng Render Secrets (không hiển thị trong logs)
   - Sử dụng Vercel Environment Variables

---

## 📊 PHẦN 6: MONITORING & LOGS

### Render Logs
- Dashboard → Select Service → Logs tab
- Real-time monitoring

### Vercel Logs
- Dashboard → Select Project → Deployments
- Click deployment → View Logs

### Application Logs
Thêm logging vào backend:
```typescript
console.log(`[${new Date().toISOString()}] Event happened`);
```

---

## 🚀 QUICK DEPLOY CHECKLIST

- [ ] Render account tạo & GitHub connected
- [ ] Vercel account tạo & GitHub connected
- [ ] Backend database URI cấu hình
- [ ] JWT_SECRET được tạo
- [ ] Google OAuth credentials cấu hình
- [ ] MinIO/S3 credentials cấu hình
- [ ] Resend API key cấu hình
- [ ] Backend deployed & URL lưu lại
- [ ] Frontend environment variables cập nhật
- [ ] Frontend deployed & URL lưu lại
- [ ] Backend CORS cập nhật & redeployed
- [ ] CORS errors kiểm tra & fixed
- [ ] Database connection tested
- [ ] End-to-end testing (đăng nhập, upload, etc.)

---

## 💡 TIPS

1. **Local Testing Trước Deploy**
   ```bash
   # Backend
   cd BE_LMS
   npm install
   npm run dev
   
   # Frontend (terminal khác)
   cd FE_LMS
   npm install
   npm run dev
   ```

2. **CI/CD Tự Động**
   - Render & Vercel hỗ trợ automatic deploys khi push to main
   - Cấu hình trong Settings → Deployments

3. **Custom Domain**
   - Render: Settings → Custom Domain
   - Vercel: Settings → Domains

4. **Monitoring & Uptime**
   - Sử dụng Better Uptime (free tier)
   - Monitor Database query performance

---

## 🆘 CẦN GIÚP ĐỠ?

Kiểm tra:
1. Backend logs: `https://dashboard.render.com`
2. Frontend logs: `https://vercel.com/dashboard`
3. Console errors trong browser DevTools
4. Network requests có đến đúng endpoint?

