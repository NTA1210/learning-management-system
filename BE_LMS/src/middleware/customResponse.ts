import { NextFunction, Request, Response } from "express";
import { IApiResponse } from "../types/dto/apiResponse.type";
import { nowLocal, nowTZone } from "../utils/time";

const customResponse = (req: Request, res: Response, next: NextFunction) => {
  res.success = function <T>(
    status: number,
    {
      data,
      message,
      ...args
    }: {
      data?: T;
      message?: string;
      [key: string]: any;
    }
  ) {
    const response: IApiResponse<T> = {
      success: true,
      message: message || "Success",
      data: data ?? null,
      ...args,
      meta: {
        timestamp: nowLocal(),
        timezone: nowTZone(),
      },
    };

    return res.status(status).json(response);
  };

  res.error = function (
    status: number,
    {
      message,
      code,
      details,
      ...args
    }: {
      message?: string;
      code?: string;
      details?: any;
      [key: string]: any;
    }
  ) {
    const response: IApiResponse<null> = {
      success: false,
      message: message || "Error",
      data: null,
      error: {
        code,
        details,
      },
      ...args,
      meta: {
        timestamp: nowLocal(),
        timezone: nowTZone(),
      },
    };

    return res.status(status).json(response);
  };

  next();
};

export default customResponse;
