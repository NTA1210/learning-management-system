import mongoose from "mongoose";
import { IApiResponse } from "@/types/apiResponse.type";
import { Role } from "@/types";

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

export {};
