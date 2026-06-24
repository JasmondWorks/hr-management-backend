import type { OpenAPIV3 } from "openapi-types";
import type { AnyField } from "./types";
import { resolveField } from "./builder";

/**
 * Converts an internal schema field into an OpenAPI 3.0 SchemaObject.
 * Recursively handles object properties and array items.
 */
export function compileSchema(field: AnyField): OpenAPIV3.SchemaObject {
  const f = resolveField(field);

  switch (f._kind) {
    case "string": {
      const schema: OpenAPIV3.SchemaObject = { type: "string" };
      if (f.format) schema.format = f.format;
      if (f.minLength !== undefined) schema.minLength = f.minLength;
      if (f.maxLength !== undefined) schema.maxLength = f.maxLength;
      if (f.pattern) schema.pattern = f.pattern;
      if (f.enum) schema.enum = f.enum;
      if (f.description) schema.description = f.description;
      return schema;
    }

    case "number": {
      const schema: OpenAPIV3.SchemaObject = {
        type: f.integer ? "integer" : "number",
      };
      if (f.minimum !== undefined) schema.minimum = f.minimum;
      if (f.maximum !== undefined) schema.maximum = f.maximum;
      if (f.description) schema.description = f.description;
      return schema;
    }

    case "boolean": {
      const schema: OpenAPIV3.SchemaObject = { type: "boolean" };
      if (f.description) schema.description = f.description;
      return schema;
    }

    case "object": {
      const required: string[] = [];
      const properties: Record<string, OpenAPIV3.SchemaObject> = {};

      for (const [key, propField] of Object.entries(f.properties)) {
        const resolved = resolveField(propField);
        properties[key] = compileSchema(resolved);
        if (!resolved._optional) {
          required.push(key);
        }
      }

      const schema: OpenAPIV3.SchemaObject = { type: "object", properties };
      if (required.length) schema.required = required;
      if (f.description) schema.description = f.description;
      return schema;
    }

    case "array": {
      const schema: OpenAPIV3.SchemaObject = {
        type: "array",
        items: compileSchema(resolveField(f.items)),
      };
      if (f.description) schema.description = f.description;
      return schema;
    }

    default: {
      const _exhaustive: never = f;
      return _exhaustive;
    }
  }
}
