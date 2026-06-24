import type { OpenAPIV3 } from "openapi-types";
import type { AppModule } from "../loader";
import { compileSchema } from "../framework/schema/compiler";
import { resolveField } from "../framework/schema/builder";

const BASE_SPEC: Omit<OpenAPIV3.Document, "paths"> = {
  openapi: "3.0.3",

  info: {
    title: "HRMS API",
    version: "1.0.0",
    description: "Enterprise HR Management System API",
  },

  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Development",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {},
    responses: {},
  },

  security: [{ bearerAuth: [] }],
};

/**
 * Builds a complete OpenAPIV3.Document from an array of AppModules.
 *
 * For each module, iterates its contracts and:
 *   - Creates a path entry keyed by `/<module.name><contract.path>`
 *   - Compiles body, params, query, and response schemas
 *   - Attaches security requirement when contract.auth = true
 *   - Collects all tags
 *
 * No manual paths files. No duplication. Contracts are the single truth.
 */
export function buildSpec(modules: AppModule[]): OpenAPIV3.Document {
  const paths: OpenAPIV3.PathsObject = {};
  const tagSet = new Set<string>();
  const schemas: Record<string, OpenAPIV3.SchemaObject> = {};

  for (const mod of modules) {
    for (const contract of mod.contracts) {
      // Full path: prepend module name (loader mounts at /api/v1/<name>)
      // Swagger paths are relative to server base URL (/api/v1)
      const fullPath = `/${mod.name}${contract.path}`;

      if (!paths[fullPath]) {
        paths[fullPath] = {};
      }

      const method = contract.method.toLowerCase() as Lowercase<typeof contract.method>;

      // ── Tags ────────────────────────────────────────────────────────────────
      contract.tags.forEach((t) => tagSet.add(t));

      // ── Request body ────────────────────────────────────────────────────────
      let requestBody: OpenAPIV3.RequestBodyObject | undefined;
      if (contract.body) {
        const bodyField = resolveField(contract.body);
        requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: compileSchema(bodyField),
            },
          },
        };
      }

      // ── Parameters (path + query) ────────────────────────────────────────────
      const parameters: OpenAPIV3.ParameterObject[] = [];

      if (contract.params) {
        const paramsField = resolveField(contract.params);
        if (paramsField._kind === "object") {
          for (const [name, propField] of Object.entries(paramsField.properties)) {
            const resolved = resolveField(propField);
            parameters.push({
              name,
              in: "path",
              required: !resolved._optional,
              schema: compileSchema(resolved),
            });
          }
        }
      }

      if (contract.query) {
        const queryField = resolveField(contract.query);
        if (queryField._kind === "object") {
          for (const [name, propField] of Object.entries(queryField.properties)) {
            const resolved = resolveField(propField);
            parameters.push({
              name,
              in: "query",
              required: !resolved._optional,
              schema: compileSchema(resolved),
            });
          }
        }
      }

      // ── Responses ───────────────────────────────────────────────────────────
      const responses: OpenAPIV3.ResponsesObject = {};

      for (const [statusStr, responseField] of Object.entries(contract.response)) {
        const resolved = resolveField(responseField);
        responses[statusStr] = {
          description: defaultStatusDescription(Number(statusStr)),
          content: {
            "application/json": {
              schema: compileSchema(resolved),
            },
          },
        };
      }

      // Always include 400 and 401 for validated/authenticated routes
      if (contract.body && !responses["400"]) {
        responses["400"] = { description: "Validation error" };
      }
      if (contract.auth && !responses["401"]) {
        responses["401"] = { description: "Unauthorized" };
      }

      // ── Operation ───────────────────────────────────────────────────────────
      const operation: OpenAPIV3.OperationObject = {
        summary: contract.summary,
        tags: contract.tags,
        responses,
        ...(contract.description && { description: contract.description }),
        ...(requestBody && { requestBody }),
        ...(parameters.length && { parameters }),
        ...(contract.auth && { security: [{ bearerAuth: [] }] }),
      };

      (paths[fullPath] as Record<string, OpenAPIV3.OperationObject>)[method] = operation;
    }
  }

  return {
    ...BASE_SPEC,
    tags: Array.from(tagSet).map((name) => ({ name })),
    paths,
    components: {
      ...BASE_SPEC.components,
      schemas,
    },
  };
}

function defaultStatusDescription(status: number): string {
  const map: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error",
  };
  return map[status] ?? "Response";
}
