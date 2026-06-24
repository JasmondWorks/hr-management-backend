import swaggerUi from "swagger-ui-express";
import { Router } from "express";
import type { AppModule } from "../loader";
import { buildSpec } from "../swagger/builder";

/**
 * Pre-created Express router that serves Swagger UI.
 * Configured synchronously when initSwagger() is called in app.ts.
 */
export const docsRouter = Router();

/**
 * Builds the OpenAPI spec from contracts and mounts the Swagger UI middleware.
 * Must be called in app.ts before mounting docsRouter.
 */
export function initSwagger(modules: AppModule[]): void {
  const spec = buildSpec(modules);
  docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(spec));
}
