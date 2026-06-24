import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  meta?: PaginationMeta,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};
