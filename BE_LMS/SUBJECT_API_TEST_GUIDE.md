# ⚡ Quick Start - Test Subject APIs

Hướng dẫn chi tiết để test tất cả APIs của Subject module.

## 🚀 Bước 1: Chuẩn bị

### 1.1. Chạy server backend:
```bash
cd learning-management-system-6_4/BE_LMS
npm run dev
```

Server sẽ chạy tại: `http://localhost:4004`

### 1.2. Setup dữ liệu test (nếu chưa có):
```bash
npx ts-node src/scripts/initData.ts
```

Điều này sẽ tạo:
- Admin: `admin1@example.com` / `123456`
- Teacher: `teacher1@example.com` / `123456`
- Student: `student1@example.com` / `123456`
- Một số dữ liệu mẫu khác

---

## 🔐 Bước 2: Authentication

### Login để lấy cookie

**Request:**
```http
POST http://localhost:4004/auth/login
Content-Type: application/json

{
  "email": "admin1@example.com",
  "password": "123456"
}
```

**Response:**
- Cookie `accessToken` sẽ được set tự động trong response headers
- Sử dụng cookie này cho tất cả các protected routes
- Cookie sẽ tự động được gửi kèm nếu bạn dùng Postman/Thunder Client với cookie support

**Lưu ý:** 
- Public routes (GET) không cần authentication
- Protected routes (POST, PATCH, DELETE) cần cookie `accessToken`
- Cookie sẽ expire sau một thời gian, cần login lại nếu hết hạn

---

## 🧪 Bước 3: Test các APIs

### 📋 PUBLIC ROUTES (Không cần authentication)

#### 1. GET /subjects - Lấy danh sách Subject (với search, filter, phân trang)

**Request:**
```http
GET http://localhost:4004/subjects?page=1&limit=10&search=math&isActive=true&sortBy=name&sortOrder=asc
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng mỗi trang (default: 10, max: 100)
- `search` (optional): Tìm kiếm theo name/code/slug
- `name` (optional): Filter theo tên chính xác
- `slug` (optional): Filter theo slug
- `code` (optional): Filter theo mã môn học
- `specialistId` (optional): Filter theo specialist ID
- `isActive` (optional): Filter theo trạng thái (true/false)
- `sortBy` (optional): Sắp xếp theo (createdAt, updatedAt, name, code)
- `sortOrder` (optional): Thứ tự (asc, desc, default: desc)

**Response:**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "Toán học cơ bản",
      "code": "MATH101",
      "slug": "toan-hoc-co-ban",
      "credits": 3,
      "description": "...",
      "isActive": true,
      "specialistIds": [...],
      "prerequisites": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "timestamp": "..."
  }
}
```

**Test Cases:**
- ✅ Lấy danh sách với pagination
- ✅ Search theo tên
- ✅ Filter theo isActive
- ✅ Filter theo specialistId
- ✅ Sort theo name, createdAt
- ✅ Limit tối đa 100
- ✅ Invalid page/limit → 400

---

#### 2. GET /subjects/:slug - Lấy chi tiết Subject theo slug

**Request:**
```http
GET http://localhost:4004/subjects/toan-hoc-co-ban
```

