# Kết quả đối chiếu User Stories (Usecases) với Dự án LMS thực tế

Dựa trên việc kiểm tra chi tiết toàn bộ mã nguồn của dự án (các file routes, controllers, services, models và validators của `BE_LMS`), chúng tôi đã thực hiện đối chiếu kỹ lưỡng danh sách **User Stories** bạn đã gửi.

---

## 📌 Tóm tắt kết quả kiểm toán
*   **Tổng số User Stories gửi kiểm tra:** 74 câu.
*   **Số lượng ĐÃ CÓ trong dự án:** 73 câu (được lập trình đầy đủ nghiệp vụ).
*   **Số lượng KHÔNG CÓ/THAY THẾ:** 1 câu (**US-009** được thay thế bằng hệ thống Subject - Major - Specialist thay vì danh mục khóa học generic).
*   **Mức độ hoàn thiện:** Toàn bộ các API từ xác thực, lịch trình học tập, quản lý điểm danh, hệ thống quiz tự lưu, cho tới chat realtime/video call và feedback đều được ánh xạ trực tiếp trong các tệp route của bạn.

---

## 🗂️ Phân nhóm User Stories theo Mô-đun nghiệp vụ

Dưới đây là danh sách chi tiết các User Stories được sắp xếp theo trình tự mạch lạc kèm liên kết trực tiếp tới file xử lý backend trong dự án của bạn:

### 1. Hệ thống Xác thực & Quản lý Tài khoản (Authentication & Users)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-001** | Register an account with email and password | `POST /auth/register` trong [auth.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/auth.route.ts#L17) |
| **US-002** | Verify email via a verification code | `GET /auth/email/verify/:code` trong [auth.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/auth.route.ts#L21) |
| **US-003** | Log in and maintain secure session (JWT + Cookies) | `POST /auth/login` & `/auth/refresh` trong [auth.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/auth.route.ts#L18-L20) |
| **US-004** | Reset password via email verification code | `POST /auth/password/forgot` & `/password/reset` trong [auth.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/auth.route.ts#L22-L23) |

---

### 2. Quản lý Khóa học & Lớp học (Course & Class Management)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-005** | Teacher: Create and edit courses | `POST /courses` & `PUT /courses/:id` trong [course.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/course.route.ts#L45-L61) |
| **US-031b** | Admin: Ensure only teachers with correct specialization can teach a course | Logic kiểm tra trong `createCourse` & `updateCourse` tại [course.service.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/services/course.service.ts#L490-L523) |
| **US-044** | Admin: Divide students/teachers into small classes (Sections) | Được triển khai bằng cách gỡ bỏ ràng buộc duy nhất giữa `subjectId` và `semesterId` trong index tại [course.model.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/models/course.model.ts#L88-L90) để tạo các ca học/lớp nhỏ song song. |
| **US-089** | Teacher/Admin: Create and view course statistics | `GET /courses/:courseId/statistics` & `/courses/:courseId/complete` trong [course.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/course.route.ts#L83-L97) |

---

### 3. Đăng ký Môn học & Thư mời (Enrollment & Course Invites)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-006** | Student: Enroll or unenroll (cancel) from courses | `POST /enrollments/enroll` & `PUT /enrollments/my-enrollments/:id` (cập nhật trạng thái `cancelled`) trong [enrollment.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/enrollment.route.ts#L63-L75) |
| **US-029** | Student: Enroll with anti-spam (cooldown 1 min), capacity & re-enrollment rules | Logic kiểm tra cooldown, DROPPED/COMPLETED status, password khóa học đính kèm trong [enrollment.service.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/services/enrollment.service.ts#L380-L483) |
| **US-031a** | Admin/Teacher: Improved enrollment management with validation & formatted responses | Lớp schemas xác thực đầu vào tại [enrollment.schemas.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/validators/enrollment.schemas.ts) |
| **US-056** | Teacher/Admin: Create secure course invite link (with expiry & usage limits) | `POST /course-invites` trong [courseInvite.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/courseInvite.route.ts#L15-L19) |
| **US-057** | Student: Join course via invite link token without manual approval | `POST /course-invites/join` trong [courseInvite.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/courseInvite.route.ts#L25-L28) |
| **US-058** | Teacher/Admin: Manage (view, enable/disable, delete) course invite links | `GET /course-invites`, `PATCH /:id`, `DELETE /:id` trong [courseInvite.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/courseInvite.route.ts#L37-L63) |

---

### 4. Quản lý Môn học & Điều kiện tiên quyết (Subjects & Prerequisites)
*   **Lưu ý về US-009:** Trong dự án thực tế, Admin sẽ quản lý thông tin ngành học (Majors), chuyên ngành (Specialists) và môn học (Subjects) để cấu trúc hóa khóa học thay vì phân mục chung chung.
*   **US-009** được tích hợp thẳng vào mô-đun **Subjects/Majors**.

| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-024** | Teacher/Admin: Manage subjects for courses | `POST /subjects`, `PATCH /subjects/:id`, `DELETE /subjects/:id` trong [subject.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/subject.route.ts#L50-L63) |
| **US-060** | Admin/Teacher: List subjects with paging, search, specialist, active filters | `GET /subjects` trong [subject.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/subject.route.ts#L35) |
| **US-061** | Admin/Teacher: View subject details by ID or Slug | `GET /subjects/:id` & `/subjects/slug/:slug` trong [subject.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/subject.route.ts#L36-L39) |
| **US-062** | Admin/Teacher: Create new subjects with uniqueness rules (name/code/slug) | Ràng buộc nghiệp vụ trong `createSubject` và Model Index tại [subject.model.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/models/subject.model.ts#L20-L23) |
| **US-063** | Admin/Teacher: Update/activate/deactivate/delete subjects | `PATCH /subjects/:id/activate` & `/subjects/:id/deactivate` trong [subject.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/subject.route.ts#L64-L71) |
| **US-064** | Admin/Teacher: Manage prerequisite subject dependencies | `POST /subjects/:id/prerequisites` & `DELETE /:id/prerequisites/:preId` trong [subject.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/subject.route.ts#L72-L83) |

---

### 5. Quản lý Bài học & Tiến độ (Lessons & Learning Progress)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-007** | Student: View lessons and download learning materials (PDF, Video...) | `GET /lessons/:id` & `GET /lesson-materials/:id/download` trong [lesson.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/lesson.route.ts#L21) & [lessonMaterial.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/lessonMaterial.route.ts#L30) |
| **US-012** | Teacher: Manage lessons (create, edit, delete, list) | `POST /lessons`, `PUT /lessons/:id`, `DELETE /lessons/:id` trong [lesson.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/lesson.route.ts#L23-L29) |
| **US-013** | Teacher: Upload and manage lesson materials (PDF, slides, video) via MinIO | `POST /lesson-materials/upload` & `PATCH /:id`, `DELETE /:id/file` trong [lessonMaterial.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/lessonMaterial.route.ts#L35-L49) |
| **US-022** | Student/Teacher/Admin: View lesson progress with role-based access | `GET /lesson-progress/lessons/:lessonId` trong [lessonProgress.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/lessonProgress.route.ts#L15-L17) |
| **US-023** | Student/Admin: Track time-on-task / add learning time for a lesson | `PATCH /lesson-progress/lessons/:lessonId/time` với `incSeconds` trong [lessonProgress.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/lessonProgress.route.ts#L22-L24) |
| **US-025** | Teacher/Admin: Review student's course-level lesson progress | `GET /lesson-progress/courses/:courseId` (hỗ trợ `?studentId`) trong [lessonProgress.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/lessonProgress.route.ts#L18-L20) |
| **US-026** | Analytics: Include last access timestamps in lesson progress data | Sử dụng trường `lastAccessedAt` trong Schema [lessonProgress.model.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/models/lessonProgress.model.ts#L24) |

---

### 6. Ngân hàng Câu hỏi & Đề thi (Quiz & Questions Bank)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-014** | Admin: Import XML questions file to create questions bank | `POST /quiz-questions/import` trong [quizQuestion.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizQuestion.route.ts#L21-L26) |
| **US-015** | Admin: Export questions bank for subject to XML file | `GET /quiz-questions/export/:subjectId` trong [quizQuestion.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizQuestion.route.ts#L27) |
| **US-016** | Teacher: Filter questions by page, limit, subjectId, dates, type, sort | `GET /quiz-questions` trong [quizQuestion.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizQuestion.route.ts#L28) |
| **US-017** | Admin: Manage (Create, Update, Delete & Bulk Delete) questions | `POST /`, `PUT /:quizQuestionId`, `DELETE /:quizQuestionId`, `DELETE /` trong [quizQuestion.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizQuestion.route.ts#L29-L43) |
| **US-018** | Teacher: Generate random questions from bank for a quiz | `GET /quiz-questions/random` trong [quizQuestion.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizQuestion.route.ts#L44) |
| **US-046** | Teacher: Create a new quiz and assign to students | `POST /quizzes` trong [quiz.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quiz.route.ts#L15) |
| **US-059** | Teacher: Update quiz questions and details | `PUT /quizzes/:quizId` trong [quiz.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quiz.route.ts#L18) |
| **US-065** | Teacher: Delete quiz to remove unwanted tests | `DELETE /quizzes/:quizId` trong [quiz.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quiz.route.ts#L19) |
| **US-066** | Teacher/Admin: Observe students' quiz attempts | `GET /quizzes/:quizId/quiz-attempts` & `GET /quiz-attempts/:quizAttemptId` trong [quiz.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quiz.route.ts#L17) |
| **US-068** | Teacher/Admin: Ban cheating students during testing | `PUT /quiz-attempts/:quizAttemptId/ban` trong [quizAttempt.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizAttempt.route.ts#L27-L31) |
| **US-070** | Teacher/Admin: Manual quiz grading (re-grade when connection failures occur) | `PUT /quiz-attempts/:quizAttemptId/re-grade` trong [quizAttempt.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizAttempt.route.ts#L35-L39) |
| **US-071** | Teacher/Admin: Update/refine scores of student's attempts | `PUT /quiz-attempts/:quizAttemptId` trong [quizAttempt.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizAttempt.route.ts#L40-L44) |
| **US-072** | Teacher/Admin: View quiz overall score statistics | `GET /quizzes/:quizId/statistics` trong [quiz.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quiz.route.ts#L16) |
| **US-074** | Student: Auto-save / remember answers when doing quiz to prevent data loss | `PUT /quiz-attempts/:quizAttemptId/auto-save` & `/save` trong [quizAttempt.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/quizAttempt.route.ts#L21-L33) |

---

### 7. Bài tập lớn & Chấm điểm (Assignments & Submissions Grading)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-008** | Teacher: Create assignments with deadlines | `POST /assignments` (có hỗ trợ upload tệp) trong [assignment.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/assignment.route.ts#L22) |
| **US-010** | Teacher: Edit and manage assignments | `PUT /assignments/:id` & `DELETE /assignments/:id` trong [assignment.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/assignment.route.ts#L24-L25) |
| **US-011** | Student: Submit assignments and track submission progress | `POST /submissions` & `GET /submissions/:assignmentId/status` trong [submission.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/submission.route.ts#L26-L35) |
| **US-019** | Teacher: Manually grade essay-type submissions and provide feedback | `PUT /submissions/:assignmentId/grade` & `/by-submission/:submissionId/grade` trong [submission.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/submission.route.ts#L45-L58) |
| **US-020** | Student: View all grades (transcripts) in one place | `GET /submissions/my/grades` trong [submission.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/submission.route.ts#L59-L60) |
| **US-047** | Teacher: View grade statistics and reports of assignments/courses | `GET /submissions/:assignmentId/stats` & `/report` trong [submission.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/submission.route.ts#L61-L73) |
| **US-073** | Teacher/Admin: View study result statistics of students in a course | `GET /submissions/course/:courseId/report` trong [submission.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/submission.route.ts#L74-L79) |

---

### 8. Lịch học & Điểm danh (Attendance & Schedules)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-045** | Teacher: Global schedules weekly with customizable daily time slots | `POST /schedules`, `GET /time-slots`, `GET /per-teacher/:teacherId`, `GET /check-availability` trong [schedule.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/schedule.route.ts) |
| **US-079** | Teacher/Admin: Mark student attendance for each session/day | `POST /attendances` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L51-L52) |
| **US-080** | Teacher/Admin: Update attendance records with time restrictions | `PATCH /attendances/:attendanceId` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L53-L58) |
| **US-081** | Admin/Teacher: Delete attendance records with role-based restrictions | `DELETE /attendances` & `DELETE /:attendanceId` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L60-L71) |
| **US-082** | Student: View personal attendance history | `GET /attendances/self` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L27-L28) |
| **US-083** | Teacher/Admin: View specific student's attendance history | `GET /attendances/students/:studentId` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L30-L35) |
| **US-084** | Teacher/Admin: List all attendance records with filters and summary | `GET /attendances` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L22) |
| **US-085** | Teacher/Admin: Export attendance reports in CSV/JSON formats | `GET /attendances/export` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L24-L25) |
| **US-086** | Teacher/Admin: View course attendance statistics | `GET /attendances/courses/:courseId/stats` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L37-L42) |
| **US-087** | Teacher/Admin: View individual student statistics in a course | `GET /attendances/courses/:courseId/students/:studentId/stats` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L44-L49) |
| **US-088** | Teacher/Admin: Send absence notification emails to students | `POST /attendances/courses/:courseId/send-absence-notifications` trong [attendance.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/attendance.route.ts#L73-L78) |

---

### 9. Kênh thảo luận & Trò chuyện thời gian thực (Forums, Blogs & Live Chat)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-021** | Student: Post and reply to discussions in each course forum | `POST /forums/:forumId/posts` & `/replies` với file đính kèm trong [forum.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/forum.route.ts#L53-L77) |
| **US-069** | Student/Teacher/Admin: Real-time chat & video calls with attachments | `GET /chat-rooms`, `POST /chat-rooms` và `GET /chat-rooms/:chatRoomId/messages` kết hợp WebSocket tại [socketConversation.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/socket/socketConversation.ts) |

---

### 10. Hệ thống Phản hồi & Đánh giá (Feedback System)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-048** | Student/Teacher: Send feedback about course/teacher with rating & file upload | `POST /feedbacks` (sử dụng Multer) trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L22) |
| **US-049** | Admin: View, filter, and manage all feedbacks in the system | `GET /feedbacks` trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L31-L32) |
| **US-050** | Student/Teacher: View all feedbacks submitted by self | `GET /feedbacks/my-feedbacks` trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L24-L26) |
| **US-051** | User: View details of a specific feedback | `GET /feedbacks/:id` trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L34-L35) |
| **US-052** | Admin: View feedbacks about any teacher with average rating | `GET /feedbacks/target/:targetId` trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L28-L29) |
| **US-053** | Teacher: View all feedbacks about self with average rating | `GET /feedbacks/target/:targetId` (lọc theo ID của bản thân) trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L28-L29) |
| **US-054** | Student/Teacher: Delete own feedback | `DELETE /feedbacks/:id` trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L37-L38) |
| **US-055** | Admin: Delete any inappropriate feedback | `DELETE /feedbacks/:id` (với phân quyền Role.ADMIN) trong [feedback.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/feedback.route.ts#L37-L38) |

---

### 11. Quản lý Thông báo & Tin tức (Announcements & Notifications)
| Mã số | Mô tả User Story | API & File mã nguồn ánh xạ trong dự án |
| :--- | :--- | :--- |
| **US-075** | Teacher/Admin: Create Announcements (course-wide or system-wide) | `POST /announcements` trong [announcement.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/announcement.route.ts#L18-L23) |
| **US-076** | Student/Teacher/Admin: View course or system announcements | `GET /announcements/course/:courseId` & `/system` trong [announcement.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/announcement.route.ts#L32-L42) |
| **US-077** | Teacher/Admin (Author): Update announcements | `PUT /announcements/:id` trong [announcement.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/announcement.route.ts#L47-L52) |
| **US-078** | Teacher/Admin (Author): Delete outdated announcements | `DELETE /announcements/:id` trong [announcement.route.ts](file:///d:/chatbot/project-new-code/learning-management-system-6_4/BE_LMS/src/routes/announcement.route.ts#L54-L59) |
