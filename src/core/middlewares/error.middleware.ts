import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error";
import { sendError } from "../utils/response.util";
import logger from "../config/logger";

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    logger.error("Unexpected error: %O", err);
  }

  sendError(res, statusCode, message, err.stack);
};
