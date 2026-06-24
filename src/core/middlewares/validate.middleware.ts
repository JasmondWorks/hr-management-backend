import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestException } from "../errors/app.error";

export const validate = (schema: z.ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues
          .map((issue) => {
            const fieldPath = issue.path.slice(1).join(".");
            return `${fieldPath}: ${issue.message}`;
          })
          .join(", ");
        next(new BadRequestException(`Validation failed: ${errorMessages}`));
      } else {
        next(error);
      }
    }
  };
};
