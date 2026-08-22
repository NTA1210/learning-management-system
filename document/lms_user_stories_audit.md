# Audit Results: User Stories (Use Cases) vs. LMS Implementation

Based on a comprehensive audit of the codebase (`routes`, `controllers`, `services`, `models`, and `validators` in `BE_LMS` alongside the frontend client), this document maps the **User Stories** to their concrete implementations.

---

## 📌 Audit Summary
*   **Total User Stories Audited:** 74 stories.
*   **Fully Implemented in Codebase:** 73 stories.
*   **Replaced / Enhanced:** 1 story (**US-009** was enhanced into a structured Subject - Major - Specialist academic hierarchy instead of a generic flat category).
*   **Implementation Completeness:** All backend endpoints from authentication and course scheduling to auto-saved quiz attempts, real-time chat, WebRTC video calling, and feedback moderation are mapped directly to project routes.

---

## 🗂️ User Stories by Functional Module

### 1. Authentication & User Management
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-001** | Register an account with email and password | `POST /auth/register` in `BE_LMS/src/routes/auth.route.ts` |
| **US-002** | Verify email via a verification code | `GET /auth/email/verify/:code` in `BE_LMS/src/routes/auth.route.ts` |
| **US-003** | Log in and maintain secure session (JWT + Cookies) | `POST /auth/login` & `/auth/refresh` in `BE_LMS/src/routes/auth.route.ts` |
| **US-004** | Reset password via email verification code | `POST /auth/password/forgot` & `/password/reset` in `BE_LMS/src/routes/auth.route.ts` |

---

### 2. Course & Class Management
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-005** | Teacher: Create and edit courses | `POST /courses` & `PUT /courses/:id` in `BE_LMS/src/routes/course.route.ts` |
| **US-031b** | Admin: Ensure only teachers with correct specialization can teach a course | Validation logic in `createCourse` & `updateCourse` in `BE_LMS/src/services/course.service.ts` |
| **US-044** | Admin: Divide students/teachers into small classes (Sections) | Managed via indexing on `subjectId` and `semesterId` in `BE_LMS/src/models/course.model.ts` to allow parallel sections. |
| **US-089** | Teacher/Admin: Create and view course statistics | `GET /courses/:courseId/statistics` & `/courses/:courseId/complete` in `BE_LMS/src/routes/course.route.ts` |

---

### 3. Enrollment & Course Invites
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-006** | Student: Enroll or unenroll (cancel) from courses | `POST /enrollments/enroll` & `PUT /enrollments/my-enrollments/:id` in `BE_LMS/src/routes/enrollment.route.ts` |
| **US-029** | Student: Enroll with anti-spam (cooldown 1 min), capacity & re-enrollment rules | Cooldown, capacity, and prerequisite validation in `BE_LMS/src/services/enrollment.service.ts` |
| **US-031a** | Admin/Teacher: Improved enrollment management with validation & formatted responses | Input schema validation in `BE_LMS/src/validators/enrollment.schemas.ts` |
| **US-056** | Teacher/Admin: Create secure course invite link (with expiry & usage limits) | `POST /course-invites` in `BE_LMS/src/routes/courseInvite.route.ts` |
| **US-057** | Student: Join course via invite link token without manual approval | `POST /course-invites/join` in `BE_LMS/src/routes/courseInvite.route.ts` |
| **US-058** | Teacher/Admin: Manage (view, enable/disable, delete) course invite links | `GET /course-invites`, `PATCH /:id`, `DELETE /:id` in `BE_LMS/src/routes/courseInvite.route.ts` |

---

### 4. Subjects & Prerequisites Management
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-024** | Teacher/Admin: Manage subjects for courses | `POST /subjects`, `PATCH /subjects/:id`, `DELETE /subjects/:id` in `BE_LMS/src/routes/subject.route.ts` |
| **US-060** | Admin/Teacher: List subjects with paging, search, specialist, active filters | `GET /subjects` in `BE_LMS/src/routes/subject.route.ts` |
| **US-061** | Admin/Teacher: View subject details by ID or Slug | `GET /subjects/:id` & `/subjects/slug/:slug` in `BE_LMS/src/routes/subject.route.ts` |
| **US-062** | Admin/Teacher: Create new subjects with uniqueness rules (name/code/slug) | Handled in `createSubject` and unique compound index in `BE_LMS/src/models/subject.model.ts` |
| **US-063** | Admin/Teacher: Update/activate/deactivate/delete subjects | `PATCH /subjects/:id/activate` & `/subjects/:id/deactivate` in `BE_LMS/src/routes/subject.route.ts` |
| **US-064** | Admin/Teacher: Manage prerequisite subject dependencies | `POST /subjects/:id/prerequisites` & `DELETE /:id/prerequisites/:preId` in `BE_LMS/src/routes/subject.route.ts` |

---

