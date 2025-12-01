import * as cookie from 'cookie';
import { UserModel } from '@/models';
import { ExtendedError, Socket } from 'socket.io';
import { verifyToken } from '@/utils/jwt';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  const cookies = socket.handshake.headers.cookie;

  if (!cookies) {
    console.error('No cookie found');

    return next(new Error('No cookie found'));
  }
  const parsed = cookie.parse(cookies);
  const token = parsed.accessToken;

  if (!token) {
    console.error('No token found');

    return next(new Error('No token found'));
  }

  try {
    const { payload } = verifyToken(token);

    if (!payload) {
      console.log('Invalid token 12313123');

      return next(new Error('Token expired'));
    }

    const user = await UserModel.findById(payload.userId).select('-password');
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    socket.userId = user.id;

    next();
  } catch (error: any) {
    console.error('Error in socketAuthMiddleware:', error.message);
    next(new Error('Token expired')); // FE sẽ xử lý reconnect
  }
};
