# Analysis of Alignment: User Stories & Context Diagram

This document provides a detailed coverage and alignment analysis between the **74 User Stories** (validated in the codebase) and the **System Context Diagram**.

---

## 1. Completeness of User Stories

The 74 User Stories represent complete, 100% coverage of the current operational capabilities of the LMS platform:
*   Every functional interaction in the Context Diagram is backed by corresponding User Stories.
*   Every API route, validation schema, and data entity in the codebase maps directly to one or more User Stories.
*   All security mechanisms (anti-spam enrollment cooldown, teacher specialization constraints, quiz attempt auto-saves, absence threshold warnings) are documented in detail.

---

## 2. Mapping: Context Diagram Entities $\leftrightarrow$ User Stories

The table below illustrates how **Actors** and **External Systems** in the Context Diagram interact through user story flows:

### 👤 Actor 1: Student
| Information Flow in Context Diagram | Corresponding User Stories | Codebase Implementation Status |
| :--- | :--- | :--- |
| **Registration / Login / Password Recovery** | **US-001, US-002, US-003, US-004** | Implemented with stateless JWT in HTTP-Only cookies, 6-digit email OTP verification via Resend. |
| **Course Enrollment & Joining** | **US-006, US-029, US-057** | Self-enrollment with prerequisite validation, class section capacity limits, 1-minute anti-spam cooldown, or instant token invite. |
| **Lesson Study & Materials Access** | **US-007, US-022, US-023** | Lesson content viewing, time-on-task accumulation (`timeSpentSeconds`), and last access tracking (`lastAccessedAt`). |
| **Assignment Submissions & Transcripts** | **US-011, US-020** | Homework submissions with file attachments via MinIO S3, comprehensive personal transcript viewing. |
| **Quiz Examination** | **US-074** | Timed test examinations with background auto-save mechanism for resilient data protection against network interruptions. |
| **Timetable & Attendance Tracking** | **US-082** | Personal schedule dashboard and historical attendance record lookup. |
| **Discussions & Real-time Collaboration** | **US-021, US-069** | Multi-level forum threads with file uploads; real-time chat and 1-on-1 WebRTC video calling. |
| **Course & Teacher Feedback** | **US-048, US-050, US-054** | Star rating evaluations, public or anonymous feedback comments with screenshot attachments. |

---

### 👤 Actor 2: Teacher
| Information Flow in Context Diagram | Corresponding User Stories | Codebase Implementation Status |
| :--- | :--- | :--- |
| **Course & Syllabus Management** | **US-005, US-089** | Course creation in `DRAFT` status pending approval, syllabus management, class completion status, and enrollment statistics. |
| **Curriculum & Lesson Materials** | **US-012, US-013** | Chapter/lesson creation, uploading lecture assets (PDF, MP4, MP3, slides) to MinIO S3 storage. |
| **Quiz Banks & Exam Administration** | **US-016, US-018, US-046, US-059, US-065, US-066, US-068, US-070, US-071, US-072** | Question bank filtering, randomized question scrambler, anti-cheat ban actions, manual re-grading, and score distribution charts. |
| **Assignments & Essay Grading** | **US-008, US-010, US-019, US-047, US-073** | Homework prompts with deadlines, submission evaluation with numeric grading and markdown feedback remarks. |
| **Schedules & Daily Attendance** | **US-045, US-079, US-080, US-081, US-083, US-084, US-085, US-086, US-087, US-088** | Teaching slot booking, daily attendance logging, CSV/JSON report exports, and automated absence warning triggers. |
| **Announcements & Chat** | **US-069, US-075, US-076, US-077, US-078** | Course-wide notices, broadcast bulletins, and direct real-time communication with students. |
| **Student Reviews Review** | **US-053** | Aggregated star ratings and student feedback inspection to facilitate teaching quality improvement. |

---

### 👤 Actor 3: Administrator (Admin)
| Information Flow in Context Diagram | Corresponding User Stories | Codebase Implementation Status |
| :--- | :--- | :--- |
| **Course Approval & Specialization Validation** | **US-031b** | Verifying teacher specialization against subject criteria before approving courses to `ONGOING` status. |
| **Academic Catalog & Prerequisites** | **US-024, US-060, US-061, US-062, US-063, US-064** | Managing Majors, Specialists, Semesters, Subjects, and prerequisite dependency graphs. |
| **Shared Question Bank Administration** | **US-014, US-015, US-017** | Bulk XML question import (`/quiz-questions/import`), XML question export (`/quiz-questions/export/:subjectId`), and question bank CRUD. |
| **Timetable Schedule Management** | **US-045** | Reviewing and approving instructor teaching schedules and resolving timetable exceptions. |
| **System Moderation & Audit** | **US-049, US-052, US-055** | User account management, viewing all system feedback, and moderating inappropriate content. |

---

### 🖥️ External Systems Integration Mapping

1.  **MongoDB Database $\leftrightarrow$ Domain Data Layer:**
    *   Optimized schemas, compound indexes, text indexes, and pre-save hooks.
    *   *All 74 User Stories* persist data through Mongoose models.
2.  **MinIO S3 Cloud Storage $\leftrightarrow$ Binary Asset Management:**
    *   **US-013 (Lesson Materials)**: Uploading and streaming lecture assets (PDF, MP4, MP3).
    *   **US-008, US-011 (Assignments & Submissions)**: Homework attachment management with 20MB limit.
    *   **US-048 (Feedbacks)**: Evidence screenshot attachments.
3.  **Resend Mail Service $\leftrightarrow$ Transactional Emailing:**
    *   **US-002 (Verify Email)** & **US-004 (Reset Password)**: 6-digit OTP delivery and password recovery.
    *   **US-088 (Absence Email)**: Automated email alerts when a student's absences exceed 20% of total course sessions.
4.  **Socket.io Engine $\leftrightarrow$ Real-time Engine:**
    *   **US-069 (Realtime Chat & Video)**: Instant messaging, seen receipts, active room presence, and WebRTC peer-to-peer 1-on-1 signaling.

---

## 3. Conclusion

The correlation between the **User Stories** and the **System Context Diagram** is cohesive, robust, and completely aligned across all roles, permissions, data access layers, and external system integrations.
