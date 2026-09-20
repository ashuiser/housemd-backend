import type { Response } from "express";

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type SuccessResponse = {
  success: true;
  data?: unknown;
};

export default function sendResponse(
  resData: (ErrorResponse | SuccessResponse) & {
    res: Response;
    statusCode: number;
  },
) {
  const { res, statusCode, success } = resData;
  if (success) {
    return res.status(statusCode).json({
      success: true,
      data: resData.data,
    });
  } else {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: resData.error.code,
        message: resData.error.message,
        details: resData.error.details,
      },
    });
  }
}
