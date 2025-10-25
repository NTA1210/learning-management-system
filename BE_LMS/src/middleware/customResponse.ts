import { NextFunction, Request, Response } from "express";
import { IApiResponse } from "../types/apiResponse.type";
import { nowLocal, nowTZone } from "../utils/time";

const customResponse = (req: Request, res: Response, next: NextFunction) => {
  res.success = function <T>(
    status: number,
    data?: T,
    message?: string,
    args?: object
  ) {
    const response: IApiResponse<T> = {
      success: true,
      message: message || "Success",
      data: data ?? null,
      meta: {
        timestamp: nowLocal(),
        timezone: nowTZone(),
        ...args,
      },
    };

    return res.status(status).json(response);
  };

  res.error = function (
    status: number,
    message?: string,
    code?: string,
    details?: any,
    args?: object
  ) {
    const response: IApiResponse<null> = {
      success: false,
      message: message || "Error",
      data: null,
      error: {
        code,
        details,
      },
      meta: {
        timestamp: nowLocal(),
        timezone: nowTZone(),
        ...args,
      },
    };

    return res.status(status).json(response);
  };

  next();
};

export default customResponse;
