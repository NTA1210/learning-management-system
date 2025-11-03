import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import z, { ZodError } from "zod";
import AppError from "../utils/AppError";
import { clearAuthCookies, REFRESH_PATH } from "../utils/cookies";
import mongoose from "mongoose";
import AppErrorCode from "../constants/appErrorCode";

function handleZodError(res: Response, error: ZodError) {
  const errors = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));

  return res.error(BAD_REQUEST, {
    message: error.message,
    code: AppErrorCode.ValidationError,
    errors,
  });
}

function handleAppError(res: Response, error: AppError) {
  return res.error(error.statusCode, {
    message: error.message,
    code: error.errorCode,
  });
}

function handleCastError(res: Response, error: mongoose.Error.CastError) {
  return res.error(BAD_REQUEST, {
    message: error.message,
    code: AppErrorCode.ValidationError,
  });
}

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path} - ERROR: `, error);

  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }

  if (error instanceof z.ZodError) {
    return handleZodError(res, error);
  }

  if (error instanceof AppError) {
    return handleAppError(res, error);
  }

  if (error instanceof mongoose.Error.CastError) {
    return handleCastError(res, error);
  }

  return res.error(INTERNAL_SERVER_ERROR, {
    message: "Internal server error",
  });
};

export default errorHandler;
