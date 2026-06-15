# 4. Non-Functional Requirements

## 4.1 Core Technical Environment & Runtime
This section defines the execution and development platforms of the LMS system:
- **Backend Runtime & Framework**: The server-side application is built using **Node.js (v22.x)** and the **ExpressJS** framework, fully written in **TypeScript**.
- **Frontend Client Platform**: The client-side application is a Single Page Application (SPA) powered by **React 19** and **Vite**, utilizing **Tailwind CSS v4** for modern layout styling, and **Zustand** + **Jotai** for unified state management. Interactive and analytical displays are delivered using **Three.js (React Three Fiber)** and **Recharts**.
- **Execution & Package Manager**: The project uses **NPM (v10.x)** as the primary package coordinator, with robust linting and configurations managed by ESLint and TypeScript compilation.

## 4.2 External Interfaces
This section outlines how the LMS core application communicates with external systems and persistent databases to function correctly:
- **Email Service Interface**: The backend integrates with the **Resend API** (via the official `resend` package) to securely dispatch transactional emails, including verification OTPs, onboarding invitations, and automated student absence warnings.
- **Cloud Storage Interface**: The system integrates with **MinIO (using the S3-compatible Node.js Client API)** to upload, stream, and download massive binary assets such as lecture slides (PDFs), course videos (MP4), audio lectures (MP3), and homework student submissions.
- **Real-Time Communication Interface**: A **Socket.io WebSocket Gateway** establishes persistent, bidirectional connections between clients and the backend to sustain instant messaging, group chat rooms, seen status updates, and peer-to-peer WebRTC signaling for live video classroom calls.
- **Database Interface**: The application communicates with a **MongoDB** database cluster via the **Mongoose ODM**, enforcing strict JSON schemas, text searching, and optimized compound indexing for query speed.

## 4.3 Quality Attributes

### 4.3.1 Usability
- **Responsive Design**: The web interface must be fully responsive and optimized for Desktop, Tablet, and Mobile devices, ensuring students can learn on the go.
- **Accessibility**: The UI should adhere to basic WCAG 2.1 AA guidelines, providing adequate color contrast and readable typography.
- **Ease of Use**: A new student should be able to navigate the dashboard, find their course, and open a lesson within 3 minutes of first login without prior training.
- **Teacher Tools**: Teachers must be provided with a WYSIWYG (What You See Is What You Get) editor for course syllabus building to minimize the learning curve.

### 4.3.2 Reliability
- **Availability**: The system must guarantee a **99.9% uptime** during active semesters (excluding scheduled maintenance windows).
- **Mean Time To Repair (MTTR)**: In the event of a critical failure, the system must be restored to full operation within **4 hours**.
- **Fault Tolerance**: If the WebSocket server goes down, the core application (lessons, quizzes, assignments) must degrade gracefully and remain fully functional via standard REST APIs, merely disabling real-time chat.
- **Data Integrity**: Regular automated database backups must be performed daily to prevent data loss. A "critical bug" is defined as any error causing data loss (e.g., losing student quiz scores) or total inability to access the course catalog.

### 4.3.3 Performance
- **Response Time**: 95% of standard REST API requests (e.g., loading the course dashboard, fetching lesson data) must respond in under **500 milliseconds**.
- **Real-time Latency**: WebSocket events (chat messages, live notifications) should have a delivery latency of less than **100 milliseconds** under normal load.
- **Capacity**: The system must be capable of accommodating at least **5,000 concurrent students** accessing the platform, and gracefully handle spikes of up to **2,000 students taking a quiz simultaneously** without timeouts.
- **Resource Utilization (File Upload limits)**: The maximum allowed size for any single uploaded file is **20MB** (exactly `20 * 1024 * 1024` bytes, enforced via Express-Multer middleware). This limit applies to all media attachments including homework submissions, lesson handouts, course logos, and forum posts.
- **Supported File Formats**: File uploads are filtered by MIME-type validation. The permitted file formats are:
  - *Documents*: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, XML.
  - *Media Assets*: MP4 (Video), MP3/MPEG (Audio), JPEG, PNG (Images).
  - *Compressed Archives*: ZIP, RAR.

---

# 5. Requirement Appendix

## 5.1 Business Rules
The following business rules dictate the core logic of the Learning Management System.

