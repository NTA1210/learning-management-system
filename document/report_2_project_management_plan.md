# CAPSTONE PROJECT REPORT
## Report 2 – Project Management Plan

**Project Title**: Learning Management System (LMS)  
**Project Code**: LMS  
**Group Name**: SWP493-G4  
**Developer Name**: QuangNVDE180682  
**Supervisor**: Nguyen Trung Kien  
**Date**: May 26, 2026  

---

## Table of Contents
- [I. Record of Changes](#i-record-of-changes)
- [II. Project Management Plan](#ii-project-management-plan)
  - [1. Overview](#1-overview)
    - [1.1 Scope & Estimation (WBS)](#11-scope--estimation-wbs)
    - [1.2 Project Objectives](#12-project-objectives)
    - [1.3 Project Risks](#13-project-risks)
  - [2. Management Approach](#2-management-approach)
    - [2.1 Project Process (Solo Agile/Scrum)](#21-project-process-solo-agilescrum)
    - [2.2 Quality Management](#22-quality-management)
    - [2.3 Training Plan](#23-training-plan)
  - [3. Project Deliverables](#3-project-deliverables)
  - [4. Responsibility Assignments (RAM)](#4-responsibility-assignments-ram)
  - [5. Project Communications](#5-project-communications)
  - [6. Configuration Management](#6-configuration-management)
    - [6.1 Document Management](#61-document-management)
    - [6.2 Source Code Management](#62-source-code-management)
    - [6.3 Tools & Infrastructures](#63-tools--infrastructures)

---

## I. Record of Changes

| Date | Action* | In Charge | Change Description |
| :--- | :---: | :--- | :--- |
| 2026-05-12 | A | QuangNVDE180682 | Created initial framework for the Project Management Plan. |
| 2026-05-18 | A | QuangNVDE180682 | Modeled WBS and Estimated Effort for all 11 core functional modules. |
| 2026-05-22 | M | QuangNVDE180682 | Set up Personal Scrum process model, single-person RACI matrix, and risk mitigation strategies. |
| 2026-05-26 | M | QuangNVDE180682 | Standardized tools list and verified against active MERN + TS codebase configurations. |

*\*Action: A - Added, M - Modified, D - Deleted*

---

## II. Project Management Plan

### 1. Overview

#### 1.1 Scope & Estimation (WBS)
As the **sole developer** for this capstone project, **QuangNVDE180682** has estimated the effort required for all modules. Effort is estimated in **man-days** (8 hours/day).

| WBS Item | Feature / Function | Complexity | Est. Effort (man-days) |
| :--- | :--- | :---: | :---: |
| **1** | **User Authentication & Session Security** | | **9** |
| 1.1 | Custom Sign Up with 6-digit OTP via Resend API | Medium | 4 |
| 1.2 | Cookie-based Login (Stateless HTTP-Only JWT tokens) | Simple | 2 |
| 1.3 | Forgot / Reset Password workflow via Email OTP | Medium | 3 |
| **2** | **Curriculum & Academic Catalog** | | **6** |
| 2.1 | Browse Subject Catalog with paging and filters | Simple | 2 |
| 2.2 | Manage Subjects & Prerequisites Tree Map | Complex | 4 |
| **3** | **Course Section & Syllabus Builder** | | **7** |
| 3.1 | Syllabus module editor (DRAFT status locked syllabus) | Medium | 4 |
| 3.2 | Admin Draft Course Approval (Specialization check) | Medium | 3 |
| **4** | **Course Enrollment & Invitation** | | **11** |
| 4.1 | Course Self-Enrollment (1-min cooldown, prerequisite check) | Complex | 6 |
| 4.2 | Expiring Course Invite link generation and join bypass | Medium | 5 |
| **5** | **Learning Viewer & Lesson Progress** | | **7** |
| 5.1 | Lesson streaming & handout downloads (MinIO S3 API) | Medium | 4 |
| 5.2 | Task-Time Progress tracker (periodic heartbeat telemetry) | Simple | 3 |
| **6** | **Examinations & Assessments Pool** | | **15** |
| 6.1 | Quiz Question Bank XML Import & Export parser | Medium | 4 |
| 6.2 | Randomized Exam engine with background answer Auto-Save | Complex | 6 |
| 6.3 | Anti-cheat ban controller and manual score re-grading | Complex | 5 |
| **7** | **Assignments & Submissions** | | **7** |
| 7.1 | Essay Handouts upload (Multer file limits 20MB) | Simple | 3 |
| 7.2 | Teacher Grading Console (Score 0-10 & review notes) | Medium | 4 |
| **8** | **Schedules & Attendance Tracking** | | **12** |
| 8.1 | Weekly timetables scheduler and exceptions booking | Medium | 6 |
| 8.2 | Roster attendance sheet and automatic 20% absence cron | Complex | 6 |
| **9** | **Forums & Real-Time Communication** | | **11** |
| 9.1 | Course Forums threads and hierarchical replies | Simple | 3 |
| 9.2 | Socket.io instant chat and 1-to-1 WebRTC signaling | Complex | 8 |
| **10** | **Quality Course Feedback** | | **5** |
| 10.1 | Anonymous 5-star rating feedback and Admin review | Simple | 5 |
| **11** | **Announcements & Notifications** | | **3** |
| 11.1 | Class-wide & System-wide Bulletins | Simple | 3 |
| | **Total Estimated Codebase Effort (man-days)** | | **93** |

---

#### 1.2 Project Objectives

##### Target Quality Metrics
Because this is a solo project, quality objectives emphasize extensive unit test coverage (using Jest) and thorough manual API verification via Postman.

| # | Testing Stage | Test Coverage | No. of Defects | % of Defect | Notes |
|---|---|---|---|---|---|
| 1 | Personal Static Review | N/A | < 10 | 100% fixed | Verified using ESLint strict rules. |
| 2 | Unit Testing (Jest) | >= 80% Lines | < 5 | 100% fixed | Tests mock mongoose services. |
| 3 | Integration Testing | >= 85% Routes | < 3 | 100% fixed | Integration using MongoDB memory server. |
| 4 | System Testing | End-to-End | < 2 | 100% fixed | Manual browser walk-throughs. |
| 5 | Acceptance Testing | All User Stories | 0 | 100% fixed | Matches FPT University Capstone Criteria. |

- **Milestone Timeliness (%)**: Target **100%** on-time delivery across sprints.
- **Allocated Effort (man-days)**:
  - Requirement Analysis: **10%** (9.3 man-days)
  - Architectural Design: **15%** (14.0 man-days)
  - Implementation & Coding: **50%** (46.5 man-days)
  - Testing & Debugging: **20%** (18.6 man-days)
  - Deployment & Final Review: **5%** (4.6 man-days)

---

#### 1.3 Project Risks

For a **single-developer team**, risks are significantly amplified. Below is the custom risk management profile for **QuangNVDE180682**:

| # | Risk Description | Impact | Possibility | Response Plans |
|---|---|---|---|---|
| **1** | **Single Developer Bottleneck (Sickness / Burnout)** | High | Medium | Enforce strict Personal Kanban daily schedules. Keep code highly modular and utilize pre-configured libraries. Focus on MVP core functionality first. |
| **2** | **Technical Complexity in P2P WebRTC Video Signaling** | Medium | High | Utilize pre-tested Socket.io connection patterns. Prepare a standard text-chat fallback configuration if media channel handshakes trigger ice-candidate exceptions. |
| **3** | **MinIO S3 Storage Quota & File Upload Exploits** | Medium | Medium | Set a strict **20MB size ceiling** inside Multer memory filters (`multer.ts`) to immediately bounce bloated requests before they consume bandwidth. |
| **4** | **Unstable DB Connections under Concurrent Stress** | High | Low | Create robust Mongoose schema index constraints (Compound indexes on `studentId` and `courseId`) to optimize query speeds. |

---

### 2. Management Approach

#### 2.1 Project Process (Solo Agile/Scrum)
QuangNVDE180682 operates on a **Solo Scrum** (Personal Software Process) framework divided into **6 Sprints** (2 weeks per Sprint):

```text
  +-----------------------------------------------------------------+
  |  Sprint 1: Database schemas seeding & Auth & Secure Cookies    |
  +-----------------------------------------------------------------+
                                  |
  +-----------------------------------------------------------------+
  |  Sprint 2: Academic map, Specialist checks & Syllabus drafts     |
  +-----------------------------------------------------------------+
                                  |
  +-----------------------------------------------------------------+
  |  Sprint 3: Prerequisite enrollments (cooldown) & S3 streams     |
  +-----------------------------------------------------------------+
                                  |
  +-----------------------------------------------------------------+
  |  Sprint 4: Quiz XML import, scramble engine & Auto-Save checks   |
  +-----------------------------------------------------------------+
                                  |
  +-----------------------------------------------------------------+
  |  Sprint 5: Assignments grading, Attendance 20% warnings & chats |
  +-----------------------------------------------------------------+
                                  |
  +-----------------------------------------------------------------+
  |  Sprint 6: Feedback star logs, full integration test & AWS prod |
  +-----------------------------------------------------------------+
```

#### 2.2 Quality Management
1. **Defect Prevention**: Implement rigorous Zod validators on all Express API inputs, intercepting invalid payloads before database queries.
2. **Reviewing**: Code is written in standard TypeScript under strict compilation rules (`tsconfig.json`), eliminating implicit typing issues.
3. **Unit & Integration Testing**: Mongoose models are isolated and verified in Jest tests using the `mongodb-memory-server` package, eliminating external network dependencies during development runs.

#### 2.3 Training Plan

As a solo developer, self-training is critical to master the advanced cloud-native APIs utilized in this LMS:

| Training Area | Participant | When, Duration | Waiver Criteria |
| :--- | :--- | :--- | :--- |
| **MERN Stack with TypeScript** | QuangNVDE180682 | Week 1, 3 Days | Mandatory (Prior experience in JS/TS). |
| **MinIO S3 Client API** | QuangNVDE180682 | Week 2, 2 Days | Mandatory (Reviewing official MinIO SDK). |
| **Socket.io WebSocket Signaling**| QuangNVDE180682 | Week 4, 3 Days | Mandatory (Must build a working echo chat). |
| **AWS EC2 & Linux Deployments** | QuangNVDE180682 | Week 10, 2 Days | Mandatory (Must complete a successful build). |

---

### 3. Project Deliverables

| # | Deliverable | Due Date | Notes |
|---|---|---|---|
| 1 | Report 1 – Project Introduction Document | 2026-05-12 | Fully aligned with the LMS project. |
| 2 | Report 2 – Project Management Plan | 2026-05-26 | This document, customized for solo dev. |
| 3 | Software Requirement Specification (SRS) | 2026-06-15 | Details functional and non-functional specifications. |
| 4 | Database Schema & Initial Backend Mock | 2026-06-30 | MongoDB structure completely validated. |
| 5 | Interactive Frontend Views & S3 Storage | 2026-07-20 | MinIO streams and dashboard integrations. |
| 6 | Midterm Capstone Project Presentation | 2026-08-05 | Full system execution presentation. |
| 7 | Core Features Integration (Quiz, Chat, Attendance) | 2026-08-25 | Auto-saves, WebSockets, and Warnings crons. |
| 8 | Final Beta Release & Automated Tests Pass | 2026-09-10 | Jest test suite completes with >80% pass. |
| 9 | Production Deployment on AWS EC2 | 2026-09-25 | System published to public IP address. |
| 10| Final Capstone Thesis Presentation & Code Delivery | 2026-10-10 | Graduation delivery. |

---

### 4. Responsibility Assignments (RAM)

Since **QuangNVDE180682** is the **only member** of this project, the Responsibility Assignment Matrix (RACI) shows him carrying all operational and delivery roles.

*Role indicators: D - Do (Implement / Owner), R - Review (Audit), S - Support, I - Informed*

| Responsibility / Milestone | QuangNVDE180682 (Sole Developer) | Nguyen Trung Kien (Supervisor) |
| :--- | :---: | :---: |
| **Project Planning & Progress Tracking** | **D** | **R** |
| **System Architectural Design (MERN)** | **D** | **R** |
| **Database Schema Seeding (Mongoose)** | **D** | **I** |
| **Auth & Security Cookies Implementation** | **D** | **I** |
| **Enrollment 1-min Cooldown Controllers** | **D** | **I** |
| **MinIO S3 File Upload Boundaries** | **D** | **I** |
| **XML Question Bank Import & Auto-Saves** | **D** | **I** |
| **Socket.io Messaging & WebRTC Signaling** | **D** | **I** |
| **Roster Attendance Sheets & Cron alerts** | **D** | **I** |
| **Automated Test Script Writing (Jest)** | **D** | **R** |
| **AWS Production Deployment & Setup** | **D** | **R** |
| **Capstone Project Report Submissions** | **D** | **R** |

---

### 5. Project Communications

For a solo project, communications focus on reporting progress to the Supervisor and resolving technical blockers with peers.

| Communication Item | Who / Target | Purpose | When, Frequency | Type, Tool, Method(s) |
| :--- | :--- | :--- | :--- | :--- |
| **Weekly Progress Review** | Supervisor Nguyen Trung Kien | Report completed sprint tasks, verify requirements, and align project goals. | Weekly, every Friday | Face-to-Face meeting, Google Meet, email reports. |
| **Sprint Demo & Presentation** | Supervisor Nguyen Trung Kien | Present working code blocks (Midterm / Final checks). | Bi-weekly, end of Sprint | Live screen-share demonstration. |
| **Technical Peer Exchange** | Software Engineering Peers | Exchange solutions on technical blockers (WebSockets / WebRTC issues). | Ad-hoc, as needed | Discord channels, GitHub Issues discussions. |

---

## 6. Configuration Management

### 6.1 Document Management
- **Strategy**: All documents (including capstone reports, SRS, and API guides) are maintained directly as **Markdown (.md) files** inside the root directory of the project's source repository.
- **Benefits**: This ensures documents are version-controlled alongside code, preventing mismatch errors, and allows the single developer to track documentation edits using Git commits.

### 6.2 Source Code Management
- **Strategy**: The project utilizes **Git** hosted on a secure **GitHub repository**.
- **Branching Rules**:
  - `main`: Production-ready release branch, deployed directly to AWS EC2.
  - `develop`: Daily integration branch containing complete, tested features.
  - `feature/*`: Dedicated branches for individual modules (e.g., `feature/auth-cookies`, `feature/quiz-autosave`), merged into `develop` via pull requests after Jest test passes.

### 6.3 Tools & Infrastructures

| Category | Tools / Infrastructure | Technical Specification |
| :--- | :--- | :--- |
| **Tech Stack** | Frontend SPA Client | **React 19**, Vite, **Tailwind CSS v4**, Zustand, Jotai |
| | Backend Server Engine | **Node.js (v22.x)**, **ExpressJS** with **TypeScript** |
| **Database** | Core Persistent Engine | **MongoDB** database cluster accessed via **Mongoose ODM** |
| **File Storage** | Object Binaries Storage | **MinIO (S3 Client Node.js API)** |
| **WebSockets** | Real-Time Engine | **Socket.io** (under 100ms real-time chat latency) |
| **IDEs / Editors**| Main code editor | **Visual Studio Code** (with ESLint & Prettier extensions) |
| **Diagramming** | Structural Visuals | Mermaid.js (embedded in markdown), Draw.io |
| **Testing Suite** | Automated Tests | **Jest**, `supertest`, `mongodb-memory-server` |
| **Deployment** | Production Host Server | **Amazon Web Services (AWS) EC2** |
| **Version Control**| Source Repository | **GitHub** |
| **Mail Gateway** | Transactional Mail | **Resend API** (dispatches OTPs & 20% absence crons) |
