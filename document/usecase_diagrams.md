# LMS System Use Case Diagrams

This document contains visual Use Case Diagrams for each of the 11 functional modules of the **Learning Management System (LMS)**. The diagrams are generated using **Mermaid UML standard syntax** and mapped directly to the actual user stories, actor roles, API backend routes, and external systems in your codebase.

Each diagram explicitly highlights:
- **`<<include>>`** and **`<<extend>>`** relationships between use cases.
- **External Systems** (such as the Email System, S3 storage, and WebSockets gateway) as secondary actors on the right side of the diagrams.

---

## 👥 System Actors Directory

### Primary Actors (Left Side)
1. **👤 Student**: Enrolled learners who access lessons, submit assignments, take quizzes, discuss in forums, chat in real-time, and view grades.
2. **👤 Teacher**: Educators who build courses, publish lessons, upload lecture resources, manage weekly schedules, grade submissions, run exams, and moderate attendance.
3. **👤 Admin**: System administrators managing campus catalogs, approving teachers' courses, setting up subject prerequisites maps, auditing user accounts, and moderating feedbacks.
4. **⚙️ System Cron**: Autonomous automated daemons running background jobs, such as calculating thresholds and triggering attendance warning events.

### Secondary External Actors (Right Side)
1. **✉️ External Email System** *(Resend Mail API)*: Handles automated email transmissions (OTP activations, password resets, absence threshold warnings).
2. **💾 S3 Cloud Storage** *(MinIO Storage)*: Manages unstructured binaries (pdfs, video lectures, homework files, and review attachment uploads).
3. **⚡ WebSocket Gateway** *(Socket.io Gateway)*: Coordinates low-latency real-time bidirectional events (instant messaging seen-states, video calls signaling).

---

## 🗂️ Module Use Case Diagrams

### 1. Authentication & Account Management
Covers user registration, email activations, login sessions (JWT/Cookies), profile dashboards, and administrative user controls.

```mermaid
graph LR
    %% Primary Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin Console"]

    %% Usecase Boundary
    subgraph AuthSystem ["Authentication & Account System"]
        UC1(["UC-01: Register Account"])
        UC2(["UC-02: Verify Email via OTP"])
        UC3(["UC-03: Login & Maintain Session"])
        UC4(["UC-04: Forgot / Reset Password"])
        UC5(["UC-05: Update Profile & User Bio"])
        UC6(["UC-06: Console User Management (CRUD)"])
    end

    %% Secondary Actors
    EmailSystem["✉️ External Email System<br/>(Resend Mail API)"]

    %% Primary Relations
    Student --> UC1
    Student --> UC3
    Student --> UC4
    Student --> UC5

    Teacher --> UC3
    Teacher --> UC4
    Teacher --> UC5

    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6

    %% Include & Extend
    UC1 -. "<<include>>" .-> UC2
    UC4 -. "<<include>>" .-> UC2

    %% Secondary Relations
    UC2 --> EmailSystem
    UC4 --> EmailSystem
```

---

### 2. Course & Class Section Management
Enables syllabus definitions, course curation, administrative specialty validation checks, and splitting enrollments into parallel subsections.

```mermaid
graph LR
    %% Primary Actors
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]
    Student["👤 Student"]

    %% Usecase Boundary
    subgraph CourseSystem ["Course & Class Management"]
        UC7(["UC-07: Create & Edit Course (Drafts)"])
        UC8(["Build Syllabus & Curriculum Tree"])
        UC9(["UC-08: Verify Specialization Alignment"])
        UC10(["Review & Approve/Reject Course Drafts"])
        UC11(["UC-09: Class Section Allocation"])
        UC12(["UC-10: View Course Completion Stats"])
    end

    %% Primary Relations
    Teacher --> UC7
    Teacher --> UC11
    Teacher --> UC12

    Admin --> UC10
    Admin --> UC11
    Admin --> UC12

    Student --> UC8

    %% Include & Extend
    UC7 -. "<<extend>>" .-> UC8
    UC10 -. "<<include>>" .-> UC9
```

