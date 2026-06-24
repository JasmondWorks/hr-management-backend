import type { AnyField, Infer } from "../schema/types";
import type { BuildableField } from "../schema/builder";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Any value that can be used as a schema in a contract.
 * Accepts both plain field objects and builder instances (which get resolved
 * lazily by compileSchema/validate/createRoute via resolveField()).
 */
export type FieldLike = AnyField | BuildableField;

/**
 * A Contract is the single source of truth for one API endpoint.
 * It drives: Express route registration, request validation, and OpenAPI docs.
 *
 * Use `satisfies Contract` on definitions to keep full type inference:
 *
 * @example
 * export const registerContract = {
 *   method: 'POST',
 *   path: '/register',
 *   summary: 'Register a new user',
 *   tags: ['Authentication'],
 *   body: s.object({ email: s.string().email() }),
 *   response: { 201: s.object({ id: s.string().uuid() }) },
 *   auth: false,
 * } satisfies Contract;
 */
export interface Contract {
  method: HttpMethod;

  /** Express-style path relative to the module prefix: '/register', '/:id' */
  path: string;

  summary: string;
  description?: string;
  tags: string[];

  /** Request body schema. Absent on GET/DELETE by convention. */
  body?: FieldLike;

  /** Map of HTTP status code → response schema */
  response: Record<number, FieldLike>;

  /** Path params schema, e.g. s.object({ id: s.string().uuid() }) */
  params?: FieldLike;

  /** Query string schema */
  query?: FieldLike;

  /**
   * When true, the authenticate middleware is prepended automatically.
   * The endpoint will also get `security: [{ bearerAuth: [] }]` in OpenAPI.
   */
  auth?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler context — what the handler function receives
// ─────────────────────────────────────────────────────────────────────────────

export interface HandlerContext<
  TBody extends FieldLike | undefined = undefined,
  TParams extends FieldLike | undefined = undefined,
  TQuery extends FieldLike | undefined = undefined,
> {
  body: Exclude<TBody, undefined> extends FieldLike ? Infer<Exclude<TBody, undefined>> : Record<string, unknown>;
  params: Exclude<TParams, undefined> extends FieldLike ? Infer<Exclude<TParams, undefined>> : Record<string, string>;
  query: Exclude<TQuery, undefined> extends FieldLike ? Infer<Exclude<TQuery, undefined>> : Record<string, string>;
  /** Raw Express request — use for cookies, headers, user context */
  req: import("express").Request;
  /** Raw Express response — use sparingly; prefer returning HandlerResult */
  res: import("express").Response;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler return value — the framework calls res.json() for you
// ─────────────────────────────────────────────────────────────────────────────

export interface HandlerResult<T = unknown> {
  status: number;
  data?: T;
  message?: string;
}

export type Handler<
  TBody extends FieldLike | undefined = any,
  TParams extends FieldLike | undefined = any,
  TQuery extends FieldLike | undefined = any,
> = (ctx: HandlerContext<TBody, TParams, TQuery>) => Promise<HandlerResult>;

// AnyContract alias (kept for backward compat with loader/swagger builder)
export type AnyContract = Contract;
