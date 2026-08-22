# Context Diagram - Learning Management System (LMS)

This document provides the Context Diagram (DFD Level 0) and analyzes data flows for the **Learning Management System (LMS)** based on the actual project codebase.

---

## 1. Components in the Context System

The central LMS application interacts with **3 External Actors** and **4 External Systems**:

### External Actors
*   **Student:** Enrolled learners who access lessons, download study materials, complete quizzes, submit assignments, track schedules, view personal attendance, participate in forum discussions, write blog posts, live chat, and make 1-on-1 video calls.
*   **Teacher:** Instructors who manage courses and syllabus lessons, upload learning materials (slides, videos, docs), create quizzes, grade assignment submissions, conduct student attendance, configure teaching schedules/sessions, and view student feedback.
*   **Administrator (Admin):** System administrators responsible for overall system configuration: managing academic majors, specializations, semesters, subject prerequisite maps, user accounts (Admin/Teacher/Student), standardized time slots, course approvals, and system-wide monitoring.

### External Systems
*   **Database System (MongoDB & Mongoose):** Persistent storage for all application domain entities (`User`, `Course`, `Enrollment`, `Lesson`, `Quiz`, `Assignment`, `Submission`, `Forum`, `Attendance`, `ChatRoom`, etc.).
*   **File Storage Service (MinIO / S3 Object Storage):** Stores and securely serves binary uploaded assets such as lesson materials, student submission files, user avatars, and feedback attachments.
*   **Email Delivery Service (Resend Mailer API):** Handles transactional emails including 6-digit OTP verification codes, course invitation links, password reset emails, and automated absence threshold warnings.
*   **Real-time Engine (Socket.io Gateway):** Orchestrates real-time bidirectional communication, including instant chat messaging, read receipts, real-time alerts, and WebRTC peer-to-peer video call signaling (SDP offer/answer/ICE candidate exchange).

---

## 2. System Context Diagram (Mermaid UML)

The diagram below illustrates the information flows between external actors, external integration systems, and the central LMS:

```mermaid
graph TD
    %% Style Definitions
    classDef actor fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef system fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef lmsCore fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,stroke-dasharray:5 5;

    %% Node Definitions
    STUDENT((Student)):::actor
    TEACHER((Teacher)):::actor
    ADMIN((Admin)):::actor

    LMS["Central LMS Application<br/>(ExpressJS Backend + React/Vite Frontend)"]:::lmsCore

    DB[(MongoDB Database)]:::system
    STORAGE[(MinIO / S3 Storage)]:::system
    EMAIL[(Resend Email Service)]:::system
    SOCKET[(Socket.io Gateway)]:::system

    %% Data Flow from Student
    STUDENT -- "1. Register/Login, Profile Management" --> LMS
    STUDENT -- "2. View Lessons, Download Materials" --> LMS
    STUDENT -- "3. Take Quizzes (Auto-save), Submit Assignments" --> LMS
    STUDENT -- "4. View Attendance, Schedules, Submit Feedback" --> LMS
    STUDENT -- "5. Chat, Forum Discussions, Blog Posts" --> LMS
    LMS -- "Learning results, grades, schedules, notifications" --> STUDENT

    %% Data Flow from Teacher
    TEACHER -- "1. Manage Courses, Lessons, Materials" --> LMS
    TEACHER -- "2. Create Quizzes, Post Assignments" --> LMS
    TEACHER -- "3. Grade Submissions, Review Quiz Attempts" --> LMS
    TEACHER -- "4. Manage Schedules, Conduct Attendance" --> LMS
    TEACHER -- "5. Course Announcements, Student Reviews" --> LMS
    LMS -- "Submission lists, grade analytics, student progress" --> TEACHER

    %% Data Flow from Admin
    ADMIN -- "1. User Account Administration" --> LMS
    ADMIN -- "2. Subjects, Semesters, Majors & Prerequisites" --> LMS
    ADMIN -- "3. Teaching Approvals, Time Slots, Feedbacks" --> LMS
    LMS -- "System analytics, audit logs, reports" --> ADMIN

    %% External Systems Data Flow
    LMS <--> "Query/Store domain data" DB
    LMS <--> "Upload/Stream materials, submissions, avatars" STORAGE
    LMS -- "Send OTPs, invites, absence warnings" --> EMAIL
    LMS <--> "Video signaling, real-time chat, instant notifications" SOCKET

    %% Direct notifications to users
    SOCKET -.-> |"Real-time notifications & video calls"| STUDENT
    SOCKET -.-> |"Real-time notifications & video calls"| TEACHER
    EMAIL -.-> |"Invitation & OTP emails"| STUDENT
    EMAIL -.-> |"Invitation & OTP emails"| TEACHER
```

---

## 3. Detailed Data Flow Matrix

The matrix below provides details regarding the data exchanged between the central LMS application and external entities:

### 3.1. External Actors

| Sending Actor | Input Data to LMS | Receiving Actor | Output Data from LMS |
| :--- | :--- | :--- | :--- |
| **Student** | • Credentials & Registration info<br/>• Course enrollment & lesson access requests<br/>• Quiz responses (with auto-save)<br/>• Homework submission files<br/>• Course/Instructor feedback ratings<br/>• Forum posts, replies & blog articles<br/>• Real-time chat messages & WebRTC signals | **Student** | • Auth tokens (JWT in HTTP-Only Cookies)<br/>• Lesson content & streaming materials<br/>• Instant quiz results & score feedback<br/>• Assignment grades & instructor remarks<br/>• Personal timetable & attendance status<br/>• Real-time chat & video streams |
| **Teacher** | • Course syllabus, chapter & lesson data<br/>• Lecture files (PDF, MP4, MP3, slides)<br/>• Question bank items & Quiz definitions<br/>• Assignment grades & evaluation remarks<br/>• Teaching availability & attendance records<br/>• Course-level announcements | **Teacher** | • Student progress tracking reports<br/>• Submitted assignments & file downloads<br/>• Class attendance summary & alerts<br/>• Aggregated student feedback ratings |
| **Admin** | • User accounts creation & role updates<br/>• Majors, Specialists, Semesters, Subjects<br/>• Prerequisite dependency graph<br/>• Time slots & course approval status | **Admin** | • Global user directory & status logs<br/>• Academic analytics & enrollment metrics<br/>• System logs & reported feedback moderation |

### 3.2. External Integrated Systems

| Integrated System | Direction | Exchanged Data Flow |
| :--- | :---: | :--- |
| **MongoDB Database** | Bidirectional | • **Outbound from LMS:** CRUD operations across domain collections: `users`, `courses`, `lessons`, `quizzes`, `submissions`, `schedules`, `chats`, `attendances`, etc.<br/>• **Inbound to LMS:** Query results and hydrated JSON documents via Mongoose ORM. |
| **MinIO / S3 Storage** | Bidirectional | • **Outbound from LMS:** Binary upload streams with unique UUID hashes and structured bucket prefixes.<br/>• **Inbound to LMS:** Public file URLs and secure time-limited Presigned URLs for client download/streaming. |
| **Resend Email Service** | Unidirectional | • **Outbound from LMS:** API payloads containing recipient (`to`), subject line, and rendered HTML/text templates for OTP codes, password resets, course invites, and attendance warnings. |
| **Socket.io Gateway** | Bidirectional | • **Interaction:** Persistent WebSocket tunnels for instant messaging, room broadcasting, seen receipts, live notifications, and WebRTC peer connection signaling (SDP offer/answer, ICE candidates). |
