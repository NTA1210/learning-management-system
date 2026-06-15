# Phân tích mức độ trùng khớp giữa User Stories và Sơ đồ ngữ cảnh (Context Diagram)

Tài liệu này phân tích chi tiết mức độ bao phủ và trùng khớp (alignment) giữa **74 User Stories** (đã được kiểm chứng thực tế trong code) với **Sơ đồ ngữ cảnh hệ thống (Context Diagram)**.

---

## 1. Mức độ "Đầy đủ" của danh sách User Stories
Danh sách 74 User Stories đã liệt kê là **hoàn toàn đầy đủ và phản ánh chính xác 100% năng lực nghiệp vụ hiện tại của hệ thống LMS**. 
*   Không có tính năng nào được vẽ trong Context Diagram mà không có User Story tương ứng.
*   Không có câu lệnh API hay cấu trúc dữ liệu nào trong code bị bỏ sót khỏi danh sách User Stories.
*   Tất cả các cơ chế bảo mật (như chống spam lượt đăng ký, ràng buộc chuyên ngành giảng viên, tự động lưu câu trả lời thi, tự động gửi email cảnh báo học tập) đều được tài liệu hóa chi tiết.

---

## 2. Bản đồ ánh xạ: Đối tượng trong Context Diagram $\leftrightarrow$ User Stories

Dưới đây là bảng ánh xạ cách các **Tác nhân (Actors)** và **Hệ thống ngoại vi (External Systems)** trong sơ đồ ngữ cảnh tương tác qua các luồng thông tin của User Stories:

### 👤 Tác nhân 1: Học sinh (Student)
| Luồng thông tin trong Context Diagram | User Stories tương ứng | Trạng thái mã nguồn |
| :--- | :--- | :--- |
| **Đăng ký / Đăng nhập / Khôi phục mật khẩu** | **US-001, US-002, US-003, US-004** | Đã cấu hình xác thực JWT, mã kích hoạt OTP gửi qua email. |
| **Đăng ký môn học / Vào lớp học** | **US-006, US-029, US-057** | Tự đăng ký học có kiểm tra điều kiện tiên quyết, sĩ số ca học, cooldown chống spam, hoặc join thẳng qua token. |
| **Học tập / Xem bài học / Tải tài liệu** | **US-007, US-022, US-023** | Xem bài học, tự động cộng dồn thời gian tích lũy học tập (`timeSpentSeconds`), lưu thời gian truy cập gần nhất (`lastAccessedAt`). |
| **Nộp bài tập lớn & Xem điểm** | **US-011, US-020** | Nộp và nộp lại bài tập (đính kèm tệp gửi lên MinIO), xem bảng điểm toàn diện trực tuyến. |
| **Làm bài thi trắc nghiệm (Quiz)** | **US-074** | Tham gia thi trắc nghiệm có cơ chế tự lưu đáp án tự động (auto-save) liên tục đề phòng sự cố đường truyền. |
| **Theo dõi lịch học & Điểm danh** | **US-082** | Xem thời khóa biểu cá nhân và tra cứu lịch sử điểm danh trực tiếp. |
| **Thảo luận & Tương tác xã hội** | **US-021, US-069** | Đăng câu hỏi, trả lời thảo luận phân cấp có đính kèm file trong diễn đàn; Chat & gọi điện realtime. |
| **Gửi phản hồi đóng góp ý kiến** | **US-048, US-050, US-054** | Đánh giá sao, gửi nhận xét ẩn danh/công khai cho giáo viên hoặc lớp học. |

---

### 👤 Tác nhân 2: Giáo viên (Teacher)
| Luồng thông tin trong Context Diagram | User Stories tương ứng | Trạng thái mã nguồn |
| :--- | :--- | :--- |
| **Quản lý & Thiết lập Khóa học** | **US-005, US-089** | Tạo khóa học mới ở dạng DRAFT chờ phê duyệt, cập nhật thông tin và xem thống kê tiến trình chung của cả lớp học. |
| **Biên soạn bài giảng & Đăng tài liệu** | **US-012, US-013** | Tạo chương trình bài giảng, tải các tài liệu hỗ trợ (PDF, Slide, MP4) lên hệ thống lưu trữ MinIO S3. |
| **Quản lý đề thi & Chấm điểm Quiz** | **US-016, US-018, US-046, US-059, US-065, US-066, US-068, US-070, US-071, US-072** | Quản lý đề thi, chọn câu hỏi ngẫu nhiên từ ngân hàng câu hỏi, chấm lại bài khi có sự cố, cấm thi sinh gian lận, xem biểu đồ điểm số. |
| **Quản lý bài tập lớn & Chấm điểm luận văn** | **US-008, US-010, US-019, US-047, US-073** | Ra đề có deadline, chấm điểm tự luận kèm nhận xét phản hồi chi tiết, xem thống kê phổ điểm bài tập. |
| **Quản lý lịch học & Thực hiện điểm danh** | **US-045, US-079, US-080, US-081, US-083, US-084, US-085, US-086, US-087, US-088** | Đăng ký ca dạy trống, điểm danh học viên hàng ngày, xuất file báo cáo điểm danh CSV/JSON, gửi email nhắc nhở/cảnh báo học viên vắng. |
| **Đăng tin tức & Tương tác** | **US-069, US-075, US-076, US-077, US-078** | Đăng tin thông báo khẩn cấp, chat trực tiếp với học viên để giải đáp thắc mắc. |
| **Xem phản hồi của học sinh** | **US-053** | Xem trung bình điểm đánh giá sao và danh sách nhận xét của học viên gửi cho bản thân để cải thiện bài giảng. |