| ID | Rule Definition |
|---|---|
| BR-01 | A Student cannot enroll in a Course if they have not completed the required prerequisite Subjects. |
| BR-02 | A Teacher can only modify the syllabus and lessons of a Course while its status is set to `DRAFT`. |
| BR-03 | Once a Course is `PUBLISHED`, enrolled students must be notified of any major schedule exceptions or changes. |
| BR-04 | An automated email warning must be dispatched to the Student and Teacher when a student's absence rate exceeds **20%** of the total sessions. |
| BR-05 | Quiz attempts are automatically submitted and locked the moment the countdown timer reaches zero, regardless of the student's connection status. |
| BR-06 | Students cannot self-unenroll from a course after the designated "Drop Deadline" has passed. |
| BR-07 | A single Course Section cannot accept enrollments exceeding its defined `capacity`. |
| BR-08 | System passwords must be at least 8 characters long and contain a mix of letters and numbers. |
| BR-09 | **Enrollment Spam Cooldown**: To prevent API abuse, self-enrollment and re-enrollment requests by Students are subjected to an automated **1-minute cooldown period** between successive requests. |
| BR-10 | **Teacher Specialization Matching**: A Course can only be allocated/assigned to a Teacher whose academic specialization (`Specialist` model) matches the course's prerequisite `Subject` specialty. |
| BR-11 | **Quiz Anti-Cheat Auditing**: Quiz attempts are tracked, and Teachers/Admins retain strict privileges to mark a specific attempt as cheated (Banned status) during or after the examination. |
| BR-12 | **Quiz Re-grading & Adjustments**: Teachers/Admins are authorized to manually override, edit, or trigger a full re-grade of a student's quiz attempt to correct scores from network failures or disconnection exceptions. |

## 5.2 Common Requirements
- **Security & Encryption**: All user passwords must be hashed using **bcrypt** before database storage. All cross-domain exchanges must comply with configured CORS origins.
- **Cookie-Based Authentication**: The system uses a secure, stateless **JWT (JSON Web Token)** strategy. Tokens are not stored on local storage; instead, the system utilizes **Secure HTTP-Only Cookies** to manage `accessToken` and `refreshToken` credentials, shielding the application from Cross-Site Scripting (XSS) attacks.
- **Authentication Exceptions**: All endpoints (except public routes such as `/login`, `/register`, `/forgot-password`, `/reset-password`, `/email/verify/:code`, and generic subjects listings) require a valid token verified via Mongoose sessions.
- **Role-Based Access Control (RBAC)**: All routes strictly validate custom scopes. A Student cannot invoke grading, course drafts approval, or enrollment management endpoints under any circumstances.
- **Soft Deletion**: System entities (such as Courses, Lessons, and Users) must implement **Soft Delete** logic (flagging `isDeleted: true` and `deletedAt`) rather than permanent database removal to preserve academic history and referential records.

## 5.3 Application Messages List

| # | Message Code | Message Type | Context | Content |
|---|---|---|---|---|
| 1 | MSG-AUTH-01 | In line (Red) | Login failed due to wrong credentials. | Incorrect email or password. Please try again. |
| 2 | MSG-AUTH-02 | Toast message | OTP sent successfully during registration. | A verification code has been sent to {email_address}. |
| 3 | MSG-ENR-01 | Modal Alert | Student tries to enroll without prerequisites. | Enrollment failed: You must pass {prerequisite_subject} first. |
| 4 | MSG-ENR-02 | Toast message | Student successfully self-enrolls. | You have successfully enrolled in {course_title}. |
| 5 | MSG-CRS-01 | Toast message | Teacher saves a course draft. | Course draft saved successfully. |
| 6 | MSG-ATT-01 | System Alert | Student absence exceeds the 20% limit. | Warning: Your absence rate for {course_title} has reached {absence_percentage}%. |
| 7 | MSG-QZ-01 | Toast message | Student finishes and submits a quiz. | Quiz submitted successfully. Your score is {score}. |
| 8 | MSG-SYS-01 | In line (Red) | User uploads a file exceeding the size limit. | Upload failed: File size exceeds the 20MB limit. |
| 9 | MSG-SYS-02 | Toast message | Admin updates a user's role. | User permissions updated successfully. |
| 10 | MSG-SYS-03 | Toast message | Real-time quiz attempt auto-saves successfully. | Progress auto-saved. |
| 11 | MSG-SYS-04 | Modal Alert | Student is banned from quiz due to cheat detection. | You have been banned from this quiz attempt by the course supervisor. |
| 12 | MSG-SYS-05 | Toast message | Re-grade triggered by Teacher/Admin successfully. | Quiz attempt has been successfully re-graded. |
