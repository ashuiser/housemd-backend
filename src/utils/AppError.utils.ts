export default class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: unknown;

  constructor({
    code,
    message,
    details,
    statusCode,
  }: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  }) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;

    Error.captureStackTrace(this, AppError);
  }
}
