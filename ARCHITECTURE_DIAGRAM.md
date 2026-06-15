# 🏗️ DEPLOYMENT ARCHITECTURE & FLOW

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET USERS                                   │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │   VERCEL     │      │   VERCEL     │
        │  (Frontend)  │      │   (Static)   │
        │ lms-frontend │      │   Cache CDN  │
        │  .vercel.app │      │              │
        └──────┬───────┘      └──────┬───────┘
               │                     │
               └──────────┬──────────┘
                          │
                ┌─────────┴──────────┐
                │ HTTPS Connection   │
                │ (REST API calls)   │
                ▼                    │
        ┌──────────────────────┐    │
        │ RENDER (Backend)     │    │
        │ Web Service          │◄───┘
        │ lms-backend          │
        │ .onrender.com        │
        │                      │
        │ ┌─────────────────┐  │
        │ │ Express Server  │  │
        │ │ Socket.IO       │  │
        │ │ API Routes      │  │
        │ └────────┬────────┘  │
        └──────────┼───────────┘
                   │
      ┌────────────┼────────────┬─────────────┐
      │            │            │             │
      ▼            ▼            ▼             ▼
  ┌────────┐ ┌──────────┐ ┌────────┐  ┌──────────┐
  │MongoDB │ │ MinIO/S3 │ │Resend  │  │ Google   │
  │ Atlas  │ │ Storage  │ │ Email  │  │ OAuth    │
  │        │ │          │ │        │  │          │
  │ lms_db │ │ Files    │ │ SMTP   │  │ Sign-in  │
  │        │ │ Buckets  │ │        │  │          │
  └────────┘ └──────────┘ └────────┘  └──────────┘
```

---

## Data Flow Diagram

### User Login Flow
```
┌─────────────────┐
│  User Browser   │
│  (React App)    │
└────────┬────────┘
         │
         │ 1. Click "Login with Google"
         ▼
    ┌─────────────────────┐
    │ Google OAuth 2.0    │
    │ (Consent Screen)    │
    └────────┬────────────┘
             │
             │ 2. User authorizes
             ▼
    ┌──────────────────────────┐
    │ Render Backend           │
    │ POST /api/auth/google    │
    │ (Exchange code for token)│
    └────────┬─────────────────┘
             │
             │ 3. Verify token with Google
             ▼
    ┌──────────────────────────┐
    │ Google Verification      │
    └────────┬─────────────────┘
             │
             │ 4. Valid → Create JWT
             ▼
    ┌──────────────────────────┐
    │ MongoDB Store User       │
    │ + Create JWT Token       │
    └────────┬─────────────────┘
             │
             │ 5. Return JWT to Frontend
             ▼
    ┌──────────────────────────┐
    │ Frontend Store JWT       │
    │ + Set Authorization      │
    │ Header                   │
    └────────┬─────────────────┘
             │
             │ 6. Authenticated API Calls
             ▼
    ┌──────────────────────────┐
    │ Protected Routes         │
    │ (with JWT validation)    │
    └──────────────────────────┘
```

### File Upload Flow
```
┌─────────────────┐
│ User selects    │
│ file in browser │
└────────┬────────┘
         │
         │ FormData with file
         ▼
┌──────────────────────────┐
│ Render Backend           │
│ POST /api/upload         │
│ (Multer middleware)      │
└────────┬─────────────────┘
         │
         │ Validate file
         ▼
┌──────────────────────────┐
│ MinIO / S3               │
│ PUT object               │
│ (Binary upload)          │
└────────┬─────────────────┘
         │
         │ File stored
         ▼
┌──────────────────────────┐
│ MongoDB Store            │
│ File metadata + URL      │
└────────┬─────────────────┘
         │
         │ Return URL to Frontend
         ▼
┌──────────────────────────┐
│ Frontend                 │
│ Display file in UI       │
└──────────────────────────┘
```

### Real-time Communication (Socket.IO)
```
┌──────────────┐
│ User A       │
│ Browser 1    │
└──────┬───────┘
       │ WebSocket
       │ (persistent)
       ▼
