# LMS System Product Overview

This document presents the overall system description and context diagram for the **Learning Management System (LMS)**, defining the project boundaries, external entities, and data flows.

---

## 1. Product Overview

The Learning Management System (LMS) is a modern, comprehensive, and cohesive software platform designed to replace fragmented, traditional academic procedures for course administration, schedule planning, student attendance tracking, and assessment grading. 

The system seamlessly coordinates three primary human user groups (Students, Teachers, and Administrators) and four specialized data integration gateways (MongoDB Database, MinIO S3 Object Storage, Resend Email Service, and Socket.io WebSockets Gateway). By doing so, it automates critical academic workflows such as course registrations, lesson material distributions (slides, notes, and videos), online testing with auto-saved progress states, homework essay submissions with descriptive markdown evaluation feedback, real-time classroom chats, WebRTC video calling, and proactive student attendance email alerts.

---

## 1.2 System Boundaries & Context Diagram

The context diagram below illustrates the operational boundaries and interfaces of the central LMS application in Release 1.0. It maps the bidirectional and unidirectional data, control, and material flows occurring between the central system core and the surrounding universe of actors and integrated third-party systems.

```mermaid
graph TD
    %% Styling Configuration
    classDef actor fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef system fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef lmsCore fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,stroke-dasharray:5 5;

    %% Nodes Definition
    STUDENT((👤 Student)):::actor
    TEACHER((👤 Teacher)):::actor
    ADMIN((👤 Admin)):::actor

    LMS["💻 Central LMS System Core<br/>(ExpressJS Backend & React/Vite Frontend)"]:::lmsCore

    DB[(💾 MongoDB Database)]:::system
    STORAGE[(📁 MinIO Object Storage)]:::system
    EMAIL[(✉️ Resend Mail Service)]:::system
    SOCKET[(⚡ Socket.io Engine)]:::system

    %% Student Data Flows
    STUDENT -- "1. Login Credentials & Profile Registrations" --> LMS
    STUDENT -- "2. Course Enrollments & Quiz Attempt Actions" --> LMS
    STUDENT -- "3. Homework Submissions, Forum Posts, & Chat Messages" --> LMS
    LMS -- "4. Session Tokens, Course Syllabus, & Grades" --> STUDENT
    LMS -- "5. Lesson materials, Attendance Logs, & Chat Streams" --> STUDENT

    %% Teacher Data Flows
    TEACHER -- "1. Course Syllabus, Lessons, & S3 Lecture Materials" --> LMS
    TEACHER -- "2. Quiz Settings, Question Banks, & Essay Assignments" --> LMS
    TEACHER -- "3. Grades, Roster Attendance, & Announcements" --> LMS
    LMS -- "4. Homework submissions, Student attempts, & Feedback ratings" --> TEACHER

    %% Admin Data Flows
    ADMIN -- "1. Majors, Specialists, Subjects, Semesters, & Time Slots" --> LMS
    ADMIN -- "2. User accounts audit & Teacher-course assignments" --> LMS
    ADMIN -- "3. Moderation policies & feedback deletion logs" --> LMS
    LMS -- "4. System statistics & administrative activity logs" --> ADMIN

    %% External Systems Data Flows
    LMS <--> "Query/Store relational documents & schemas" DB
    LMS <--> "Upload/Fetch binary files (PDFs, Videos, Homework)" STORAGE
    LMS -- "Trigger OTPs, Link invites, & Absence warning emails" --> EMAIL
    LMS <--> "Broadcast chat packets, seen flags, & Video SDP signaling" SOCKET

    %% Secondary System-to-User Deliveries
    SOCKET -.-> |"Real-time alerts & live video notifications"| STUDENT
    SOCKET -.-> |"Real-time alerts & live video notifications"| TEACHER
    EMAIL -.-> |"Direct mailbox OTP & invitation links"| STUDENT
    EMAIL -.-> |"Direct mailbox OTP & invitation links"| TEACHER
```

---

## 1.3 Description of External Interfaces & Flows

### 1.3.1 Human Components (Actors)
- **👤 Student**: Pulls information regarding class enrollments, lesson directories, and grades. Pushes login credentials, online exam selections, and assignment binaries to the system.
- **👤 Teacher**: Feeds educational course frameworks, lesson plans, questions, and grading feedback into the system. Reads compiled student engagement reports and homework submissions.
- **👤 Admin**: Seeds core system indexes such as academic semesters, curriculum subjects, time slots, and academic majors. Resolves user management updates and moderates course listings.

### 1.3.2 External Systems & Integrations
- **💾 MongoDB Database**: Connected via Mongoose ORM. Receives unstructured relational schemas for users, courses, schedules, and attendances; returns transactional status messages and structured JSON document responses.
- **📁 MinIO S3 Object Storage**: Coordinates the storage of all massive binary data. Receives secure streaming uploads; returns presigned access URLs valid for finite periods to protect learning assets.
- **✉️ Resend Mail Service**: Consumes outgoing email trigger alerts, resolving direct deliverability of OTP authentication codes, onboarding course join invitations, and late attendance email alerts.
- **⚡ Socket.io Engine**: Coordinates persistent WebSockets to sustain live chats, seen markers, and signaling handshakes to establish high-bandwidth, peer-to-peer WebRTC video calls.
