### b. Table Description

This table provides a description of all database collections (tables) used in the Learning Management System (LMS) project.

| No | Table | Description |
| :--- | :--- | :--- |
| 01 | User | Stores user account information, including authentication details, passwords, roles (Admin, Teacher, Student), and profile data. |
| 02 | Announcement | Stores global or course-specific announcements and notices broadcasted to users. |
| 03 | Assignment | Stores details of assignments created by teachers, including deadlines, max scores, and instructions. |
| 04 | Attendance | Stores student attendance records (present, absent, excused) for specific classes or sessions. |
| 05 | Blog | Stores blog posts or articles written by users for knowledge sharing within the system. |
| 06 | ChatRoom | Stores chat room configurations and participant lists for real-time messaging between users. |
| 07 | Course | Stores specific instances of classes being taught, including syllabus, description, and status. |
| 08 | CourseInvite | Stores invitation links or tokens used to invite students or teachers to securely join a specific course. |
| 09 | Enrollment | Tracks the enrollment records of students in specific courses, including their status (active, dropped). |
| 10 | Feedback | Stores feedback, reviews, and ratings submitted by students about courses or teachers. |
| 11 | Forum | Stores discussion forums associated with courses to facilitate community interaction. |
| 12 | ForumPost | Stores individual discussion threads or initial posts created within a specific forum. |
| 13 | ForumReply | Stores replies and comments made on specific forum posts. |
| 14 | Lesson | Stores lesson modules within a course, outlining the sequence and structure of the learning path. |
| 15 | LessonMaterial | Stores learning materials and resources (PDFs, videos, external links) attached to a lesson. |
| 16 | LessonProgress | Tracks individual student progress on a specific lesson, including completion status and time-on-task. |
| 17 | Major | Stores information about academic majors or departments that subjects belong to. |
| 18 | Message | Stores individual chat messages, including attachments, sent within real-time chat rooms. |
| 19 | Notification | Stores system-generated notifications sent to users to alert them about events (e.g., new grades, deadlines). |
| 20 | Quiz | Stores quizzes or tests configured by teachers, including settings like time limits, attempts allowed, and grading rules. |
| 21 | QuizAttempt | Tracks student attempts on a quiz, recording their selected answers, time taken, and final computed scores. |
| 22 | QuizQuestion | Stores individual questions (multiple-choice, essay, true/false) belonging to the question bank or a specific quiz. |
| 23 | Schedule | Stores regular, recurring weekly schedules and timetables for course sessions. |
| 24 | ScheduleException | Stores exceptions, overrides, or cancellations to the regular schedule (e.g., holidays, make-up classes). |
| 25 | Semester | Stores academic terms or semesters, defining the time boundaries for courses. |
| 26 | Session | Stores user login sessions for secure authentication, token management, and security tracking. |
| 27 | Specialist | Stores specializations or specialized fields of study associated with teachers to enforce teaching eligibility. |
| 28 | Subject | Stores generic subject definitions or templates (e.g., "Software Engineering") from which specific courses are derived. |
| 29 | Submission | Stores student submissions for assignments, including uploaded files and graded feedback from teachers. |
| 30 | TimeSlot | Stores predefined blocks of time (shifts) used consistently for scheduling classes or exams. |
| 31 | VerificationCode | Stores temporary, time-sensitive OTP codes sent to users for email verification or password reset flows. |