---

### 3. Enrollment & Course Invites
Coordinates student self-enrollments governed by cooldowns and capacity checks, as well as sharing secure, expiring invite links.

```mermaid
graph LR
    %% Primary Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]

    %% Usecase Boundary
    subgraph EnrollmentSystem ["Enrollment & Course Invite System"]
        UC13(["UC-11: Self-Enroll/Unenroll Courses"])
        UC14(["UC-12: Capacity & Cooldown Checks"])
        UC15(["UC-14: Generate Secure Invite Link"])
        UC16(["UC-15: Join directly via invite token"])
        UC17(["UC-16: Manage Invite Links (Toggle/Delete)"])
    end

    %% Primary Relations
    Student --> UC13
    Student --> UC16

    Teacher --> UC15
    Teacher --> UC17

    Admin --> UC15
    Admin --> UC17

    %% Include & Extend
    UC13 -. "<<include>>" .-> UC14
    UC16 -. "<<include>>" .-> UC13
```

---

### 4. Subjects & Prerequisites map
Manages the university's academic subject index, automated text searches, slug building, and mapping prerequisite check routes.

```mermaid
graph LR
    %% Primary Actors
    Admin["👤 Admin"]
    Teacher["👤 Teacher"]

    %% Usecase Boundary
    subgraph CatalogSystem ["Subject Catalog & Prerequisites Map"]
        UC18(["UC-17: Manage Subject (CRUD)"])
        UC19(["UC-18: Search & Filter Directory"])
        UC20(["UC-19: View Subject Detailed Metadata"])
        UC21(["UC-20: Generate Unique Slugs & Codes"])
        UC22(["UC-21: Activate/Deactivate/Delete Subjects"])
        UC23(["UC-22: Map Prerequisite Dependencies"])
    end

    %% Primary Relations
    Admin --> UC18
    Admin --> UC19
    Admin --> UC20
    Admin --> UC22
    Admin --> UC23

    Teacher --> UC19
    Teacher --> UC20

    %% Include & Extend
    UC18 -. "<<include>>" .-> UC21
    UC22 -. "<<extend>>" .-> UC18
```

---

### 5. Lessons & Learning Progress
Coordinates lecture curriculums, uploading educational documents directly to MinIO S3, tracking study times, and reporting lesson completion states.

```mermaid
graph LR
    %% Primary Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]

    %% Usecase Boundary
    subgraph LessonSystem ["Lessons & Progress Tracking System"]
        UC24(["UC-23: Read Lesson & Download files"])
        UC24b(["Download reference materials"])
        UC25(["UC-24: Lesson Plan CRUD (Builder)"])
        UC26(["UC-25: S3 Lecture Material Upload"])
        UC27(["UC-26: Role-based Progress Logging"])
        UC28(["UC-27: Track cumulative timeSpentSeconds"])
        UC29(["UC-28: Review Roster Progress Reports"])
    end

    %% Secondary Actors
    StorageSystem["💾 S3 Cloud Storage<br/>(MinIO Storage API)"]

    %% Primary Relations
    Student --> UC24
    Student --> UC28

    Teacher --> UC25
    Teacher --> UC27
    Teacher --> UC29

    Admin --> UC27
    Admin --> UC29

    %% Include & Extend
    UC24 -. "<<extend>>" .-> UC24b
    UC25 -. "<<extend>>" .-> UC26

    %% Secondary Relations
    UC24b --> StorageSystem
    UC26 --> StorageSystem
```

---

### 6. Quiz & Questions Bank
Facilitates importing/exporting questions in XML, mixing randomized questions, auto-saving exam answers, ban overrides, and grading monitors.

