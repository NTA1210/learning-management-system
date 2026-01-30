# Learning Management System (LMS)

Dự án **Fullstack Learning Management System (LMS)** là một nền tảng quản lý học tập trực tuyến hiện đại, được xây dựng với mục tiêu cung cấp giải pháp toàn diện cho việc giảng dạy và học tập.

Hệ thống cung cấp trải nghiệm học tập phong phú với giao diện người dùng tương tác cao, hỗ trợ quản lý khóa học, bài giảng đa phương tiện (bao gồm hình ảnh, video, và nội dung 3D), cũng như các công cụ quản lý dành cho giảng viên và admin.

## 🚀 Tính năng chính

### Authentication & Authorization

- Đăng nhập/Đăng ký an toàn với JWT (Access Token & Refresh Token).
- Phân quyền người dùng (Role-based Authorization): Admin, Instructor, Student.
- Bảo mật mật khẩu với Bcrypt và xác thực dữ liệu đầu vào với Zod.

### Quản lý nội dung học tập

- Tạo, sửa, xóa khóa học và bài giảng.
- Hỗ trợ đa dạng định dạng bài giảng: Video, Markdown, Hình ảnh.
- **Tính năng đặc biệt**: Hỗ trợ hiển thị nội dung 3D tương tác ngay trên trình duyệt.
- Theo dõi tiến độ học tập chi tiết từng học viên.

### Hệ thống & Tiện ích

- **Real-time Communication**: Thông báo và cập nhật trạng thái thời gian thực qua Socket.io.
- **File Storage**: Hệ thống lưu trữ file mạnh mẽ sử dụng MinIO (tương thích S3).
- **Email Service**: Tích hợp gửi email thông báo, xác thực qua Resend.
- **SEO Optimization**: Hỗ trợ Prerender Server riêng biệt để tối ưu hóa SEO cho Single Page Application (SPA).
- **Scheduler**: Tự động dọn dẹp file rác và các tác vụ định kỳ với Node-cron.

## 🛠 Công nghệ sử dụng

### Frontend (`FE_LMS`)

- **Core**: React 19, Vite, TypeScript.
- **Styling**: Tailwind CSS v4, Lucide React, Bootstrap Icons.
- **State Management**: Zustand, Jotai, TanStack Query (React Query).
- **Routing**: React Router DOM v7.
- **Graphics & 3D**: Three.js, React Three Fiber (@react-three/fiber, @react-three/drei), OGL.
- **Content**: React Markdown, Rehype/Remark plugins.

### Backend (`BE_LMS`)

- **Runtime**: Node.js, Express.js, TypeScript.
- **Database**: MongoDB (Mongoose ORM).
- **Storage**: MinIO (Object Storage).
- **Security**: JWT, Bcrypt, Multer (File Upload), Cors.
- **Tools**: Node-cron (Scheduler), Resend (Email), Zod (Validation).
- **Real-time**: Socket.io.

### Prerender Server (`prerender-server`)

- **Service**: Prerender.io middleware.
- **Core**: Express/Node.js giúp render nội dung JS cho bot tìm kiếm.

## 📂 Cấu trúc thư mục

```
learning-management-system/
├── BE_LMS/                 # Mã nguồn Backend
│   ├── src/
│   │   ├── config/         # Cấu hình DB, MinIO, Mail...
│   │   ├── controller/     # Xử lý logic request
│   │   ├── models/         # Schema MongoDB
│   │   ├── routes/         # Định nghĩa API endpoints
│   │   ├── services/       # Business logic layer
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
├── FE_LMS/                 # Mã nguồn Frontend
│   ├── src/
│   │   ├── components/     # UI Components tái sử dụng
│   │   ├── pages/          # Các trang chính của ứng dụng
│   │   ├── services/       # API call definitions
│   │   ├── stores/         # State management
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
└── prerender-server/       # Server hỗ trợ SEO
    └── src/
        └── index.ts
```

## ⚙️ Hướng dẫn cài đặt & Chạy project

### Yêu cầu môi trường

- Node.js (v18 trở lên, khuyến nghị v20+).
- MongoDB (cloud hoặc local).
- MinIO Server (để lưu trữ file).
- Trình duyệt Chrome (cho Prerender service).

### Các bước cài đặt

1.  **Clone repository**

    ```bash
    git clone https://github.com/NTA1210/learning-management-system.git
    cd learning-management-system
    ```

2.  **Cài đặt dependencies**
    Chạy lệnh install tại từng thư mục:

    ```bash
    # Backend
    cd BE_LMS && npm install

    # Frontend
    cd ../FE_LMS && npm install

    # Prerender Server
    cd ../prerender-server && npm install
    ```

3.  **Cấu hình biến môi trường (`.env`)**
    Tạo file `.env` trong từng thư mục tương ứng dựa trên mẫu dưới đây.

4.  **Chạy dự án**
    Mở 3 terminal riêng biệt cho từng service:
    - **Backend**:

      ```bash
      cd BE_LMS
      npm run dev
      ```

    - **Frontend**:

      ```bash
      cd FE_LMS
      npm run dev
      ```

    - **Prerender Server**:
      ```bash
      cd prerender-server
      npm run dev
      ```

## 🔐 Environment Variables

### Backend (`BE_LMS/.env`)

```env
PORT=4004
NODE_ENV=development
APP_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/lms_db

# Authentication
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# MinIO Storage
BUCKET_NAME=lms-bucket
MINIO_ENDPOINT=play.min.io
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_minio_access
MINIO_SECRET_KEY=your_minio_secret

# Email Service
EMAIL_SENDER=onboarding@resend.dev
RESEND_API_KEY=re_123456789
```

### Frontend (`FE_LMS/.env`)

```env
VITE_BASE_API=http://localhost:4004/api/v1
```

### Prerender Server (`prerender-server/.env`)

```env
PRERENDER_PORT=3001
CHROME_LOCATION=/usr/bin/google-chrome
```

## 📃 API Documentation

Các endpoint chính của hệ thống backend:

- **Auth**: `/api/v1/auth` (Login, Register, Refresh Token, Logout)
- **Users**: `/api/v1/users` (Get info, Update profile)
- **Courses**: `/api/v1/courses` (CRUD courses, lessons)
- **Upload**: `/api/v1/upload` (Upload file to MinIO)

_(Chi tiết đầy đủ có thể tham khảo qua Postman Collection hoặc Swagger nếu được tích hợp sau này)_

## 🔮 Hướng phát triển trong tương lai

- Tích hợp thanh toán online (Stripe/PayPal).
- Xây dựng hệ thống bài kiểm tra (Quiz) tự động chấm điểm.
- Cải thiện tính năng 3D, hỗ trợ Import model từ người dùng.
- Phát triển Mobile App (React Native).

---
