import { ErrorRequestHandler, Response } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants/http';
import z, { ZodError } from 'zod';
import AppError from '../utils/AppError';
import { clearAuthCookies, REFRESH_PATH } from '../utils/cookies';
import mongoose from 'mongoose';
import multer from 'multer';
import AppErrorCode from '../constants/appErrorCode';

function handleZodError(res: Response, error: ZodError) {
  const errors = error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return res.error(BAD_REQUEST, {
    message: errors[0].message,
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

function handleJSONParseError(res: Response) {
  return res.error(BAD_REQUEST, {
    message: 'Invalid JSON format',
    code: AppErrorCode.ValidationError,
  });
}

function handleValidationMongooseError(res: Response, error: mongoose.Error.ValidationError) {
  console.log('ValidationError');

  return res.error(BAD_REQUEST, {
    message: error.message,
    code: AppErrorCode.ValidationError,
  });
}

function handleMongoError(res: Response, error: mongoose.Error) {
  return res.error(BAD_REQUEST, {
    message: error.message,
  });
}

function handleMulterError(res: Response, error: multer.MulterError) {
  const isFileTooLarge = error.code === 'LIMIT_FILE_SIZE';
  return res.error(BAD_REQUEST, {
    message: isFileTooLarge ? 'File size exceeds the 5MB limit' : error.message,
    code: AppErrorCode.UploadFileError,
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

  if (error instanceof mongoose.Error.ValidationError) {
    return handleValidationMongooseError(res, error);
  }

  if (error instanceof mongoose.Error) {
    return handleMongoError(res, error);
  }

  if (error instanceof multer.MulterError) {
    return handleMulterError(res, error);
  }

  if (error.type === 'entity.parse.failed') {
    return handleJSONParseError(res);
  }

  return res.error(INTERNAL_SERVER_ERROR, {
    message: 'Internal server error',
  });
};

export default errorHandler;