**Response:**
```json
{
  "success": true,
  "message": "Subject retrieved successfully",
  "data": {
    "_id": "...",
    "name": "Toán học cơ bản",
    "code": "MATH101",
    "slug": "toan-hoc-co-ban",
    "credits": 3,
    "description": "...",
    "isActive": true,
    "specialistIds": [...],
    "prerequisites": [...],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Test Cases:**
- ✅ Lấy subject thành công với slug hợp lệ
- ✅ Slug không tồn tại → 404
- ✅ Slug rỗng → 400

---

#### 3. GET /subjects/id/:id - Lấy chi tiết Subject theo ID

**Request:**
```http
GET http://localhost:4004/subjects/id/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "Subject retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toán học cơ bản",
    "code": "MATH101",
    "slug": "toan-hoc-co-ban",
    ...
  }
}
```

**Test Cases:**
- ✅ Lấy subject thành công với ID hợp lệ
- ✅ ID không tồn tại → 404
- ✅ Invalid ID format → 400

---

#### 4. GET /subjects/id/:id/prerequisites - Lấy danh sách môn tiên quyết

**Request:**
```http
GET http://localhost:4004/subjects/id/507f1f77bcf86cd799439011/prerequisites
```

**Response:**
```json
{
  "success": true,
  "message": "Prerequisites retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "Môn tiên quyết 1",
      "code": "PRE001",
      "slug": "mon-tien-quyet-1",
      ...
    }
  ]
}
```

**Test Cases:**
- ✅ Lấy danh sách prerequisites thành công
- ✅ Subject không có prerequisites → trả về mảng rỗng
- ✅ Subject không tồn tại → 404

---

#### 5. GET /subjects/autocomplete/search - Autocomplete search

**Request:**
```http
GET http://localhost:4004/subjects/autocomplete/search?q=toan&limit=10
```

**Query Parameters:**
- `q` (optional): Từ khóa tìm kiếm
- `limit` (optional): Số lượng kết quả (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "message": "Subjects autocomplete successfully",
  "data": [
    {
      "_id": "...",
      "name": "Toán học cơ bản",
      "code": "MATH101",
      "slug": "toan-hoc-co-ban",
      ...
    }
  ]
}
```

**Test Cases:**
- ✅ Autocomplete với từ khóa
- ✅ Limit trong khoảng 1-50
- ✅ Không có kết quả → trả về mảng rỗng
- ✅ Limit > 50 → 400

---

#### 6. GET /subjects/id/:id/related - Lấy danh sách Subject liên quan

**Request:**
```http
GET http://localhost:4004/subjects/id/507f1f77bcf86cd799439011/related?limit=5
```

**Query Parameters:**
- `limit` (optional): Số lượng kết quả (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "message": "Related subjects retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "Subject liên quan",
      "code": "REL001",
      ...
    }
  ]
}
```

**Test Cases:**
- ✅ Lấy danh sách subject liên quan
- ✅ Limit trong khoảng 1-50
- ✅ Subject không có liên quan → trả về mảng rỗng
- ✅ Subject không tồn tại → 404

---

### 🔒 PROTECTED ROUTES (Cần authentication)

#### 7. POST /subjects - Tạo mới Subject

**Request:**
```http
POST http://localhost:4004/subjects
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "name": "Lập trình Python",
  "code": "PYTHON101",
  "credits": 4,
  "description": "Môn học về lập trình Python cơ bản",
  "slug": "lap-trinh-python",
  "specialistIds": ["507f1f77bcf86cd799439011"],
  "prerequisites": [],
  "isActive": true
}
```

**Body Parameters:**
- `name` (required): Tên môn học (max: 255)
- `code` (required): Mã môn học (max: 64)
- `credits` (required): Số tín chỉ (0-100)
- `description` (optional): Mô tả
- `slug` (optional): Slug (tự động generate nếu không có)
- `specialistIds` (optional): Mảng ID của specialists
- `prerequisites` (optional): Mảng ID của môn tiên quyết
- `isActive` (optional): Trạng thái hoạt động (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "...",
    "name": "Lập trình Python",
    "code": "PYTHON101",
    ...
  }
}
```

**Test Cases:**
- ✅ Tạo subject thành công với đầy đủ thông tin
- ✅ Tạo subject với slug tự động
- ✅ Thiếu required fields (name, code, credits) → 400
- ✅ Duplicate name/code/slug → 409
- ✅ Invalid credits (âm, > 100) → 400
- ✅ Invalid specialistIds/prerequisites → 400
- ✅ Không có authentication → 401

---

#### 8. PATCH /subjects/id/:id - Cập nhật Subject theo ID

**Request:**
```http
PATCH http://localhost:4004/subjects/id/507f1f77bcf86cd799439011
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "name": "Lập trình Python nâng cao",
  "credits": 5,
  "description": "Mô tả mới"
}
```

**Body Parameters:** (Tất cả đều optional)
- `name`: Tên môn học
- `code`: Mã môn học
- `credits`: Số tín chỉ
- `description`: Mô tả
- `slug`: Slug
- `specialistIds`: Mảng ID của specialists
- `prerequisites`: Mảng ID của môn tiên quyết
- `isActive`: Trạng thái hoạt động

