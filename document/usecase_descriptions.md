## 2.2.2 Descriptions
This part describes the use cases of the Learning Management System (LMS). The use cases are categorized by business modules, with actor roles meticulously aligned to the Use Case Diagrams.

### 1. Hệ thống Xác thực & Quản lý Tài khoản (Authentication & Users)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **01** | Register Account | Student | Register an account with email and password |
| **02** | Verify Email | Student, Teacher, Admin | Verify email via a verification code |
| **03** | Log In | Student, Teacher, Admin | Log in and maintain secure session (JWT + Cookies) |
| **04** | Reset Password | Student, Teacher, Admin | Reset password via email verification code |
| **05** | Update Profile | Student, Teacher, Admin | Update user profile details and avatar |
| **06** | User Management | Admin | Console user management and list users for courses |

### 2. Quản lý Khóa học & Lớp học (Course & Class Management)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **07** | Create and Edit Courses | Teacher | Create and edit courses |
| **08** | Verify Specialization | Admin | Ensure only teachers with correct specialization can teach a course |
| **09** | Divide Class Sections | Teacher, Admin | Divide students/teachers into small classes (Sections) |
| **10** | View Course Statistics | Teacher, Admin | Create and view course statistics |

### 3. Đăng ký Môn học & Thư mời (Enrollment & Course Invites)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **11** | Enroll/Unenroll Course | Student | Enroll or unenroll (cancel) from courses |
| **12** | Enroll with Rules | Student | Enroll with anti-spam (cooldown 1 min), capacity & re-enrollment rules |
| **13** | Manage Enrollment | Admin, Teacher | Improved enrollment management with validation & formatted responses |
| **14** | Create Invite Link | Teacher, Admin | Create secure course invite link (with expiry & usage limits) |
| **15** | Join via Invite Link | Student | Join course via invite link token without manual approval |
| **16** | Manage Invite Links | Teacher, Admin | Manage (view, enable/disable, delete) course invite links |

### 4. Quản lý Môn học & Điều kiện tiên quyết (Subjects & Prerequisites)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **17** | Manage Subjects | Admin | Manage subjects for courses |
| **18** | List Subjects | Admin, Teacher | List subjects with paging, search, specialist, active filters |
| **19** | View Subject Details | Admin, Teacher | View subject details by ID or Slug |
| **20** | Create Subject | Admin | Create new subjects with uniqueness rules (name/code/slug) |
| **21** | Update/Delete Subject | Admin | Update/activate/deactivate/delete subjects |
| **22** | Manage Prerequisites | Admin | Manage prerequisite subject dependencies |

### 5. Quản lý Bài học & Tiến độ (Lessons & Learning Progress)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **23** | View Lessons | Student | View lessons and download learning materials (PDF, Video...) |
| **24** | Manage Lessons | Teacher | Manage lessons (create, edit, delete, list) |
| **25** | Upload Lesson Materials | Teacher | Upload and manage lesson materials (PDF, slides, video) via MinIO |
| **26** | View Lesson Progress | Teacher, Admin | View lesson progress with role-based access |
| **27** | Track Time-on-task | Student | Track time-on-task / add learning time for a lesson |
| **28** | Review Progress | Teacher, Admin | Review student's course-level lesson progress |
| **29** | Log Access Timestamps | System | Include last access timestamps in lesson progress data |

### 6. Ngân hàng Câu hỏi & Đề thi (Quiz & Questions Bank)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **30** | Import Questions | Teacher, Admin | Import XML questions file to create questions bank |
| **31** | Export Questions | Teacher, Admin | Export questions bank for subject to XML file |
| **32** | Filter Questions | Teacher | Filter questions by page, limit, subjectId, dates, type, sort |
| **33** | Manage Questions | Teacher, Admin | Manage (Create, Update, Delete & Bulk Delete) questions |
| **34** | Generate Random Questions | Teacher | Generate random questions from bank for a quiz |
| **35** | Create Quiz | Teacher, Admin | Create a new quiz and assign to students |
| **36** | Update Quiz | Teacher, Admin | Update quiz questions and details |
| **37** | Delete Quiz | Teacher, Admin | Delete quiz to remove unwanted tests |
| **38** | Observe Attempts | Teacher, Admin | Observe students' quiz attempts |
| **39** | Ban Cheating Students | Teacher | Ban cheating students during testing |
| **40** | Manual Quiz Grading | Teacher, Admin | Manual quiz grading (re-grade when connection failures occur) |
| **41** | Update Scores | Teacher, Admin | Update/refine scores of student's attempts |
| **42** | View Score Statistics | Teacher, Admin | View quiz overall score statistics |
| **43** | Auto-save Answers | Student | Auto-save / remember answers when doing quiz to prevent data loss |