┌──────────────────────────┐
│ Render Backend           │
│ Socket.IO Server         │
│ Message broadcast        │
└──────┬───────────────────┘
       │
       │ Broadcast to room
       ▼
┌──────────────┐
│ User B       │
│ Browser 2    │
└──────────────┘
```

---

## Environment Configuration Flow

```
┌─────────────────────────────────────────────────┐
│ Developer Local Machine                         │
├─────────────────────────────────────────────────┤
│ .env (NOT COMMITTED)                            │
│ ├─ MONGO_URI=mongodb://localhost:27017          │
│ ├─ JWT_SECRET=dev_secret_123                    │
│ └─ PORT=4004                                    │
└──────┬──────────────────────────────────────────┘
       │
       │ git push (only code, not .env)
       ▼
┌────────────────────────────────────────────────┐
│ GitHub Repository                              │
├────────────────────────────────────────────────┤
│ .env.example (template)                        │
│ .env.development (safe defaults)               │
│ src/ (application code)                        │
└──────┬────────────┬─────────────────────────────┘
       │            │
       │ Webhook    │ Webhook
       ▼            ▼
┌──────────────┐  ┌────────────────┐
│ Render Build │  │ Vercel Build   │
├──────────────┤  ├────────────────┤
│ Environment  │  │ Environment    │
│ Variables:   │  │ Variables:     │
│ ├─ MONGO_URI │  │ ├─ VITE_BASE   │
│ ├─ JWT_SEC   │  │ │   _API       │
│ ├─ PORT      │  │ └─ VITE_GOOGLE │
│ └─ ...       │  │    _CLIENT_ID  │
└──────┬───────┘  └────────┬───────┘
       │                   │
       │                   │
       ▼                   ▼
┌──────────────────┐  ┌────────────────┐
│ Production       │  │ Production     │
│ Backend Service  │  │ Frontend CDN   │
│ (Running)        │  │ (Distributed)  │
└──────────────────┘  └────────────────┘
```

---

## Request/Response Cycle (Example: Login)

```
Browser                    Render Backend        MongoDB
   │                            │                  │
   │─ POST /api/login ─────────→│                  │
   │   (email, password)        │                  │
   │                            │─ Find user ────→│
   │                            │←─ User data ────│
   │                            │                  │
   │                            │─ Hash password   │
   │                            │  (bcrypt)        │
   │                            │                  │
   │                            │─ Compare hashes  │
   │                            │  (valid?)        │
   │                            │                  │
   │                            │─ Create JWT     │
   │                            │  + JWT_SECRET   │
   │                            │                  │
   │←─ 200 OK ────────────────←│                  │
   │   { token, user }          │                  │
   │                            │                  │
   │- Store JWT in localStorage │                  │
   │                            │                  │
   │─ GET /api/dashboard ──────→│                  │
   │   Headers: Authorization   │                  │
   │   Bearer <token>           │                  │
   │                            │- Verify JWT    │
   │                            │- Extract userId │
   │                            │                  │
   │                            │─ Get user data ─→│
   │                            │←─ Dashboard data │
   │                            │                  │
   │←─ 200 OK ────────────────←│                  │
   │   { courses, stats }       │                  │
   │                            │                  │
```

---

## Database Schema Overview

```
MongoDB Collections:

users
├─ _id
├─ email
├─ password (hashed)
├─ name
├─ role
└─ createdAt

courses
├─ _id
├─ name
├─ description
├─ instructor_id (ref: users)
└─ createdAt

enrollments
├─ _id
├─ user_id (ref: users)
├─ course_id (ref: courses)
└─ enrolledAt

lessons
├─ _id
├─ course_id (ref: courses)
├─ title
├─ content
└─ order

materials
├─ _id
├─ lesson_id (ref: lessons)
├─ file_url (MinIO)
├─ file_name
└─ uploadedAt

assignments
├─ _id
├─ lesson_id (ref: lessons)
├─ title
├─ dueDate
└─ maxPoints

submissions
├─ _id
├─ assignment_id (ref: assignments)
├─ user_id (ref: users)
├─ file_url (MinIO)
└─ submittedAt