**Response:**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Lập trình Python nâng cao",
    ...
  }
}
```

**Test Cases:**
- ✅ Update thành công một số fields
- ✅ Update tất cả fields
- ✅ Update với duplicate name/code/slug → 409
- ✅ Subject không tồn tại → 404
- ✅ Invalid ID format → 400
- ✅ Không có authentication → 401

---

#### 9. PATCH /subjects/:slug - Cập nhật Subject theo slug

**Request:**
```http
PATCH http://localhost:4004/subjects/lap-trinh-python
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "name": "Lập trình Python nâng cao",
  "credits": 5
}
```

**Test Cases:**
- ✅ Update thành công với slug hợp lệ
- ✅ Slug không tồn tại → 404
- ✅ Update với duplicate name/code → 409

---

#### 10. DELETE /subjects/id/:id - Xóa Subject theo ID

**Request:**
```http
DELETE http://localhost:4004/subjects/id/507f1f77bcf86cd799439011
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "message": "Subject deleted successfully",
  "data": {
    "deletedCount": 1
  }
}
```

**Test Cases:**
- ✅ Xóa subject thành công
- ✅ Subject không tồn tại → 404
- ✅ Subject đang được sử dụng trong Course → 400/409 (block)
- ✅ Không có authentication → 401

---

#### 11. DELETE /subjects/:slug - Xóa Subject theo slug

**Request:**
```http
DELETE http://localhost:4004/subjects/lap-trinh-python
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Test Cases:**
- ✅ Xóa subject thành công với slug hợp lệ
- ✅ Slug không tồn tại → 404

---

#### 12. PATCH /subjects/id/:id/activate - Kích hoạt Subject

**Request:**
```http
PATCH http://localhost:4004/subjects/id/507f1f77bcf86cd799439011/activate
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "message": "Subject activated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": true,
    ...
  }
}
```

**Test Cases:**
- ✅ Kích hoạt subject thành công
- ✅ Subject đã active → vẫn trả về success
- ✅ Subject không tồn tại → 404

---

#### 13. PATCH /subjects/id/:id/deactivate - Vô hiệu hóa Subject

**Request:**
```http
PATCH http://localhost:4004/subjects/id/507f1f77bcf86cd799439011/deactivate
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "message": "Subject deactivated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": false,
    ...
  }
}
```

**Test Cases:**
- ✅ Vô hiệu hóa subject thành công
- ✅ Subject đã inactive → vẫn trả về success
- ✅ Subject không tồn tại → 404

---

#### 14. POST /subjects/id/:id/prerequisites - Thêm môn tiên quyết

**Request:**
```http
POST http://localhost:4004/subjects/id/507f1f77bcf86cd799439011/prerequisites
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE

{
  "prerequisiteIds": [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ]
}
```

**Body Parameters:**
- `prerequisiteIds` (required): Mảng ID của các môn tiên quyết (min: 1)

**Response:**
```json
{
  "success": true,
  "message": "Prerequisites added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "prerequisites": [
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013"
    ],
    ...
  }
}
```

**Test Cases:**
- ✅ Thêm prerequisites thành công
- ✅ Thêm prerequisites đã tồn tại → bỏ qua (idempotent)
- ✅ Thêm prerequisite tạo vòng lặp (circular dependency) → 400
- ✅ Prerequisite không tồn tại → 400/404
- ✅ Subject không tồn tại → 404
- ✅ Thiếu prerequisiteIds → 400
- ✅ Mảng rỗng → 400

---

#### 15. DELETE /subjects/id/:id/prerequisites/:preId - Xóa một môn tiên quyết

**Request:**
```http
DELETE http://localhost:4004/subjects/id/507f1f77bcf86cd799439011/prerequisites/507f1f77bcf86cd799439012
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "message": "Prerequisite removed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "prerequisites": [
      "507f1f77bcf86cd799439013"
    ],
    ...
  }
}
```

**Test Cases:**
- ✅ Xóa prerequisite thành công
- ✅ Prerequisite không tồn tại trong danh sách → vẫn trả về success (idempotent)
- ✅ Subject không tồn tại → 404
- ✅ Invalid prerequisiteId format → 400

---

## 🧪 Bước 4: Test với Jest (Automated)

### Chạy tất cả tests:
```bash
npm test -- subject.controller.test.ts
npm test -- subject.service.test.ts
```