### 7. Bài tập lớn & Chấm điểm (Assignments & Submissions Grading)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **44** | Create Assignments | Teacher, Admin | Create assignments with deadlines |
| **45** | Manage Assignments | Teacher, Admin | Edit and manage assignments |
| **46** | Submit Assignments | Student | Submit assignments and track submission progress |
| **47** | Grade Submissions | Teacher | Manually grade essay-type submissions and provide feedback |
| **48** | View Transcripts | Student | View all grades (transcripts) in one place |
| **49** | View Grade Statistics | Teacher, Admin | View grade statistics and reports of assignments/courses |
| **50** | View Study Result Statistics | Teacher, Admin | View study result statistics of students in a course |

### 8. Lịch học & Điểm danh (Attendance & Schedules)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **51** | Manage Weekly Schedules | Admin | Global schedules weekly with customizable daily time slots |
| **52** | Mark Attendance | Teacher, Admin | Mark student attendance for each session/day |
| **53** | Update Attendance | Teacher, Admin | Update attendance records with time restrictions |
| **54** | Delete Attendance | Admin | Delete attendance records with role-based restrictions |
| **55** | View Personal Attendance | Student | View personal attendance history |
| **56** | View Student Attendance | Teacher, Admin | View specific student's attendance history |
| **57** | List All Attendance | Teacher, Admin | List all attendance records with filters and summary |
| **58** | Export Attendance Reports | Admin | Export attendance reports in CSV/JSON formats |
| **59** | View Course Attendance Stats | Teacher, Admin | View course attendance statistics |
| **60** | View Student Attendance Stats | Teacher, Admin | View individual student statistics in a course |
| **61** | Send Absence Notification | System Cron | Send absence notification emails to students |

### 9. Kênh thảo luận & Trò chuyện thời gian thực (Forums, Blogs & Live Chat)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **62** | Post & Reply in Forum | Student, Teacher, Admin | Post and reply to discussions in each course forum |
| **63** | Real-time Chat & Video Calls | Student, Teacher, Admin | Real-time chat & video calls with attachments |

### 10. Hệ thống Phản hồi & Đánh giá (Feedback System)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **64** | Send Feedback | Student | Send feedback about course/teacher with rating & file upload |
| **65** | Manage Feedbacks | Admin | View, filter, and manage all feedbacks in the system |
| **66** | View Own Submitted Feedbacks | Student | View all feedbacks submitted by self |
| **67** | View Feedback Details | Admin, Teacher | View details of a specific feedback |
| **68** | View Teacher Feedbacks | Admin | View feedbacks about any teacher with average rating |
| **69** | View Feedbacks About Self | Teacher | View all feedbacks about self with average rating |
| **70** | Delete Own Feedback | Student, Admin | Delete own feedback |
| **71** | Delete Inappropriate Feedback | Student, Admin | Delete any inappropriate feedback |

### 11. Quản lý Thông báo & Tin tức (Announcements & Notifications)
| ID | Use Case | Actors | Use Case Description |
| :--- | :--- | :--- | :--- |
| **72** | Create Announcements | Teacher, Admin | Create Announcements (course-wide or system-wide) |
| **73** | View Announcements | Student, Teacher, Admin | View course or system announcements |
| **74** | Update Announcements | Teacher, Admin | Update announcements |
| **75** | Delete Announcements | Teacher, Admin | Delete outdated announcements |
