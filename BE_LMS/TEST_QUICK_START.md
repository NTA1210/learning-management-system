# ⚡ Quick Start - Testing Backend APIs

Quick guide for running and testing backend endpoints.

---

## 🚀 Step 1: Preparation

### 1.1. Run backend development server:
```bash
cd BE_LMS
npm run dev
```

### 1.2. Seed initial test data (optional):
```bash
npx ts-node src/scripts/initData.ts
```

This populates default accounts:
- Admin: `admin1@example.com` / `123456`
- Teacher: `teacher1@example.com` / `123456`
- Student: `student1@example.com` / `123456`
- Sample courses, subjects, and lessons

---

## 🧪 Step 2: Testing with Postman or Thunder Client

### Option 1: Import Postman Collection
1. Open Postman or Thunder Client (VS Code extension).
2. Import `postman.json`.
3. Set environment variables:
   - `base_url`: `http://localhost:4004`
   - `admin_email`: `admin1@example.com`
   - `admin_password`: `123456`

### Option 2: Manual Testing Flow

#### Step 1: Login to acquire session token / cookies
```http
POST http://localhost:4004/auth/login
Content-Type: application/json

{
  "email": "admin1@example.com",
  "password": "123456"
}
```

#### Step 2: Test Endpoints

**1. List all lessons:**
```http
GET http://localhost:4004/lesson/listAllLessons?page=1&limit=10
Cookie: accessToken=YOUR_TOKEN_HERE
```

**2. List lessons by course:**
```http
GET http://localhost:4004/lesson/byCourse/YOUR_COURSE_ID
Cookie: accessToken=YOUR_TOKEN_HERE
```

**3. Get lesson details:**
```http
GET http://localhost:4004/lesson/getLessonById/YOUR_LESSON_ID
Cookie: accessToken=YOUR_TOKEN_HERE
```

**4. Create lesson (Teacher / Admin):**
```http
POST http://localhost:4004/lesson/createLessons
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "title": "Introduction to TypeScript",
  "courseId": "YOUR_COURSE_ID",
  "content": "Lesson markdown or rich text content here",
  "order": 1,
  "durationMinutes": 45
}
```

**5. Update lesson:**
```http
PUT http://localhost:4004/lesson/updateLessons/YOUR_LESSON_ID
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "title": "Advanced TypeScript Patterns",
  "durationMinutes": 60
}
```

**6. Delete lesson:**
```http
DELETE http://localhost:4004/lesson/deleteLessons/YOUR_LESSON_ID
Cookie: accessToken=YOUR_TOKEN_HERE
```

---

## 🧪 Step 3: Automated Testing with Jest

The backend uses **Jest**, **ts-jest**, **Supertest**, and **mongodb-memory-server** for zero-dependency isolated database testing.

### Run all tests:
```bash
npm test
```

### Run specific test suites:
```bash
# Run controller tests
npm test -- src/__tests__/controller/

# Run service tests
npm test -- src/__tests__/service/

# Run integration tests
npm test -- src/__tests__/integration/

# Run specific file with coverage
npm test -- --coverage src/__tests__/service/course.service.test.ts
```

---

## 📋 Key Test Scenarios

### Authentication & Permissions
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Forbidden role actions return `403 Forbidden`.
- [x] Students cannot access draft courses or administrative management endpoints.

### Input Validation
- [x] Missing mandatory fields return `400 Bad Request` with Zod validation details.
- [x] Invalid UUIDs or Mongo ObjectIDs return `400 Bad Request`.

### Data Integrity & Edge Cases
- [x] Duplicate unique fields return `409 Conflict`.
- [x] Deleted or nonexistent records return `404 Not Found`.