### Chạy test cụ thể:
```bash
# Test GET endpoints
npm test -- -t "listSubjectsHandler"

# Test POST endpoints
npm test -- -t "createSubjectHandler"

# Test với coverage
npm test -- --coverage subject.controller.test.ts
```

---

## 📋 Test Cases Checklist

### ✅ GET /subjects (List Subjects)
- [ ] Lấy danh sách với pagination mặc định
- [ ] Lấy danh sách với page và limit tùy chỉnh
- [ ] Search theo tên
- [ ] Search theo code
- [ ] Filter theo isActive (true/false)
- [ ] Filter theo specialistId
- [ ] Sort theo name (asc/desc)
- [ ] Sort theo createdAt (asc/desc)
- [ ] Sort theo code (asc/desc)
- [ ] Limit > 100 → 400
- [ ] Page < 1 → 400
- [ ] Kết hợp nhiều filters

### ✅ GET /subjects/:slug
- [ ] Lấy subject thành công với slug hợp lệ
- [ ] Slug không tồn tại → 404
- [ ] Slug rỗng → 400

### ✅ GET /subjects/id/:id
- [ ] Lấy subject thành công với ID hợp lệ
- [ ] ID không tồn tại → 404
- [ ] Invalid ID format → 400

### ✅ GET /subjects/id/:id/prerequisites
- [ ] Lấy danh sách prerequisites thành công
- [ ] Subject không có prerequisites → mảng rỗng
- [ ] Subject không tồn tại → 404

### ✅ GET /subjects/autocomplete/search
- [ ] Autocomplete với từ khóa
- [ ] Autocomplete không có kết quả → mảng rỗng
- [ ] Limit trong khoảng 1-50
- [ ] Limit > 50 → 400
- [ ] Không có query → trả về tất cả (hoặc mảng rỗng)

### ✅ GET /subjects/id/:id/related
- [ ] Lấy danh sách subject liên quan
- [ ] Subject không có liên quan → mảng rỗng
- [ ] Limit trong khoảng 1-50
- [ ] Subject không tồn tại → 404

### ✅ POST /subjects (Create)
- [ ] Tạo subject thành công với đầy đủ thông tin
- [ ] Tạo subject với slug tự động
- [ ] Tạo subject với specialistIds
- [ ] Tạo subject với prerequisites
- [ ] Thiếu name → 400
- [ ] Thiếu code → 400
- [ ] Thiếu credits → 400
- [ ] Duplicate name → 409
- [ ] Duplicate code → 409
- [ ] Duplicate slug → 409
- [ ] Credits < 0 → 400
- [ ] Credits > 100 → 400
- [ ] Invalid specialistIds → 400
- [ ] Invalid prerequisites → 400
- [ ] Không có authentication → 401

### ✅ PATCH /subjects/id/:id (Update by ID)
- [ ] Update name thành công
- [ ] Update code thành công
- [ ] Update credits thành công
- [ ] Update description thành công
- [ ] Update specialistIds thành công
- [ ] Update prerequisites thành công
- [ ] Update isActive thành công
- [ ] Update nhiều fields cùng lúc
- [ ] Update với duplicate name → 409
- [ ] Update với duplicate code → 409
- [ ] Subject không tồn tại → 404
- [ ] Invalid ID format → 400
- [ ] Không có authentication → 401

### ✅ PATCH /subjects/:slug (Update by slug)
- [ ] Update thành công với slug hợp lệ
- [ ] Slug không tồn tại → 404
- [ ] Update với duplicate name/code → 409

### ✅ DELETE /subjects/id/:id
- [ ] Xóa subject thành công
- [ ] Subject không tồn tại → 404
- [ ] Subject đang được sử dụng → 400/409 (block)
- [ ] Không có authentication → 401

### ✅ DELETE /subjects/:slug
- [ ] Xóa subject thành công với slug hợp lệ
- [ ] Slug không tồn tại → 404

### ✅ PATCH /subjects/id/:id/activate
- [ ] Kích hoạt subject thành công
- [ ] Subject đã active → vẫn success
- [ ] Subject không tồn tại → 404
- [ ] Không có authentication → 401

