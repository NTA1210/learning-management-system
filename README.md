# 🎓 Learning Management System (LMS)

[![Node.js Version](https://img.shields.io/badge/node-22.x-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.x-blue.svg)](https://www.typescriptlang.org/)
[![React Version](https://img.shields.io/badge/react-19.x-61dafb.svg)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/express-4.21.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/mongodb-8.x-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind_css-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/socket.io-4.8.x-white.svg)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> An enterprise-grade, cloud-native **Learning Management System (LMS)** designed to streamline and automate academic operations for universities and higher education institutions. Built on a modern full-stack architecture with **Node.js, Express, TypeScript, MongoDB, React 19, Vite, MinIO S3, and Socket.io**.

---

## 📑 Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Key Features](#2-key-features)
- [3. Architecture](#3-architecture)
- [4. Technology Stack](#4-technology-stack)
- [5. Authentication and Authorization](#5-authentication-and-authorization)
- [6. File Storage](#6-file-storage)
- [7. Real-time Communication](#7-real-time-communication)
- [8. XML Quiz Ingestion](#8-xml-quiz-ingestion)
- [9. Automated Testing](#9-automated-testing)
- [10. Local Setup](#10-local-setup)
- [11. Environment Variables](#11-environment-variables)
- [12. Project Structure](#12-project-structure)
- [13. My Contributions](#13-my-contributions)
- [14. License](#14-license)

---

## 1. Project Overview

Traditional academic institutions often struggle with fragmented administrative workflows: paper-based attendance rosters, manual prerequisite checks, unorganized email homework submissions, and data loss during online testing due to network instability.

The **Learning Management System (LMS)** is an all-in-one educational platform engineered to resolve these operational friction points:

*   **Academic Integrity**: Enforces hierarchical academic trees (**Majors $\rightarrow$ Specialists $\rightarrow$ Semesters $\rightarrow$ Subjects**) and validates prerequisite dependencies before allowing student enrollment.
*   **Zero Data-Loss Examinations**: Delivers online quizzes with continuous background **auto-save**, countdown timers, randomized question scramblers, and anti-cheat locks.
*   **Proactive Retention Monitoring**: Features autonomous background cron daemons that track attendance thresholds and automatically dispatch warning emails when absences exceed **20%**.
*   **Real-Time Interactive Classrooms**: Integrates persistent WebSocket messaging, read receipts, and **WebRTC peer-to-peer 1-on-1 video calling**.
*   **Cloud-Native File Pipeline**: Manages lecture assets (PDFs, slides, MP4s, MP3s) and homework submissions via S3-compatible **MinIO** storage with strict 20MB payload protections and secure presigned URLs.

---

## 2. Key Features

The system supports four distinct actor profiles: **Students**, **Teachers**, **Administrators**, and the autonomous **System Cron Daemon**.

### 👤 Student Features
- **Self-Service Enrollment**: Course self-registration with automatic prerequisite validation, section capacity checks, and 1-minute anti-spam cooldown.
- **Interactive Learning**: Stream lecture videos, download lecture notes, and track learning progress (`timeSpentSeconds`, `lastAccessedAt`).
- **Timed Quiz Engine**: Take multi-format quizzes with automatic answer sync (auto-save), instant scoring, and detailed result reviews.
- **Assignment Hub**: Submit essay homework with file attachments, view grades (0–10 scale), and read instructor feedback.
- **Academic Transcripts & Attendance**: Inspect real-time personal attendance histories and comprehensive grade transcripts.
- **Collaboration**: Engage in course discussion forums, author knowledge blogs, participate in live group chats, and launch video calls.
- **Teacher Feedback**: Submit anonymous or public star ratings and qualitative evaluations with screenshot attachments.

### 👨‍🏫 Teacher Features
- **Course & Syllabus Builder**: Create course drafts, organize chapters/lessons, and manage learning materials.
- **Question Banks & Exams**: Manage question pools, import/export questions via XML, scramble randomized quizzes, and adjust scores with manual regrading.
- **Anti-Cheat Monitoring**: Monitor live quiz attempts and ban fraudulent participants in real time.
- **Submission Grading**: Grade essay assignments, provide rich markdown feedback, and view cohort grade distribution histograms.
- **Timetable & Attendance**: Set weekly teaching shifts, mark daily attendance rosters, and export reports in CSV/JSON formats.
- **Communication & Notices**: Publish class-wide announcements and host real-time 1-on-1 office hours via WebRTC video.

### 🛡️ Administrator Features
- **Academic Catalog Management**: Configure Majors, Specialists, Semesters, and Subjects with prerequisite dependency graphs.
- **Course Approval Workflow**: Review course drafts and verify teacher academic specializations before approving courses to `ONGOING` status.
- **Centralized Question Banks**: Import and export subject question banks using standard XML format for cross-campus sharing.
- **User Account Administration**: Manage system-wide users (Student, Teacher, Admin), assign roles, and audit account status.
- **System-Wide Analytics & Moderation**: Monitor attendance trends, enrollment metrics, and moderate flagged feedback.

### ⚙️ System Cron Daemon
- Periodically scans attendance records across all courses.
- Calculates absence percentages against total scheduled sessions.
- Automatically dispatches warning emails via the **Resend API** to students crossing the **20% absence threshold**.

---

## 3. Architecture

The system is built on a decoupled, layered microservices-ready architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             CLIENT TIER                                 │
│  React 19 SPA (Vite) + Tailwind CSS v4 + Zustand + TanStack Query      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / WSS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION TIER                               │
│  Express.js + TypeScript (Modular Layered Architecture)                │
│                                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐ │
│  │    Routes    │──►│  Middleware  │──►│ Controllers  │──►│ Services  │ │
│  │ (REST Endpts)│   │(Auth / RBAC) │   │ (HTTP / Zod) │   │  (Logic)  │ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └─────┬─────┘ │
│                                                                 │       │
│  ┌────────────────────────┐             ┌───────────────────────┤       │
│  │  Socket.io Engine      │             │  Mongoose ORM Models  │       │
│  │  (Chat / WebRTC Signal)│             └───────────┬───────────┘       │
│  └────────────────────────┘                         │                   │
└─────────────────────────────────────────────────────┼───────────────────┘
                                                      │
         ┌───────────────────┬────────────────────────┼───────────────────┐
         ▼                   ▼                        ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────────────┐ ┌────────────────┐
│ MongoDB Cluster │ │ MinIO / S3 Store│ │ Resend Mail API   │ │ Google OAuth   │
│ (Entity Data)   │ │ (Binary Files)  │ │ (Transactional)   │ │ (Social Login) │
└─────────────────┘ └─────────────────┘ └───────────────────┘ └────────────────┘
```

### Layer Breakdown
1. **Presentation Layer (Frontend)**: React 19 Single Page Application providing fluid user interfaces, real-time socket connections, and interactive analytics charts.
2. **Routing & Security Layer**: Express.js routers paired with `authenticate` (JWT cookie verification) and `authorize` (Role-Based Access Control) middleware.
3. **Business Logic Layer**: Encapsulated service classes managing transactional business logic, domain rules, and data integrity checks.
4. **Data Persistence Layer**: Mongoose schemas and compound indexes interfacing with MongoDB.
5. **Real-time Layer**: Socket.io engine managing WebSocket rooms, event dispatching, and WebRTC peer signaling.
6. **External Integrations**: MinIO S3 for asset streaming, Resend for email notifications, and Google OAuth 2.0.

---

## 4. Technology Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Node.js | `v22.x` | High-performance asynchronous JavaScript runtime |
| **Backend Language** | TypeScript | `v5.9.x` | Strongly typed server development |
| **Backend Framework** | Express.js | `v4.21.x` | RESTful API server routing & middleware pipeline |
| **Database** | MongoDB & Mongoose | `v8.2.x` | NoSQL document database with strict schema validation |
| **Frontend Framework** | React | `v19.2.x` | Modern reactive user interface library |
| **Frontend Build Tool** | Vite | `v7.1.x` | Next-generation fast frontend bundler |
| **Styling & Icons** | Tailwind CSS / Lucide | `v4.1.x` | Utility-first CSS engine & modern vector icons |
| **State Management** | Zustand & Jotai | `v5.0.x` | Client-side reactive and atomic state management |
| **Server State** | TanStack React Query | `v5.90.x` | Asynchronous query caching, retries, and hydration |
| **Real-time Engine** | Socket.io / Socket.io-client| `v4.8.x` | Bi-directional WebSockets & WebRTC signaling |
| **Object Storage** | MinIO SDK (S3-compatible) | `v8.0.x` | Cloud binary file uploads and presigned URL streaming |
| **File Middleware** | Multer | `v2.0.x` | Multipart form-data handling with 20MB size limits |
| **Validation** | Zod | `v4.1.x` | Type-safe schema validation for HTTP payloads |
| **Authentication** | JWT & bcrypt | `v9.0.x / v5.1.x` | Stateless token sessions & password hashing |
| **Social Login** | Google Auth Library | `v10.7.x` | Google OAuth 2.0 token verification |
| **Email Delivery** | Resend API | `v6.2.x` | Transactional email delivery for OTPs and alerts |
| **XML Processing** | xml2js & xmlbuilder2 | `v0.6.x / v4.0.x`| Question bank XML parsing and generation |
| **3D & Visualization**| Three.js / Recharts | `v0.180 / v3.3` | 3D visual experiences & data analytics charts |
| **Testing** | Jest & Supertest | `v30.x / v7.x` | Automated unit, controller, and integration testing |
| **In-Memory DB** | mongodb-memory-server | `v10.2.x` | Isolated in-memory MongoDB instances for tests |

---

## 5. Authentication and Authorization

The platform utilizes a multi-layered, stateless authentication and authorization architecture:

```
User (Browser)               Express Backend              MongoDB / Google
     │                              │                            │
     │── 1. Credentials / Google ──►│                            │
     │                              │── 2. Validate / Hash ─────►│
     │                              │◄── User Record & Role ─────│
     │                              │                            │
     │                              │── 3. Generate Access &     │
     │                              │      Refresh JWTs          │
     │◄── 4. Set HttpOnly Cookies ──│                            │
     │    (accessToken, refreshToken│                            │
     │                              │                            │
     │── 5. Subsequent Requests ───►│                            │
     │    (with Cookie Header)      │── 6. authenticate()        │
     │                              │      authorize([Role])     │
     │◄── 7. JSON Response ─────────│── 7. Execute Controller ───│
```

### Key Security Safeguards
1. **Stateless JWT in HTTP-Only Cookies**: Access tokens and Refresh tokens are stored strictly in `httpOnly`, `secure`, `sameSite: strict/lax` cookies. JavaScript running in the browser cannot read the tokens, mitigating Cross-Site Scripting (XSS) token theft.
2. **Email OTP Verification**: Registration and password recovery flows require 6-digit verification OTP codes delivered via Resend.
3. **Google OAuth 2.0 Integration**: Supports single-sign-on (SSO) with server-side ID token verification via `google-auth-library`.
4. **Role-Based Access Control (RBAC)**: Route-level middleware enforces granular role separation:
   - `authenticate`: Validates JWT signature, checks token expiration, and attaches the authenticated `user` object to the request context.
   - `authorize([Role.ADMIN, Role.TEACHER, Role.STUDENT])`: Restricts endpoint execution exclusively to authorized roles.

---

## 6. File Storage

File asset management is powered by an S3-compatible **MinIO Object Storage** service.

```
┌─────────────────┐       FormData       ┌──────────────────┐       Stream (UUID)      ┌──────────────────┐
│  Client Browser ├─────────────────────►│  Multer (BE_LMS) ├────────────────────────►│  MinIO S3 Bucket │
│  (Upload File)  │  (Max 20MB ceiling)  │  (Validate MIME) │                          │  (Store Binary)  │
└─────────────────┘                      └────────┬─────────┘                          └──────────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │ MongoDB Database │
                                         │ (File URL & Meta)│
                                         └──────────────────┘
```

### Storage Capabilities
*   **Security & Quota Protections**: Multer middleware enforces a strict **20MB size ceiling** per file across all endpoints, blocking buffer overflow and denial-of-service attempts.
*   **MIME Type Whitelisting**: Restricts uploads to verified formats:
    - Documents & Notes: `.pdf`, `.docx`, `.pptx`, `.txt`
    - Media Lectures: `.mp4`, `.mp3`, `.webm`
    - Profile Avatars & Feedback: `.png`, `.jpg`, `.jpeg`, `.webp`
*   **Unique File Names**: All uploaded files are hashed using UUID v4 to prevent file name collisions.
*   **Secure Access**: Protected documents are distributed using time-limited **Presigned URLs**, while public assets use CDN-accelerated URLs.

---

## 7. Real-time Communication

Real-time capabilities are orchestrated using **Socket.io v4** for low-latency event synchronization and peer coordination.

### 1. Instant Messaging & Chat Rooms
- **Room-Based Isolation**: Direct 1-on-1 chats and course group channels (`ChatRoom` collection).
- **Persistent History**: Chat messages and attachments are persisted to MongoDB while being broadcast to connected room members.
- **Seen Status & Typing Indicators**: Instant feedback showing participant read receipts and active typing events.

### 2. WebRTC Video Classroom Signaling
- Socket.io serves as the signaling plane for WebRTC 1-on-1 live video classrooms.
- Manages peer handshake exchanges:
  - `offer`: Caller dispatches SDP offer metadata through the socket hub.
  - `answer`: Callee accepts and transmits SDP answer metadata.
  - `ice-candidate`: Exchanges Network ICE candidates for NAT traversal and peer connection establishment.

```
Peer A (Teacher)                    Socket.io Gateway                   Peer B (Student)
      │                                    │                                    │
      │── 1. Video Call Invite ───────────►│── Forward Call Event ─────────────►│
      │                                    │                                    │
      │── 2. Send SDP Offer ──────────────►│── Forward SDP Offer ──────────────►│
      │                                    │◄── 3. Send SDP Answer ─────────────│
      │◄── Forward SDP Answer ─────────────│                                    │
      │                                    │                                    │
      │── 4. ICE Candidates ──────────────►│── Forward ICE Candidates ─────────►│
      │                                    │                                    │
      │◄══════════════════════ 5. Direct WebRTC P2P Media Stream ══════════════►│
```

---

## 8. XML Quiz Ingestion

To facilitate curriculum sharing and question migration, the platform provides a standardized **XML Import & Export Engine** (`xml2js` / `xmlbuilder2`).

### Supported XML Schema Format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz subjectCode="SWE201">
  <question type="single_choice" difficulty="medium">
    <content>What design pattern ensures a class has only one instance?</content>
    <options>
      <option isCorrect="true">Singleton Pattern</option>
      <option isCorrect="false">Factory Pattern</option>
      <option isCorrect="false">Observer Pattern</option>
      <option isCorrect="false">Decorator Pattern</option>
    </options>
    <explanation>Singleton restricts instantiation to a single object.</explanation>
  </question>
  <question type="multiple_choice" difficulty="hard">
    <content>Which of the following are HTTP safe methods?</content>
    <options>
      <option isCorrect="true">GET</option>
      <option isCorrect="true">HEAD</option>
      <option isCorrect="false">POST</option>
      <option isCorrect="false">DELETE</option>
    </options>
    <explanation>GET and HEAD are idempotent and safe.</explanation>
  </question>
</quiz>
```

### Ingestion Features
- **Batch Processing**: Administrators and teachers can upload thousands of questions across multiple subjects in seconds (`POST /quiz-questions/import`).
- **Data Validation**: Sanitizes and verifies XML node integrity, options count, and correct answer flags before writing to MongoDB.
- **Export & Migration**: Generates downloadable XML archives of question pools by subject (`GET /quiz-questions/export/:subjectId`).
- **Randomized Exam Generation**: Teachers can generate randomized quizzes by specifying subject IDs, difficulty ratios, and question counts (`GET /quiz-questions/random`).

---

## 9. Automated Testing

The backend includes a comprehensive automated test suite powered by **Jest**, **ts-jest**, **Supertest**, and **mongodb-memory-server**.

### Test Suite Structure
```
BE_LMS/src/__tests__/
├── controller/          # Controller HTTP response & validation tests
│   ├── auth.controller.test.ts
│   ├── course.controller.test.ts
│   ├── quiz.controller.test.ts
│   ├── assignment.controller.test.ts
│   ├── attendance.controller.test.ts
│   └── ...
├── service/             # Pure business logic unit tests
│   ├── auth.service.test.ts
│   ├── course.service.test.ts
│   ├── enrollment.service.test.ts
│   ├── quizAttempt.service.test.ts
│   └── ...
├── integration/         # Multi-layer integration & API flow tests
│   └── user.test.ts
└── helpers/             # Helper function tests
```

### Running Tests
```bash
# Navigate to backend
cd BE_LMS

# Run all test suites
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific module tests
npm test -- src/__tests__/controller/quiz.controller.test.ts
```

> [!NOTE]
> All tests utilize `mongodb-memory-server`, creating isolated in-memory MongoDB instances. No external database connection is required to run tests.

---

## 10. Local Setup

### Prerequisites
- **Node.js**: `v22.x` or later
- **npm**: `v10.x` or later
- **MongoDB**: Local instance or MongoDB Atlas account
- **MinIO**: Local MinIO instance (or Cloudflare R2 / AWS S3)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/NTA1210/learning-management-system.git
cd learning-management-system
```

---

### Step 2: Backend Setup (`BE_LMS`)
```bash
cd BE_LMS

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# (Optional) Seed initial demo data
npx ts-node src/scripts/initData.ts

# Start development server (Port 4004)
npm run dev
```

---

### Step 3: Frontend Setup (`FE_LMS`)
```bash
# Open a new terminal
cd FE_LMS

# Install dependencies
npm install

# Configure environment variables
cp .env.development .env

# Start Vite development server (Port 5173)
npm run dev
```

---

### Step 4: Access Application
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:4004`
- **Default Seed Accounts** (if `initData.ts` was executed):
  - **Admin**: `admin1@example.com` / `123456`
  - **Teacher**: `teacher1@example.com` / `123456`
  - **Student**: `student1@example.com` / `123456`

---

## 11. Environment Variables

### Backend (`BE_LMS/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `4004` |
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `APP_ORIGIN` | Allowed client origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/lms_db` |
| `JWT_SECRET` | Secret key for signing access tokens | `your_jwt_access_secret_32_bytes` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | `your_jwt_refresh_secret_32_bytes` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Google OAuth Client Secret | `GOCSPX-xxxx` |
| `MINIO_ENDPOINT` | MinIO server host | `localhost` / `minio.example.com` |
| `MINIO_PORT` | MinIO server port | `9000` |
| `MINIO_USE_SSL` | Enable SSL for MinIO | `false` / `true` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET_NAME`| Default S3 bucket name | `lms-files` |
| `PUBLIC_FILE_BASE_URL`| Public CDN / direct asset URL | `http://localhost:9000/lms-files` |
| `RESEND_API_KEY` | Resend Mailer API key | `re_123456789` |
| `EMAIL_SENDER` | Sender email address | `onboarding@resend.dev` |

### Frontend (`FE_LMS/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_BASE_API` | Backend API base endpoint | `http://localhost:4004` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxx.apps.googleusercontent.com` |

---

## 12. Project Structure

```
learning-management-system/
├── README.md                      # Root documentation
├── ARCHITECTURE_DIAGRAM.md        # Detailed deployment diagrams & data flows
├── DEPLOYMENT_GUIDE.md            # Render & Vercel deployment walkthrough
├── DEPLOYMENT_CHECKLIST.md        # Pre-flight and post-deployment checklist
├── SECURITY_SETUP.md              # Security policies & secret key best practices
├── document/                      # Architectural reports & specification docs
│   ├── actor_descriptions.md      # System actors & external systems breakdown
│   ├── functional_requirements.md # Functional screen flows & use cases
│   ├── lms_code_packages.md       # Package architecture & dependency matrix
│   ├── lms_context_diagram.md     # Level-0 Context Diagram & data flows
│   ├── lms_user_stories_audit.md  # 74 User Stories codebase audit
│   ├── non_functional_requirements.md
│   ├── product_overview.md
│   ├── report_1_project_introduction.md
│   ├── report_2_project_management_plan.md
│   ├── table_descriptions.md      # Database collection schemas
│   ├── usecase_descriptions.md    # Use case catalogue
│   └── usecase_diagrams.md        # Mermaid UML Use Case diagrams
│
├── BE_LMS/                        # Backend (ExpressJS + TypeScript)
│   ├── src/
│   │   ├── config/                # Database, MinIO, Multer, Resend configs
│   │   ├── constants/             # Enums, HTTP codes, Env loaders
│   │   ├── controller/            # 20+ Express controllers
│   │   ├── middleware/            # authenticate, authorize, errorHandler, rateLimiter
│   │   ├── models/                # 20+ Mongoose schemas & indexes
│   │   ├── routes/                # Express API route modules
│   │   ├── services/              # Core business logic implementations
│   │   ├── socket/                # Socket.io chat & WebRTC video signaling
│   │   ├── types/                 # Global TypeScript definitions
│   │   ├── utils/                 # Email, S3, Token helpers & assertions
│   │   ├── validators/            # Zod input validation schemas
│   │   ├── __tests__/             # Jest unit, controller & service test suites
│   │   ├── app.ts                 # Express application bootstrap
│   │   └── index.ts               # HTTP & Socket.io server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── render.yaml                # Render deployment configuration
│
└── FE_LMS/                        # Frontend (React 19 + Vite + Tailwind CSS v4)
    ├── src/
    │   ├── assets/                # Static graphics and icons
    │   ├── components/            # Reusable UI component library
    │   ├── context/               # Global React contexts
    │   ├── hooks/                 # Custom React hooks
    │   ├── layouts/               # Role-based layout wrappers
    │   ├── pages/                 # Page views (Auth, Courses, Quizzes, Chat, etc.)
    │   ├── services/              # Axios HTTP client & API bindings
    │   ├── store/                 # Zustand & Jotai global state stores
    │   ├── types/                 # Frontend TypeScript interfaces
    │   ├── utils/                 # Formatters, DOMPurify, helpers
    │   ├── App.tsx                # App root & React Router v7 routes
    │   └── main.tsx               # Client DOM entry point
    ├── package.json
    ├── vite.config.ts
    └── index.html
```

---

## 13. My Contributions

As a full-stack engineer on this project, key contributions include:

*   **System Architecture & API Design**: Designed the modular layered backend architecture (Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Models), establishing 70+ RESTful endpoints with Zod payload validation.
*   **Security & Session Management**: Engineered the stateless authentication system using dual JWT tokens stored in HTTP-Only, Secure cookies and integrated Google OAuth 2.0.
*   **Academic Validation Engine**: Implemented the prerequisite subject validation graph, preventing unauthorized course registrations, alongside a 1-minute anti-spam enrollment cooldown.
*   **Resilient Quiz Examination Engine**: Designed the quiz subsystem with background auto-saving of answers, countdown timer synchronization, anti-cheat locks, and manual teacher regrading.
*   **XML Question Ingestion Engine**: Built the bulk XML import and export pipeline (`xml2js` / `xmlbuilder2`) for question banks and randomized question scramblers.
*   **Real-time Collaboration & WebRTC**: Developed Socket.io chat rooms with read receipts and established the WebRTC signaling plane for peer-to-peer 1-on-1 video calling.
*   **Automated Background Cron**: Implemented `node-cron` daemons to calculate student attendance ratios and automatically dispatch warning notifications via Resend when absences exceed 20%.
*   **Object Storage Pipeline**: Integrated MinIO S3 SDK with Multer to stream and store lecture assets (PDF, MP4, MP3) and homework files with a strict 20MB limit.
*   **Automated Test Suites**: Authored unit, controller, and integration tests across services and endpoints using Jest and `mongodb-memory-server`.
*   **Responsive Frontend Application**: Developed responsive, accessible user interfaces using React 19, Tailwind CSS v4, Zustand, and TanStack React Query.

---

## 14. License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
