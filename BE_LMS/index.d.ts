import mongoose from "mongoose";
import { IApiResponse } from "./src/types/ApiResponse";

declare global {
  namespace Express {
    interface Request {
      userId: mongoose.Types.ObjectId;
      sessionId: mongoose.Types.ObjectId;
    }

    interface Response {
      success<T>(
        status: number,
        data?: T | null,
        message?: string,
        ...args: any
      ): Response<IApiResponse<T>>;
      error(
        status: number,
        message: string,
        code?: string,
        details?: any
      ): Response<IApiResponse<null>>;
    }
  }
}
export {};
