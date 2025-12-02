// src/setupTests.ts
import dotenv from 'dotenv';

dotenv.config();

// Chạy 1 lần trước tất cả test
beforeAll(async () => {
  // Nếu có config, load ở đây
  // Có thể thêm global setup nếu service cần
});

// Làm sạch mock giữa các test
beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Sau mỗi test
afterEach(() => jest.clearAllMocks());

// Sau khi tất cả test xong
afterAll(async () => {
  // Đóng kết nối, giải phóng tài nguyên nếu có (ở đây không cần Mongo)
});
