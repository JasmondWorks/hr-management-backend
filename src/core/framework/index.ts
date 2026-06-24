/**
 * @module core/framework
 *
 * The contract-first framework public API.
 *
 * Import everything you need from here:
 *   import { s, createRoute } from '../../../core/framework';
 *   import type { Contract, Infer, AnyContract } from '../../../core/framework';
 */

// Schema builder
export { s, resolveField } from "./schema/builder";

// Schema compiler (for infrastructure code)
export { compileSchema } from "./schema/compiler";

// Schema validator (exposed for custom use cases)
export { validate } from "./schema/validator";

// Type exports
export type { AnyField, Infer } from "./schema/types";
export type {
  Contract,
  AnyContract,
  HttpMethod,
  Handler,
  HandlerContext,
  HandlerResult,
} from "./contract/types";

// Route factory
export { createRoute } from "./route/factory";