etc...
```

---

## Environment Secrets Map

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCTION ENVIRONMENT MATRIX                               │
├─────────────────────────┬───────────────────────────────────┤
│ Secret Name             │ Storage Location                  │
├─────────────────────────┼───────────────────────────────────┤
│ MONGO_URI               │ Render → Environment              │
│ JWT_SECRET              │ Render → Environment              │
│ JWT_REFRESH_SECRET      │ Render → Environment              │
│ GOOGLE_CLIENT_ID        │ Render → Environment              │
│ GOOGLE_CLIENT_SECRET    │ Render → Environment              │
│ MINIO_ACCESS_KEY        │ Render → Environment              │
│ MINIO_SECRET_KEY        │ Render → Environment              │
│ RESEND_API_KEY          │ Render → Environment              │
│ EMAIL_SENDER            │ Render → Environment              │
│ APP_ORIGIN              │ Render → Environment              │
├─────────────────────────┼───────────────────────────────────┤
│ VITE_BASE_API           │ Vercel → Environment Variables   │
│ VITE_GOOGLE_CLIENT_ID   │ Vercel → Environment Variables   │
└─────────────────────────┴───────────────────────────────────┘

❌ NEVER STORE IN:
  - .env files (locally)
  - Code files
  - Git repository
  - Console logs
  - Render/Vercel logs (sensitive ones)
```

---

## Deployment Timeline

```
Day 1: Setup (2-3 hours)
├─ Create MongoDB Atlas cluster
├─ Setup Google OAuth credentials
├─ Create MinIO/S3 bucket
├─ Create Resend account
└─ Generate JWT secrets

Day 1-2: Deploy Backend (30-60 min)
├─ Push code to GitHub
├─ Create Render web service
├─ Add all environment variables
├─ Wait for build & deployment
├─ Test API endpoints
└─ Get backend URL

Day 2: Deploy Frontend (30-45 min)
├─ Update environment with backend URL
├─ Push code to GitHub
├─ Create Vercel project
├─ Add environment variables
├─ Wait for build & deployment
├─ Test frontend loading
└─ Get frontend URL

Day 2: Final Configuration (15-30 min)
├─ Update backend CORS with frontend URL
├─ Update Google OAuth URLs
├─ Test cross-service communication
├─ Verify login flows
└─ Full end-to-end testing

Total: ~2-3 hours of setup + waiting time
```

---

## Monitoring & Health Checks

```
Continuous Monitoring:

┌─────────────────────────┐
│ Render Backend Health   │
├─────────────────────────┤
│ • Logs tab              │ → Check for errors
│ • Metrics tab           │ → CPU, Memory, Requests
│ • Real-time monitoring  │ → Live status
└─────────────────────────┘

┌─────────────────────────┐
│ Vercel Frontend Health  │
├─────────────────────────┤
│ • Deployments tab       │ → Build status
│ • Analytics tab         │ → Page loads, errors
│ • Runtime logs          │ → Edge function issues
└─────────────────────────┘

┌─────────────────────────┐
│ Database Health         │
├─────────────────────────┤
│ • MongoDB Atlas UI      │ → Connection status
│ • Query metrics         │ → Performance
│ • Storage usage         │ → Quota
└─────────────────────────┘
```

---

## Architecture Summary

| Layer | Technology | Host | Purpose |
|-------|-----------|------|---------|
| **Client** | React 19 + Vite | Vercel CDN | User interface |
| **API** | Express + TypeScript | Render | Business logic |
| **Database** | MongoDB | MongoDB Atlas | Data persistence |
| **Storage** | MinIO/S3 | Your storage | File management |
| **Email** | Resend | Resend API | Notifications |
| **Auth** | JWT + Google OAuth | Render | User authentication |
| **Real-time** | Socket.IO | Render | Live updates |

---

This architecture provides:
- ✅ High availability (CDN distribution)
- ✅ Automatic scaling (Render/Vercel auto-scale)
- ✅ Security (HTTPS, JWT, OAuth)
- ✅ Performance (CDN, connection pooling)
- ✅ Reliability (Managed services)

