# LMS Backend (BE_LMS)

Robust REST API and Real-Time WebSocket server for the Learning Management System (LMS), built with **Node.js**, **Express**, and **TypeScript**.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime & Language**: Node.js (v22.x), TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Communication**: Socket.io (WebSocket for chat & WebRTC video signaling)
- **Object Storage**: MinIO / S3 SDK for file uploads
- **Authentication**: JWT, bcrypt, Google OAuth 2.0, HTTP-Only Cookies
- **Email Delivery**: Resend Mail API
- **XML Processing**: xml2js, xmlbuilder2
- **Validation**: Zod
- **Testing**: Jest, Supertest, mongodb-memory-server

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `BE_LMS/` (or copy `.env.example`):
```ini
PORT=4004
NODE_ENV=development
APP_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/lms_db
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=lms-files
RESEND_API_KEY=re_your_api_key
EMAIL_SENDER=noreply@example.com
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm start
```
