import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import z, { ZodError } from "zod";
import AppError from "../utils/AppError";
import { clearAuthCookies, REFRESH_PATH } from "../utils/cookies";
import mongoose from "mongoose";

function handleZodError(res: Response, error: ZodError) {
  const errors = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));

  return res.status(BAD_REQUEST).json({
    message: error.message,
    errors,
  });
}

function handleAppError(res: Response, error: AppError) {
  return res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
  });
}

function handleCastError(res: Response, error: mongoose.Error.CastError) {
  return res.status(BAD_REQUEST).json({
    message: `Invalid ${error.path}: ${error.value}`,
    errorCode: "INVALID",
  });
}

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path}`, error);

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

  return res.status(INTERNAL_SERVER_ERROR).send("Internal server error");
};

export default errorHandler;
