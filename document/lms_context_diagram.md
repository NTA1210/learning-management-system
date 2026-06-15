# Sơ đồ ngữ cảnh (Context Diagram) - Learning Management System (LMS)

Tài liệu này cung cấp sơ đồ ngữ cảnh (Context Diagram - DFD Level 0) và phân tích các luồng dữ liệu của hệ thống quản lý học tập (Learning Management System - LMS) dựa trên mã nguồn thực tế của dự án.

---

## 1. Các thành phần trong hệ thống ngữ cảnh

Hệ thống LMS trung tâm tương tác với **3 Đối tác bên ngoài (External Actors)** và **3 Hệ thống hỗ trợ (External Systems)**:

### Tác nhân bên ngoài (External Actors)
*   **Học sinh/Sinh viên (Student):** Người dùng học tập, làm bài kiểm tra (quizzes), nộp bài tập (assignments), xem thời khóa biểu (schedule), điểm danh (attendance), trao đổi trên diễn đàn (forum), viết blog, chat và gọi video call (chatRoom).
*   **Giáo viên/Giảng viên (Teacher):** Người quản lý khóa học (courses), bài học (lessons), đăng tải tài liệu học tập (lesson materials), soạn đề kiểm tra (quizzes), chấm điểm bài tập (submissions), điểm danh học viên (attendance), tạo lịch học/phân ca (schedules/sessions), và phản hồi đánh giá của học viên.
*   **Quản trị viên (Admin):** Người quản lý tổng thể hệ thống bao gồm: Quản lý ngành học (majors), chuyên ngành (specialists), học kỳ (semesters), các môn học (subjects), tài khoản người dùng (users - Admin/Teacher/Student), các ca học chuẩn (time slots), và giám sát hoạt động hệ thống.

### Hệ thống tích hợp ngoài (External Systems)
*   **Hệ thống cơ sở dữ liệu (MongoDB & Mongoose):** Lưu trữ toàn bộ dữ liệu nghiệp vụ của hệ thống (User, Course, Enrollment, Lesson, Quiz, Assignment, Submission, Forum, Attendance, ChatRoom,...).
*   **Dịch vụ lưu trữ tệp (MinIO / S3 Object Storage):** Lưu trữ và phân phối các tệp tin tải lên như: tài liệu bài học (lesson materials), tệp tin bài tập nộp (submissions), ảnh đại diện (avatar_url), v.v.
*   **Dịch vụ gửi Email (Resend Mailer):** Gửi mã OTP xác thực (Verification Codes), thư mời tham gia khóa học (Course Invitation), và các thông báo quan trọng.
*   **Hệ thống thời gian thực (Socket.io Engine):** Xử lý tín hiệu gọi video (Video Call Signaling), tin nhắn tức thời (Chat Message), và thông báo thời gian thực (Real-time Notifications).

---

## 2. Sơ đồ ngữ cảnh hệ thống (Mermaid Diagram)

Dưới đây là sơ đồ ngữ cảnh biểu diễn dòng thông tin giữa các tác nhân và hệ thống LMS:

```mermaid
graph TD
    %% Định nghĩa các Style
    classDef actor fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef system fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef lmsCore fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,stroke-dasharray:5 5;

    %% Định nghĩa các nút
    STUDENT((Học sinh / Student)):::actor
    TEACHER((Giáo viên / Teacher)):::actor
    ADMIN((Quản trị viên / Admin)):::actor

    LMS["Hệ thống trung tâm LMS<br/>(BE ExpressJS + FE Vite/React)"]:::lmsCore

    DB[(MongoDB Database)]:::system
    STORAGE[(MinIO Storage)]:::system
    EMAIL[(Resend Mail Service)]:::system
    SOCKET[(Socket.io Engine)]:::system

    %% Dòng dữ liệu từ Học sinh (Student)
    STUDENT -- "1. Đăng ký/Đăng nhập, Thông tin cá nhân" --> LMS
    STUDENT -- "2. Xem bài học, tải tài liệu học tập" --> LMS
    STUDENT -- "3. Làm bài kiểm tra (Quiz), nộp bài tập" --> LMS
    STUDENT -- "4. Điểm danh, xem lịch học, gửi feedback" --> LMS
    STUDENT -- "5. Gửi tin nhắn chat, post bài thảo luận forum, blog" --> LMS
    LMS -- "Phản hồi kết quả học tập, bài làm, điểm số, lịch học, thông báo" --> STUDENT

    %% Dòng dữ liệu từ Giáo viên (Teacher)
    TEACHER -- "1. Quản lý khóa học, bài học, tài liệu" --> LMS
    TEACHER -- "2. Soạn đề kiểm tra (Quiz), đăng bài tập" --> LMS
    TEACHER -- "3. Chấm điểm bài tập nộp, xem danh sách bài thi" --> LMS
    TEACHER -- "4. Quản lý lịch học, ca học, điểm danh" --> LMS
    TEACHER -- "5. Viết thông báo khóa học, phản hồi học sinh" --> LMS
    LMS -- "Danh sách bài nộp, thống kê điểm số, tiến độ học viên" --> TEACHER

    %% Dòng dữ liệu từ Quản trị viên (Admin)
    ADMIN -- "1. Quản trị Tài khoản (Users)" --> LMS
    ADMIN -- "2. Quản lý Môn học, Học kỳ, Ngành học" --> LMS
    ADMIN -- "3. Thiết lập ca học, Chuyên ngành" --> LMS
    LMS -- "Thống kê hệ thống, Nhật ký hoạt động" --> ADMIN

    %% Dòng dữ liệu với hệ thống ngoài
    LMS <--> "Lưu/Truy xuất dữ liệu nghiệp vụ" DB
    LMS <--> "Tải lên/Tải về tài liệu, bài nộp, avatar" STORAGE
    LMS -- "Gửi mã OTP, Thư mời khóa học" --> EMAIL
    LMS <--> "Truyền tín hiệu video, chat, thông báo realtime" SOCKET

    %% Kết nối từ hệ thống ngoài đến người dùng qua cổng trung gian
    SOCKET -.-> |"Thông báo realtime & video call"| STUDENT
    SOCKET -.-> |"Thông báo realtime & video call"| TEACHER
    EMAIL -.-> |"Thư mời & OTP"| STUDENT
    EMAIL -.-> |"Thư mời & OTP"| TEACHER
```

