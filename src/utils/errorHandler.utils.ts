import type { NextFunction, Request, Response } from "express";
import AppError from "./AppError.utils.js";
import sendResponse from "./sendResponse.utils.js";

export default function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    console.error("App Error: ", err);
    return sendResponse({
      res,
      success: false,
      statusCode: err.statusCode,
      error: err,
    });
  }

  console.error("Unexpected error: ", err);

  return sendResponse({
    res,
    success: false,
    statusCode: 500,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}
