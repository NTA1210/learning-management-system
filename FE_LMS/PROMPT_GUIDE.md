# Hướng Dẫn Viết Prompt Để Call API Sử Dụng Environment Variables

## 📋 Mục tiêu
Viết prompt để AI tự động sử dụng environment variables khi gọi API, giúp bạn chỉ cần sửa file `.env` thay vì phải sửa code.

## 🎯 Cách viết prompt hiệu quả

### ✅ Prompt tốt (Recommended):

```
Khi call API, hãy sử dụng environment variable thay vì hardcode URL:
- Sử dụng `import.meta.env.VITE_BASE_API` cho base URL của API
- Nếu cần endpoint cụ thể, tạo biến env mới trong file .env với format `VITE_*`
- Tuyệt đối không hardcode URL như "http://localhost:4004" hoặc "https://api.example.com" vào code
- Luôn kiểm tra và xử lý trường hợp env variable undefined với giá trị fallback hợp lý
- Sử dụng `httpClient` từ `../utils/http` cho các request thông thường
- Nếu cần fetch trực tiếp, dùng `fetch()` với `import.meta.env.VITE_*`
```

### ✅ Ví dụ prompt cụ thể:

```
Thêm chức năng upload file ảnh cho quiz. 
API endpoint: Sử dụng biến môi trường `VITE_QUIZ_UPLOAD_ENDPOINT` 
với fallback là `${import.meta.env.VITE_BASE_API}/quiz-questions`.
Tuyệt đối không hardcode URL trong code. 
Nếu biến không tồn tại, log warning và sử dụng fallback.
```

### ✅ Ví dụ prompt cho API mới:

```
Tạo service call API lấy danh sách assignments.
- Endpoint: sử dụng `VITE_BASE_API` + "/assignments" 
- Method: GET
- Tuyệt đối không hardcode URL, phải dùng env variable
- Xử lý error và loading state đầy đủ
```

## 🔧 Cấu trúc Environment Variables

### File `.env` (tạo nếu chưa có):
```env
# Base API URL
VITE_BASE_API=http://localhost:4004

# Quiz upload endpoint (optional, sẽ dùng VITE_BASE_API + /quiz-questions nếu không có)
VITE_QUIZ_UPLOAD_ENDPOINT=http://localhost:4004/quiz-questions

# Các endpoint khác nếu cần
VITE_ASSIGNMENTS_API=http://localhost:4004/assignments
VITE_COURSES_API=http://localhost:4004/courses
```

### File `.env.example` (cho team):
```env
VITE_BASE_API=http://localhost:4004
VITE_QUIZ_UPLOAD_ENDPOINT=http://localhost:4004/quiz-questions
```

## 📝 Pattern sử dụng trong code

### ✅ Đúng - Sử dụng env variable:
```typescript
// Option 1: Sử dụng httpClient (đã config baseURL)
import { httpClient } from "../utils/http";
const response = await httpClient.get("/quiz-questions");

// Option 2: Fetch trực tiếp với env variable
const apiBase = import.meta.env.VITE_BASE_API || "http://localhost:4004";
const response = await fetch(`${apiBase}/quiz-questions`);

// Option 3: Endpoint riêng với fallback
const endpoint = import.meta.env.VITE_QUIZ_UPLOAD_ENDPOINT 
  || `${import.meta.env.VITE_BASE_API}/quiz-questions`;
const response = await fetch(endpoint);
```

### ❌ Sai - Hardcode URL:
```typescript
// ❌ KHÔNG LÀM VẬY
const response = await fetch("http://localhost:4004/quiz-questions");
const response = await httpClient.get("https://api.example.com/quiz-questions");
```

## 🎨 Template prompt hoàn chỉnh

Copy và chỉnh sửa template này khi cần:

```
[Tên chức năng] - Call API [tên endpoint]

Yêu cầu:
1. Sử dụng environment variable: `VITE_BASE_API` hoặc `VITE_[TEN]_ENDPOINT`
2. Tuyệt đối không hardcode URL vào code
3. Xử lý fallback khi env variable không có
4. Sử dụng `httpClient` từ `../utils/http` nếu có thể
5. Nếu cần endpoint riêng, hãy tạo biến env mới và document trong .env.example

Endpoint: [mô tả endpoint]
Method: [GET/POST/PUT/DELETE]
Request body: [nếu có]
Response: [mô tả response]
```

## 🔍 Checklist khi viết prompt

- [ ] Có yêu cầu rõ ràng: "Sử dụng environment variable"
- [ ] Có chỉ định biến env cụ thể hoặc pattern: `VITE_*`
- [ ] Có yêu cầu fallback value
- [ ] Có yêu cầu không hardcode URL
- [ ] Có yêu cầu document trong .env.example nếu tạo biến mới

## 📚 Ví dụ thực tế

### Ví dụ 1: Upload quiz với image
```
Tạo form upload quiz có image.
- API endpoint: sử dụng `VITE_QUIZ_UPLOAD_ENDPOINT` với fallback `${VITE_BASE_API}/quiz-questions`
- Method: POST
- Content-Type: multipart/form-data
- Không hardcode URL
```

### Ví dụ 2: Lấy danh sách courses
```
Fetch danh sách courses từ API.
- Endpoint: sử dụng `VITE_BASE_API` + "/courses"
- Method: GET
- Sử dụng httpClient từ utils/http
- Không hardcode URL
```

### Ví dụ 3: Tạo service mới
```
Tạo service gọi API notifications.
- Base URL: `VITE_BASE_API`
- Endpoint: "/notifications"
- Sử dụng httpClient
- Không hardcode bất kỳ URL nào
- Nếu cần endpoint riêng khác port, tạo `VITE_NOTIFICATIONS_API`
```

## 💡 Tips

1. **Luôn nhắc lại**: Thêm câu "Tuyệt đối không hardcode URL" vào prompt
2. **Specify biến**: Nếu biết tên biến env, nêu rõ: `VITE_BASE_API`
3. **Fallback**: Yêu cầu fallback value hợp lý
4. **Document**: Nhắc AI document biến mới trong .env.example
5. **Pattern**: Sử dụng pattern `VITE_*` cho Vite projects

---

**Lưu ý**: 
- Trong Vite, chỉ có biến bắt đầu với `VITE_` mới được expose ra client
- Reload dev server sau khi sửa file `.env`
- File `.env` không commit vào git, dùng `.env.example` để share config

