// middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";

interface ErrorResponse {
  status?: number;
  message: string;
  stack?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const response: ErrorResponse = {
    message: err.message
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}