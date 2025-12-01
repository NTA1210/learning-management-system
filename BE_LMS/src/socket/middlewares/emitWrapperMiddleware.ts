import { verifyToken } from '@/utils/jwt';

// Wrapper cho emit handler
export function authEmit(handler: (data: any) => Promise<void>) {
  return async (data: any, callback?: (res?: any) => void) => {
    try {
      // Lấy token từ payload
      const token = data.token;
      if (!token) throw new Error('No token provided');

      // Verify token
      const { payload } = verifyToken(token);
      if (!payload) throw new Error('Invalid token');

      // Gọi handler chính
      await handler(data);

      // Trả kết quả success nếu có callback
      callback?.({ status: 'ok' });
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        // Token hết hạn → báo FE refresh
        callback?.({ status: 'error', error: 'Token expired' });
      } else {
        callback?.({ status: 'error', error: err.message || 'Unauthorized' });
      }
    }
  };
}