### 5. Lessons & Learning Progress
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-007** | Student: View lessons and download learning materials (PDF, Video...) | `GET /lessons/:id` & `GET /lesson-materials/:id/download` in `BE_LMS/src/routes/lesson.route.ts` & `lessonMaterial.route.ts` |
| **US-012** | Teacher: Manage lessons (create, edit, delete, list) | `POST /lessons`, `PUT /lessons/:id`, `DELETE /lessons/:id` in `BE_LMS/src/routes/lesson.route.ts` |
| **US-013** | Teacher: Upload and manage lesson materials (PDF, slides, video) via MinIO | `POST /lesson-materials/upload`, `PATCH /:id`, `DELETE /:id/file` in `BE_LMS/src/routes/lessonMaterial.route.ts` |
| **US-022** | Student/Teacher/Admin: View lesson progress with role-based access | `GET /lesson-progress/lessons/:lessonId` in `BE_LMS/src/routes/lessonProgress.route.ts` |
| **US-023** | Student/Admin: Track time-on-task / add learning time for a lesson | `PATCH /lesson-progress/lessons/:lessonId/time` with `incSeconds` in `BE_LMS/src/routes/lessonProgress.route.ts` |
| **US-025** | Teacher/Admin: Review student's course-level lesson progress | `GET /lesson-progress/courses/:courseId` (supports `?studentId`) in `BE_LMS/src/routes/lessonProgress.route.ts` |
| **US-026** | Analytics: Include last access timestamps in lesson progress data | Supported via `lastAccessedAt` field in `BE_LMS/src/models/lessonProgress.model.ts` |

---

### 6. Question Banks & Quizzes
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-014** | Admin/Teacher: Import XML questions file to create questions bank | `POST /quiz-questions/import` in `BE_LMS/src/routes/quizQuestion.route.ts` |
| **US-015** | Admin/Teacher: Export questions bank for subject to XML file | `GET /quiz-questions/export/:subjectId` in `BE_LMS/src/routes/quizQuestion.route.ts` |
| **US-016** | Teacher: Filter questions by page, limit, subjectId, dates, type, sort | `GET /quiz-questions` in `BE_LMS/src/routes/quizQuestion.route.ts` |
| **US-017** | Admin: Manage (Create, Update, Delete & Bulk Delete) questions | `POST /`, `PUT /:quizQuestionId`, `DELETE /:quizQuestionId`, `DELETE /` in `BE_LMS/src/routes/quizQuestion.route.ts` |
| **US-018** | Teacher: Generate random questions from bank for a quiz | `GET /quiz-questions/random` in `BE_LMS/src/routes/quizQuestion.route.ts` |
| **US-046** | Teacher: Create a new quiz and assign to students | `POST /quizzes` in `BE_LMS/src/routes/quiz.route.ts` |
| **US-059** | Teacher: Update quiz questions and details | `PUT /quizzes/:quizId` in `BE_LMS/src/routes/quiz.route.ts` |
| **US-065** | Teacher: Delete quiz to remove unwanted tests | `DELETE /quizzes/:quizId` in `BE_LMS/src/routes/quiz.route.ts` |
| **US-066** | Teacher/Admin: Observe students' quiz attempts | `GET /quizzes/:quizId/quiz-attempts` in `BE_LMS/src/routes/quiz.route.ts` |
| **US-068** | Teacher/Admin: Ban cheating students during testing | `PUT /quiz-attempts/:quizAttemptId/ban` in `BE_LMS/src/routes/quizAttempt.route.ts` |
| **US-070** | Teacher/Admin: Manual quiz grading (re-grade when connection failures occur) | `PUT /quiz-attempts/:quizAttemptId/re-grade` in `BE_LMS/src/routes/quizAttempt.route.ts` |
| **US-071** | Teacher/Admin: Update/refine scores of student's attempts | `PUT /quiz-attempts/:quizAttemptId` in `BE_LMS/src/routes/quizAttempt.route.ts` |
| **US-072** | Teacher/Admin: View quiz overall score statistics | `GET /quizzes/:quizId/statistics` in `BE_LMS/src/routes/quiz.route.ts` |
| **US-074** | Student: Auto-save / remember answers when doing quiz to prevent data loss | `PUT /quiz-attempts/:quizAttemptId/auto-save` & `/save` in `BE_LMS/src/routes/quizAttempt.route.ts` |

---