```mermaid
graph LR
    %% Primary Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]

    %% Usecase Boundary
    subgraph QuizSystem ["Quiz & Questions Bank System"]
        UC30(["UC-30/31: XML Questions Bank Import/Export"])
        UC31(["UC-33: Questions Pool CRUD & Bulk Delete"])
        UC32(["UC-34: Scramble Random Questions Generator"])
        UC33(["UC-35/36/37: Create/Edit/Delete Quiz Settings"])
        UC34(["UC-43: Take Quiz"])
        UC34b(["Real-time Auto-save answers"])
        UC35(["UC-38: Review Student attempts"])
        UC36(["UC-39: Ban Cheating student in real-time"])
        UC37(["UC-40/41: Regrade attempts"])
        UC37b(["Modify student scores"])
        UC38(["UC-42: View Quiz Score Stats & Distributions"])
    end

    %% Primary Relations
    Student --> UC34

    Teacher --> UC30
    Teacher --> UC31
    Teacher --> UC32
    Teacher --> UC33
    Teacher --> UC35
    Teacher --> UC36
    Teacher --> UC37
    Teacher --> UC38

    Admin --> UC30
    Admin --> UC31
    Admin --> UC33
    Admin --> UC35
    Admin --> UC37
    Admin --> UC38

    %% Include & Extend
    UC33 -. "<<include>>" .-> UC32
    UC34 -. "<<include>>" .-> UC34b
    UC37 -. "<<extend>>" .-> UC37b
```

---

### 7. Assignments & Submissions Grading
Manages assignment postings, student homework uploads to MinIO S3, essay grading feedback, transcripts, and final grading reports.

```mermaid
graph LR
    %% Primary Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]

    %% Usecase Boundary
    subgraph GradingSystem ["Assignments & Submissions Grading"]
        UC39(["UC-44/45: Create & Manage Assignments"])
        UC39b(["Upload resource attachments"])
        UC40(["UC-46: Submit Homework File"])
        UC41(["UC-47: Grade essay & Write feedback"])
        UC42(["UC-48: Review unified Student Transcript"])
        UC43(["UC-49: View Assignment score distribution"])
        UC44(["UC-50: Generate Final Course Grade Reports"])
    end

    %% Secondary Actors
    StorageSystem["💾 S3 Cloud Storage<br/>(MinIO Storage API)"]

    %% Primary Relations
    Student --> UC40
    Student --> UC42

    Teacher --> UC39
    Teacher --> UC41
    Teacher --> UC43
    Teacher --> UC44

    Admin --> UC39
    Admin --> UC43
    Admin --> UC44

    %% Include & Extend
    UC39 -. "<<extend>>" .-> UC39b
    UC40 -. "<<include>>" .-> UC42

    %% Secondary Relations
    UC39b --> StorageSystem
    UC40 --> StorageSystem
```

---

### 8. Attendance & Schedules
Coordinates room slots planning, classroom roster call logs, locking late updates, CSV exports, and automated absence warnings.

```mermaid
graph LR
    %% Primary Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]
    System["⚙️ System Cron"]

    %% Usecase Boundary
    subgraph AttendanceSystem ["Attendance & Scheduling System"]
        UC45(["UC-51: Timetable Planning & Clashes Check"])
        UC46(["UC-52/53: Mark & Update daily attendance"])
        UC46b(["Enforce Access-time Lock"])
        UC47(["UC-54: Role-restricted Attendance deletion"])
        UC48(["UC-55: View Personal attendance ledger"])
        UC49(["UC-56/57: Look up class roster attendances"])
        UC50(["UC-58: Export Logs (CSV / JSON)"])
        UC51(["UC-59/60: Aggregate Absence Stats"])
        UC52(["UC-61: Send email alerts on >20% absences"])
    end

    %% Secondary Actors
    EmailSystem["✉️ External Email System<br/>(Resend Mail API)"]

    %% Primary Relations
    Student --> UC48

    Teacher --> UC46
    Teacher --> UC49
    Teacher --> UC51

    Admin --> UC45
    Admin --> UC46
    Admin --> UC47
    Admin --> UC49
    Admin --> UC50
    Admin --> UC51

    System --> UC52

    %% Include & Extend
    UC46 -. "<<include>>" .-> UC46b
    UC46 -. "<<extend>>" .-> UC52

    %% Secondary Relations
    UC52 --> EmailSystem
```