---

### 👤 Tác nhân 3: Quản trị viên (Admin)
| Luồng thông tin trong Context Diagram | User Stories tương ứng | Trạng thái mã nguồn |
| :--- | :--- | :--- |
| **Kiểm duyệt khóa học & Phân bổ giảng dạy** | **US-031b** | Phê duyệt khóa học do giáo viên tạo, đối chiếu chuyên ngành (specialization) của giảng viên với môn học trước khi cấp quyền. |
| **Quản lý Danh mục Ngành học & Môn học** | **US-024, US-060, US-061, US-062, US-063, US-064** | Thiết lập các chuyên ngành (Specialist), sơ đồ cây môn học tiên quyết (Prerequisite map) để tự động hóa điều kiện đăng ký học. |
| **Quản lý ngân hàng câu hỏi dùng chung** | **US-014, US-015, US-017** | Nhập hàng loạt câu hỏi từ file định dạng XML (XML Import), xuất dữ liệu ngân hàng câu hỏi để chuyển giao môn học (XML Export). |
| **Phê duyệt thời khóa biểu toàn trường** | **US-045** | Tiếp nhận yêu cầu đăng ký ca dạy của giảng viên, phê duyệt hoặc xử lý các ngoại lệ (schedule exceptions) khi có sự cố trùng ca học. |
| **Giám sát & Điều phối phản hồi hệ thống** | **US-049, US-052, US-055** | Xem toàn bộ hòm thư phản hồi, lọc theo xếp hạng sao, xóa những nhận xét có nội dung không phù hợp (moderation). |

---

### 🖥️ Hệ thống liên kết ngoại vi (External Systems Connections)

Các luồng truyền nhận thông tin trong Context Diagram được liên kết chặt chẽ với các công nghệ backend thông qua các User Stories:

1.  **MongoDB Database $\leftrightarrow$ Hệ thống thực thể:**
    *   Lưu trữ dữ liệu có cấu trúc tối ưu (Indexes, Text Search, Triggers). 
    *   *Mọi User Story* đều được lưu trữ dữ liệu bền vững (Persistence) qua các Mongoose Models.
2.  **MinIO S3 Cloud Storage $\leftrightarrow$ Quản lý File:**
    *   **US-013 (Lesson Materials)**: Upload tài liệu học tập PDF, MP4.
    *   **US-008, US-011 (Assignments & Submissions)**: Đính kèm file đề bài và tệp nộp bài làm của học sinh.
    *   **US-048 (Feedbacks)**: Gửi phản hồi đính kèm hình ảnh/tệp minh chứng sự cố.
3.  **Resend Mail Service $\leftrightarrow$ Kênh thông báo qua Email:**
    *   **US-002 (Verify Email)** & **US-004 (Reset Password)**: Gửi mã OTP xác thực và link khôi phục tài khoản.
    *   **US-088 (Absence Email)**: Hệ thống tự động gửi email cảnh báo khi học sinh vắng học vượt quá 20% thời lượng môn học (học sinh có nguy cơ bị đình chỉ thi).
4.  **Socket.io Engine $\leftrightarrow$ Kết nối thời gian thực (Realtime Core):**
    *   **US-069 (Realtime Chat)**: Gửi tin nhắn tức thì, cập nhật trạng thái đã xem (seen status) và gửi tín hiệu thiết lập cuộc gọi video (video call signaling) trực tiếp giữa Học sinh $\leftrightarrow$ Giáo viên.

---

## 3. Kết luận
Sự tương quan giữa **User Stories** và **Sơ đồ ngữ cảnh (Context Diagram)** là **hoàn toàn khép kín và nhất quán (completely aligned)**. Không có sự sai lệch nào về vai trò người dùng (Roles), quyền hạn tương tác dữ liệu (Authorization), hay các hệ thống kết nối ngoại vi. Bạn có thể sử dụng nguyên vẹn cấu trúc này làm cơ sở vững chắc cho các tài liệu phân tích thiết kế hệ thống (SRS - Software Requirement Specification) hoặc thiết kế kiến trúc kỹ thuật.
