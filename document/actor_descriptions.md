# LMS System User Requirements & Actors

This document defines the user requirements and provides structural descriptions of all system actors participating in the **Learning Management System (LMS)**, modeled according to official software design templates.

---

## 2. User Requirements

### 2.1 Actors

An actor is a person (or sometimes another software system or a hardware device) that interacts with the system to perform a use case. The actors in the LMS represent both primary human users who operate the system and secondary external software systems/services that the application coordinates with to fulfill tasks.

| # | Actor | Description |
| :-: | :--- | :--- |
| **1** | **Administrator** | System administrators responsible for high-level operations, including configuring university catalogs (Majors, Specialists, Subjects), setting prerequisite criteria maps, auditing user accounts, approving/rejecting teacher-created courses, and moderating feedback entries. |
| **2** | **Teacher** | Instructors responsible for creating and designing educational courses, structuring curriculum syllabus outlines, uploading lecture assets, configuring test quizzes, defining homework assignments, grading student submissions, recording daily attendance, and communicating with students. |
| **3** | **Student** | Enrolled learners who consume learning resources, read lesson lectures, download learning reference materials, perform online test examinations (quizzes), submit homework assignments, browse personal academic grades, view attendance histories, and interact via discussion forums and live chats. |
| **4** | **System Cron** | An autonomous background daemon that periodically checks class records, calculates student attendance thresholds, and automatically triggers warning notifications when an actor crosses critical administrative limits. |
| **5** | **External Email System** *(Resend Mail API)* | A secondary external software system that receives automated transactional requests from the LMS to deliver email notifications, including registration verification OTP codes, account password resets, and critical absence warnings. |
| **6** | **External Storage System** *(MinIO S3 Storage)* | A secondary external storage system responsible for storing and hosting all unstructured binary assets (e.g., lecture videos, PDF slide materials, student homework files, and evaluation feedback attachments) utilizing pre-signed secure URLs. |
| **7** | **WebSocket Gateway** *(Socket.io Hub)* | A secondary communication system that coordinates persistent, low-latency, bi-directional client-server connection tunnels for immediate message notifications, seen-states, and signaling metadata for WebRTC-based video call handshakes. |