---

### 9. Forums, Blogs & Live Chat
Fosters social learning through discussion boards, instant messages, and WebSockets-based video calls.

```mermaid
graph LR
    %% Primary Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]

    %% Usecase Boundary
    subgraph SocialSystem ["Forums, Blogs & Real-time Chat"]
        UC53(["UC-62: Post & Reply in Course Forum"])
        UC53b(["Upload forum attachments"])
        UC54(["UC-63: Direct & Group Instant Messages"])
        UC55(["WebRTC Video Call Signaling"])
        UC56(["Publish Public Blog updates & articles"])
    end

    %% Secondary Actors
    StorageSystem["💾 S3 Cloud Storage<br/>(MinIO Storage API)"]
    WebSocketSystem["⚡ WebSocket Gateway<br/>(Socket.io Gateway)"]

    %% Primary Relations
    Student --> UC53
    Student --> UC54
    Student --> UC55

    Teacher --> UC53
    Teacher --> UC54
    Teacher --> UC55

    Admin --> UC53
    Admin --> UC54
    Admin --> UC55
    Admin --> UC56

    %% Include & Extend
    UC53 -. "<<extend>>" .-> UC53b
    UC54 -. "<<include>>" .-> UC55

    %% Secondary Relations
    UC53b --> StorageSystem
    UC54 --> WebSocketSystem
    UC55 --> WebSocketSystem
```

---

### 10. Feedback System
Tracks anonymous course evaluations and teacher performance ratings, auditing reviews, and compiling averages.

```mermaid
    graph LR
        %% Actors
        Student["👤 Student"]
        Teacher["👤 Teacher"]
        Admin["👤 Admin"]

        %% Usecase Boundary
        subgraph FeedbackSystem ["Course Evaluations & Feedback System"]
            UC57(["UC-64: Rate Course/Teacher (1-5 Stars)"])
            UC57b(["Attach supporting evidence files"])
            UC58(["UC-66: View Personal Feedbacks Ledger"])
            UC59(["UC-68: Roster teacher evaluations console"])
            UC60(["UC-69: View evaluations about self"])
            UC61(["UC-70/71: Delete inappropriate feedbacks"])
        end

        %% Secondary Actors
        StorageSystem["💾 S3 Cloud Storage<br/>(MinIO Storage API)"]

        %% Relations
        Student --> UC57
        Student --> UC58
        Student --> UC61

        Teacher --> UC60

        Admin --> UC59
        Admin --> UC61

        %% Include & Extend
        UC57 -. "<<extend>>" .-> UC57b

        %% Secondary Relations
        UC57b --> StorageSystem
```

---

### 11. Announcements & Notifications
Ensures prompt broadcasts of news, course changes, and grades via notifications and bulletin boards.

```mermaid
graph LR
    %% Actors
    Student["👤 Student"]
    Teacher["👤 Teacher"]
    Admin["👤 Admin"]

    %% Usecase Boundary
    subgraph NotificationSystem ["Announcements & Push Alerts"]
        UC62(["UC-72: Create Bulletins (Campus/Class)"])
        UC63(["UC-73: Read Active Bulletins"])
        UC64(["UC-74/75: Edit & Delete bulleting history"])
        UC65(["Receive System Push Notifications"])
    end

    %% Relations
    Student --> UC63
    Student --> UC65

    Teacher --> UC62
    Teacher --> UC63
    Teacher --> UC64
    Teacher --> UC65

    Admin --> UC62
    Admin --> UC63
    Admin --> UC64
    Admin --> UC65
```
