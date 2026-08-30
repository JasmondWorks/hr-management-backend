import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestException } from "../errors/app.error";

/**
 * Validates `{ body, query, params }` against a schema and — importantly —
 * writes the parsed result back onto the request.
 *
 * Without the write-back, `z.coerce`, `.transform()` and `.default()` in a DTO
 * are silently inert: the schema validates, the handler still receives the raw
 * strings, and the DTO's inferred type is a lie. That gap previously reached the
 * database as a 500 (a `z.coerce.date()` field arriving as a string).
 *
 * Only keys the schema actually declares are written back, so a schema of
 * `z.object({ body })` leaves query and params untouched.
 */
export const validate = (schema: z.ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.query !== undefined) {
        // Express 5 exposes `req.query` through a getter, so a plain assignment
        // is silently discarded rather than throwing — the parsed value would
        // never reach the handler. defineProperty is the only way to replace it.
        Object.defineProperty(req, "query", {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      // `req.params` is deliberately left alone: the router re-assigns it per
      // layer, so a write-back here would not survive to the next handler
      // anyway. Params are path strings; coerce them in the service if needed.

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
