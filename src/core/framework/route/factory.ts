import type { RequestHandler } from "express";
import type { Contract, Handler, FieldLike } from "../contract/types";
import { resolveField } from "../schema/builder";
import { validate } from "../schema/validator";
import { authenticate } from "../../middlewares/auth.middleware";

/**
 * createRoute — the route factory.
 *
 * Returns an array of Express RequestHandlers that:
 *   1. Optionally runs `authenticate` (when `contract.auth === true`)
 *   2. Validates body / params / query against the contract schemas
 *   3. Calls the handler with `{ body, params, query, req, res }`
 *   4. Sends the handler's result as `{ success, message?, data? }` JSON
 *
 * All errors are forwarded to `next(err)` so the global error middleware
 * handles them uniformly.
 *
 * @example
 * router.post(
 *   '/register',
 *   ...createRoute(registerContract, async ({ body }) => {
 *     const user = await authService.register(body as RegisterInput);
 *     return { status: 201, data: user, message: 'Registered' };
 *   }),
 * );
 */
export function createRoute<
  TBody extends FieldLike | undefined = any,
  TParams extends FieldLike | undefined = any,
  TQuery extends FieldLike | undefined = any,
>(
  contract: Omit<Contract, "body" | "params" | "query"> & {
    body?: TBody;
    params?: TParams;
    query?: TQuery;
  },
  handler: Handler<TBody, TParams, TQuery>,
): RequestHandler[] {
  const middlewares: RequestHandler[] = [];

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (contract.auth) {
    middlewares.push(authenticate);
  }

  // ── Main handler ───────────────────────────────────────────────────────────
  middlewares.push(async (req, res, next) => {
    try {
      // Validate body
      if (contract.body) {
        validate(req.body, resolveField(contract.body), "body");
      }

      // Validate path params
      if (contract.params) {
        validate(req.params, resolveField(contract.params), "params");
      }

      // Validate query string
      if (contract.query) {
        validate(req.query, resolveField(contract.query), "query");
      }

      const result = await handler({
        body: req.body as any,
        params: req.params as any,
        query: req.query as any,
        req,
        res,
      });

      res.status(result.status).json({
        success: true,
        ...(result.message && { message: result.message }),
        ...(result.data !== undefined && { data: result.data }),
      });
    } catch (err) {
      next(err);
    }
  });

  return middlewares;
}