---

## 3. Bản đồ Luồng Dữ liệu Chi tiết (Data Flow Matrix)

Dưới đây là chi tiết về các thông tin trao đổi qua lại giữa hệ thống trung tâm LMS và các tác nhân/hệ thống liên kết:

### 3.1. Các Tác Nhân (Actors)

| Tác nhân gửi | Dữ liệu Đầu vào (Input to LMS) | Tác nhân nhận | Dữ liệu Đầu ra (Output from LMS) |
| :--- | :--- | :--- | :--- |
| **Student** | • Thông tin đăng nhập, đăng ký<br/>• Yêu cầu vào học khóa học/bài học<br/>• Bài thi trắc nghiệm (Quiz Attempts)<br/>• Tệp tin bài tập lớn (Submissions)<br/>• Phản hồi/Đánh giá môn học (Feedback)<br/>• Bài đăng forum, bình luận, bài blog<br/>• Tin nhắn chat cá nhân/nhóm | **Student** | • Trạng thái đăng nhập & Token xác thực<br/>• Tài liệu học tập (Lesson Materials)<br/>• Kết quả kiểm tra trắc nghiệm tức thời<br/>• Điểm số & nhận xét từ giáo viên<br/>• Lịch học & trạng thái điểm danh cá nhân<br/>• Luồng chat, luồng video call realtime |
| **Teacher** | • Thông tin khóa học, bài học mới<br/>• Tài liệu đính kèm (Slide, PDF, Video)<br/>• Ngân hàng câu hỏi & Đề kiểm tra (Quiz)<br/>• Điểm số & nhận xét bài tập học viên<br/>• Lịch dạy học & Điểm danh học viên lớp học<br/>• Thông báo khóa học (Announcements) | **Teacher** | • Báo cáo tiến độ học tập của từng học viên<br/>• Danh sách học viên nộp bài & tệp đính kèm<br/>• Danh sách và lịch sử điểm danh của lớp<br/>• Ý kiến đánh giá môn học (Feedback) từ sinh viên |
| **Admin** | • Danh sách tài khoản tạo mới (Admin/Teacher/Student)<br/>• Danh sách Môn học (Subjects), Ngành (Majors)<br/>• Cấu hình chuyên ngành (Specialists), Học kỳ (Semesters)<br/>• Cấu hình ca học mẫu (Time Slots) | **Admin** | • Danh sách người dùng hệ thống kèm trạng thái<br/>• Thống kê lượng truy cập, học tập toàn hệ thống<br/>• Báo cáo hệ thống và log lỗi (nếu có) |

### 3.2. Các Hệ Thống Tích Hợp (Systems)

| Tác nhân liên kết | Hướng tương tác | Luồng dữ liệu trao đổi |
| :--- | :---: | :--- |
| **MongoDB Database** | Hai chiều | • **Gửi từ LMS:** Truy vấn CRUD (Create, Read, Update, Delete) cho các collection: `users`, `courses`, `lessons`, `quizzes`, `submissions`, `schedules`, `chats`,...<br/>• **Nhận về LMS:** Kết quả truy vấn dữ liệu dạng JSON Documents thông qua Mongoose ORM. |
| **MinIO Object Storage** | Hai chiều | • **Gửi từ LMS:** Tải lên luồng nhị phân (Buffer) các file đính kèm với mã hash định danh duy nhất (UUID) vào các prefix phù hợp.<br/>• **Nhận về LMS:** Trả về Public URL dạng `https://[Minio_Endpoint]/[Bucket]/[Key]` hoặc Link ký nhận tải về có thời hạn (Presigned URL) cho client. |
| **Resend Mail Service** | Một chiều | • **Gửi từ LMS:** Gửi API Payload chứa thông tin: địa chỉ email nhận (`to`), tiêu đề (`subject`), nội dung text/HTML (`html` được render từ template mẫu của hệ thống). Dịch vụ Resend sẽ thực thi gửi email thực tế đến người dùng. |
| **Socket.io Engine** | Hai chiều | • **Tương tác:** Tạo kênh kết nối song song WebSockets. LMS gửi các gói tin sự kiện như gửi tin nhắn chat, yêu cầu kết nối Video Call (SDP offer/answer), hoặc kích hoạt thông báo realtime để hệ thống Socket.io phân phối ngay lập tức tới máy trạm của các User tương ứng đang online. |
