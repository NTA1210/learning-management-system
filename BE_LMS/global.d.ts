import mongoose from 'mongoose';
import { IApiResponse } from '@/types/dto/apiResponse.type';
import { IUser, Role } from '@/types';
import { DefaultEventsMap } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      userId: mongoose.Types.ObjectId;
      role: Role;
      sessionId: mongoose.Types.ObjectId;
    }

    interface Response {
      success<T>(
        status: number,
        options?: { data?: T; message?: string; [key: string]: any }
      ): Response<IApiResponse<T>>;

      error(
        status: number,
        options?: {
          message?: string;
          code?: string;
          details?: any;
          [key: string]: any;
        }
      ): Response<IApiResponse<null>>;
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    user?: Omit<IUser, 'password'>;
    userId?: mongoose.Types.ObjectId;
  }
}

export {};