### 7. Assignments & Submissions Grading
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-008** | Teacher: Create assignments with deadlines | `POST /assignments` (with file upload) in `BE_LMS/src/routes/assignment.route.ts` |
| **US-010** | Teacher: Edit and manage assignments | `PUT /assignments/:id` & `DELETE /assignments/:id` in `BE_LMS/src/routes/assignment.route.ts` |
| **US-011** | Student: Submit assignments and track submission progress | `POST /submissions` & `GET /submissions/:assignmentId/status` in `BE_LMS/src/routes/submission.route.ts` |
| **US-019** | Teacher: Manually grade essay-type submissions and provide feedback | `PUT /submissions/:assignmentId/grade` & `/by-submission/:submissionId/grade` in `BE_LMS/src/routes/submission.route.ts` |
| **US-020** | Student: View all grades (transcripts) in one place | `GET /submissions/my/grades` in `BE_LMS/src/routes/submission.route.ts` |
| **US-047** | Teacher: View grade statistics and reports of assignments/courses | `GET /submissions/:assignmentId/stats` & `/report` in `BE_LMS/src/routes/submission.route.ts` |
| **US-073** | Teacher/Admin: View study result statistics of students in a course | `GET /submissions/course/:courseId/report` in `BE_LMS/src/routes/submission.route.ts` |

---

### 8. Timetables & Attendance Tracking
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-045** | Teacher: Global schedules weekly with customizable daily time slots | `POST /schedules`, `GET /time-slots`, `GET /check-availability` in `BE_LMS/src/routes/schedule.route.ts` |
| **US-079** | Teacher/Admin: Mark student attendance for each session/day | `POST /attendances` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-080** | Teacher/Admin: Update attendance records with time restrictions | `PATCH /attendances/:attendanceId` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-081** | Admin/Teacher: Delete attendance records with role-based restrictions | `DELETE /attendances` & `DELETE /:attendanceId` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-082** | Student: View personal attendance history | `GET /attendances/self` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-083** | Teacher/Admin: View specific student's attendance history | `GET /attendances/students/:studentId` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-084** | Teacher/Admin: List all attendance records with filters and summary | `GET /attendances` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-085** | Teacher/Admin: Export attendance reports in CSV/JSON formats | `GET /attendances/export` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-086** | Teacher/Admin: View course attendance statistics | `GET /attendances/courses/:courseId/stats` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-087** | Teacher/Admin: View individual student statistics in a course | `GET /attendances/courses/:courseId/students/:studentId/stats` in `BE_LMS/src/routes/attendance.route.ts` |
| **US-088** | Teacher/Admin: Send absence notification emails to students | `POST /attendances/courses/:courseId/send-absence-notifications` in `BE_LMS/src/routes/attendance.route.ts` |

---

### 9. Forums, Blogs & Live Real-time Chat
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-021** | Student: Post and reply to discussions in each course forum | `POST /forums/:forumId/posts` & `/replies` in `BE_LMS/src/routes/forum.route.ts` |
| **US-069** | Student/Teacher/Admin: Real-time chat & video calls with attachments | `GET /chat-rooms`, `POST /chat-rooms`, and WebSockets in `BE_LMS/src/socket/socketConversation.ts` & `socketVideo.ts` |

---

### 10. Feedback & Quality Review System
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-048** | Student/Teacher: Send feedback about course/teacher with rating & file upload | `POST /feedbacks` (via Multer) in `BE_LMS/src/routes/feedback.route.ts` |
| **US-049** | Admin: View, filter, and manage all feedbacks in the system | `GET /feedbacks` in `BE_LMS/src/routes/feedback.route.ts` |
| **US-050** | Student/Teacher: View all feedbacks submitted by self | `GET /feedbacks/my-feedbacks` in `BE_LMS/src/routes/feedback.route.ts` |
| **US-051** | User: View details of a specific feedback | `GET /feedbacks/:id` in `BE_LMS/src/routes/feedback.route.ts` |
| **US-052** | Admin: View feedbacks about any teacher with average rating | `GET /feedbacks/target/:targetId` in `BE_LMS/src/routes/feedback.route.ts` |
| **US-053** | Teacher: View all feedbacks about self with average rating | `GET /feedbacks/target/:targetId` in `BE_LMS/src/routes/feedback.route.ts` |
| **US-054** | Student/Teacher: Delete own feedback | `DELETE /feedbacks/:id` in `BE_LMS/src/routes/feedback.route.ts` |
| **US-055** | Admin: Delete any inappropriate feedback | `DELETE /feedbacks/:id` with `Role.ADMIN` check in `BE_LMS/src/routes/feedback.route.ts` |

---

### 11. Announcements & System Notifications
| Code | User Story Description | Mapped API & Source File |
| :--- | :--- | :--- |
| **US-075** | Teacher/Admin: Create Announcements (course-wide or system-wide) | `POST /announcements` in `BE_LMS/src/routes/announcement.route.ts` |
| **US-076** | Student/Teacher/Admin: View course or system announcements | `GET /announcements/course/:courseId` & `/system` in `BE_LMS/src/routes/announcement.route.ts` |
| **US-077** | Teacher/Admin (Author): Update announcements | `PUT /announcements/:id` in `BE_LMS/src/routes/announcement.route.ts` |
| **US-078** | Teacher/Admin (Author): Delete outdated announcements | `DELETE /announcements/:id` in `BE_LMS/src/routes/announcement.route.ts` |
