# ⚡ Quick Start - Test Lesson APIs

Hướng dẫn nhanh để test Lesson APIs trong vài phút.

## 🚀 Bước 1: Chuẩn bị

### 1.1. Chạy server backend:
```bash
cd learning-management-system-6_4/BE_LMS
npm run dev
```

### 1.2. Setup dữ liệu test (nếu chưa có):
```bash
npx ts-node src/scripts/initData.ts
```

Điều này sẽ tạo:
- Admin: `admin1@example.com` / `123456`
- Teacher: `teacher1@example.com` / `123456`
- Student: `student1@example.com` / `123456`
- Course và một số lessons mẫu

---

## 🧪 Bước 2: Test nhanh với Postman/Thunder Client

### Option 1: Import Postman Collection

1. Mở Postman hoặc Thunder Client (VS Code extension)
2. Import file `postman.json`
3. Set environment variable:
   - `base_url`: `http://localhost:4004`
   - `admin_email`: `admin1@example.com`
   - `admin_password`: `123456`

### Option 2: Test thủ công

#### Bước 1: Login để lấy cookie

```http
POST http://localhost:4004/auth/login
Content-Type: application/json

{
  "email": "admin1@example.com",
  "password": "123456"
}
```

**Copy cookie `accessToken` từ response headers**

#### Bước 2: Test các APIs

**1. Lấy danh sách lessons:**
```http
GET http://localhost:4004/lesson/listAllLessons?page=1&limit=10
Cookie: accessToken=YOUR_TOKEN_HERE
```

**2. Lấy lessons theo course:**
```http
GET http://localhost:4004/lesson/byCourse/YOUR_COURSE_ID
Cookie: accessToken=YOUR_TOKEN_HERE
```

**3. Lấy chi tiết lesson:**
```http
GET http://localhost:4004/lesson/getLessonById/YOUR_LESSON_ID
Cookie: accessToken=YOUR_TOKEN_HERE
```

**4. Tạo lesson mới (cần Teacher/Admin):**
```http
POST http://localhost:4004/lesson/createLessons
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "title": "New Lesson",
  "courseId": "YOUR_COURSE_ID",
  "content": "Lesson content here",
  "order": 1,
  "durationMinutes": 30
}
```

**5. Update lesson:**
```http
PUT http://localhost:4004/lesson/updateLessons/YOUR_LESSON_ID
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "title": "Updated Title",
  "durationMinutes": 45
}
```

**6. Xóa lesson:**
```http
DELETE http://localhost:4004/lesson/deleteLessons/YOUR_LESSON_ID
Cookie: accessToken=YOUR_TOKEN_HERE
```

---

## 🧪 Bước 3: Test với Jest (Automated)

### Chạy tất cả tests:
```bash
npm test -- lesson.integration.test.ts
```

### Chạy test cụ thể:
```bash
# Test GET endpoints
npm test -- -t "GET /lesson/listAllLessons"

# Test POST endpoints
npm test -- -t "POST /lesson/createLessons"

# Test với coverage
npm test -- --coverage lesson.integration.test.ts
```

---

## 📋 Test Cases Checklist

### ✅ GET `/lesson/listAllLessons`
- [ ] Admin thấy tất cả lessons
- [ ] Teacher thấy lessons của course mình dạy
- [ ] Student chỉ thấy published lessons
- [ ] Pagination hoạt động (page, limit)
- [ ] Search hoạt động
- [ ] Filter theo course hoạt động
- [ ] Không có auth → 401

### ✅ GET `/lesson/byCourse/:courseId`
- [ ] Admin thấy tất cả
- [ ] Teacher thấy tất cả lessons của course
- [ ] Student chỉ thấy published
- [ ] Course không tồn tại → 404
- [ ] Invalid courseId → 400

### ✅ GET `/lesson/getLessonById/:id`
- [ ] Admin thấy chi tiết
- [ ] Teacher thấy lesson của course mình
- [ ] Student thấy published lesson
- [ ] Student không thấy draft → 404
- [ ] Lesson không tồn tại → 404

### ✅ POST `/lesson/createLessons`
- [ ] Teacher tạo lesson thành công
- [ ] Admin tạo lesson thành công
- [ ] Student không thể tạo → 403
- [ ] Thiếu required fields → 400
- [ ] Duplicate title → 409
- [ ] Invalid courseId → 400/404
- [ ] Không có auth → 401

### ✅ PUT `/lesson/updateLessons/:id`
- [ ] Teacher update lesson của mình
- [ ] Admin update bất kỳ lesson
- [ ] Student không thể update → 403
- [ ] Partial update hoạt động
- [ ] Lesson không tồn tại → 404
- [ ] Invalid lessonId → 400

### ✅ DELETE `/lesson/deleteLessons/:id`
- [ ] Teacher xóa lesson của mình
- [ ] Admin xóa bất kỳ lesson
- [ ] Student không thể xóa → 403
- [ ] Lesson không tồn tại → 404
- [ ] Không có auth → 401

---

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized
**Vấn đề:** Cookie không được gửi hoặc expired  
**Giải pháp:** 
1. Login lại và copy cookie mới
2. Đảm bảo cookie được set trong request header
3. Check xem server có chạy không

### Lỗi 403 Forbidden
**Vấn đề:** User không có quyền  
**Giải pháp:** 
- Dùng account đúng role (teacher/admin cho create/update/delete)
- Student chỉ có thể read published lessons

### Lỗi 404 Not Found
**Vấn đề:** Resource không tồn tại hoặc không có quyền truy cập  
**Giải pháp:** 
- Check ID có đúng không
- Dùng admin account để test
- Kiểm tra course/lesson đã được tạo chưa

### Lỗi 400 Bad Request
**Vấn đề:** Validation error  
**Giải pháp:** 
- Check request body theo schema
- Đảm bảo required fields có đủ
- Check data types (string, number, date)

---

## 📚 Tài liệu đầy đủ

Xem file `LESSON_API_TEST_GUIDE.md` để có hướng dẫn chi tiết hơn với:
- Tất cả test cases
- Expected responses
- cURL commands
- Edge cases
- Best practices

---

## 💡 Tips

1. **Dùng Postman/Thunder Client** để test nhanh và xem responses dễ dàng
2. **Dùng Jest** để test tự động và đảm bảo không có regression
3. **Check response format** - API trả về format mới với object ở tham số thứ 2:
   ```json
   {
     "success": true,
     "message": "...",
     "data": {...},
     "meta": {
       "pagination": {...},
       "timestamp": "..."
     }
   }
   ```
4. **Lưu cookie** - Sau khi login, lưu cookie để dùng cho các requests tiếp theo
5. **Test với các roles khác nhau** - Admin, Teacher, Student có quyền khác nhau


