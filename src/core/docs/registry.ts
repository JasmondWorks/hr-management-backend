import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod once to enable .openapi() on Zod schemas
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register the security scheme globally in the registry components
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});