### ✅ PATCH /subjects/id/:id/deactivate
- [ ] Vô hiệu hóa subject thành công
- [ ] Subject đã inactive → vẫn success
- [ ] Subject không tồn tại → 404
- [ ] Không có authentication → 401

### ✅ POST /subjects/id/:id/prerequisites
- [ ] Thêm prerequisites thành công
- [ ] Thêm nhiều prerequisites cùng lúc
- [ ] Thêm prerequisite đã tồn tại → bỏ qua
- [ ] Thêm prerequisite tạo vòng lặp → 400
- [ ] Prerequisite không tồn tại → 400/404
- [ ] Subject không tồn tại → 404
- [ ] Thiếu prerequisiteIds → 400
- [ ] Mảng rỗng → 400
- [ ] Không có authentication → 401

### ✅ DELETE /subjects/id/:id/prerequisites/:preId
- [ ] Xóa prerequisite thành công
- [ ] Prerequisite không tồn tại trong danh sách → vẫn success
- [ ] Subject không tồn tại → 404
- [ ] Invalid prerequisiteId format → 400
- [ ] Không có authentication → 401

---

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized
**Vấn đề:** Cookie không được gửi hoặc expired  
**Giải pháp:** 
1. Login lại và copy cookie mới
2. Đảm bảo cookie được set trong request header
3. Check xem server có chạy không
4. Trong Postman: Settings → Send cookies automatically

### Lỗi 403 Forbidden
**Vấn đề:** User không có quyền  
**Giải pháp:** 
- Dùng account đúng role (admin/teacher cho create/update/delete)
- Check middleware authorization

### Lỗi 404 Not Found
**Vấn đề:** Resource không tồn tại  
**Giải pháp:** 
- Check ID/slug có đúng không
- Kiểm tra subject đã được tạo chưa
- Verify route path có đúng không

### Lỗi 400 Bad Request
**Vấn đề:** Validation error  
**Giải pháp:** 
- Check request body theo schema
- Đảm bảo required fields có đủ
- Check data types (string, number, date)
- Verify ID format (MongoDB ObjectId)

### Lỗi 409 Conflict
**Vấn đề:** Duplicate hoặc conflict  
**Giải pháp:** 
- Check duplicate name/code/slug
- Verify không có circular dependency trong prerequisites
- Check subject đang được sử dụng trong Course

---

## 📚 Sử dụng Postman Collection

### Tạo Postman Collection mới:

1. **Import vào Postman:**
   - Tạo collection mới: "Subject APIs"
   - Set environment variable: `base_url` = `http://localhost:4004`

2. **Setup Pre-request Script:**
   - Tạo request "Login" đầu tiên
   - Lưu cookie `accessToken` vào collection variable

3. **Tạo các requests:**
   - Tổ chức theo folders: Public Routes, Protected Routes
   - Sử dụng variables cho `{{base_url}}` và `{{subjectId}}`
   - Set authentication type: Cookie-based

4. **Test Scripts:**
   - Thêm test scripts để verify response
   - Check status codes
   - Validate response structure

---

## 💡 Tips

1. **Dùng Postman/Thunder Client** để test nhanh và xem responses dễ dàng
2. **Dùng Jest** để test tự động và đảm bảo không có regression
3. **Check response format** - API trả về format:
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
4. **Lưu cookie** - Sau khi login, cookie tự động được lưu trong browser/Postman
5. **Test với các roles khác nhau** - Admin, Teacher, Student có quyền khác nhau
6. **Test edge cases** - Empty arrays, null values, invalid formats
7. **Test prerequisites** - Đảm bảo không có circular dependency
8. **Test duplicate prevention** - Name, code, slug phải unique

---

## 🔗 Related Documentation

- `TEST_QUICK_START.md` - Hướng dẫn test Lesson APIs
- `src/controller/subject.controller.ts` - Controller implementation
- `src/validators/subject.schemas.ts` - Validation schemas
- `src/routes/subject.route.ts` - Route definitions
- `src/services/subject.service.ts` - Business logic

---

## 📝 Notes

- Tất cả timestamps được trả về dạng ISO 8601
- IDs là MongoDB ObjectId (24 ký tự hex)
- Slugs được auto-generate từ name nếu không được cung cấp
- Prerequisites được validate để tránh circular dependency
- Subjects không thể xóa nếu đang được sử dụng trong Courses

