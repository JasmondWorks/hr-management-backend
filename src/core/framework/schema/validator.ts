import { BadRequestException } from "../../errors/app.error";
import type { AnyField } from "./types";
import { resolveField } from "./builder";

type ValidationError = { field: string; message: string };

/**
 * Validates `data` against a field schema.
 * Collects all field errors before throwing so the client gets a complete
 * list of issues in a single response.
 *
 * Throws `BadRequestException` with a structured error message on failure.
 */
export function validate(data: unknown, schema: AnyField, path = "body"): void {
  const errors: ValidationError[] = [];
  validateField(data, resolveField(schema), path, errors);

  if (errors.length > 0) {
    const message = errors.map((e) => `${e.field}: ${e.message}`).join("; ");
    throw new BadRequestException(message);
  }
}

function validateField(
  value: unknown,
  field: AnyField,
  path: string,
  errors: ValidationError[],
): void {
  // Handle optional fields
  if (value === undefined || value === null) {
    if (!field._optional) {
      errors.push({ field: path, message: "is required" });
    }
    return;
  }

  switch (field._kind) {
    case "string":
      validateString(value, field, path, errors);
      break;
    case "number":
      validateNumber(value, field, path, errors);
      break;
    case "boolean":
      validateBoolean(value, field, path, errors);
      break;
    case "object":
      validateObject(value, field, path, errors);
      break;
    case "array":
      validateArray(value, field, path, errors);
      break;
  }
}

function validateString(
  value: unknown,
  field: AnyField & { _kind: "string" },
  path: string,
  errors: ValidationError[],
): void {
  if (typeof value !== "string") {
    errors.push({ field: path, message: "must be a string" });
    return;
  }
  if (field.minLength !== undefined && value.length < field.minLength) {
    errors.push({ field: path, message: `must be at least ${field.minLength} characters` });
  }
  if (field.maxLength !== undefined && value.length > field.maxLength) {
    errors.push({ field: path, message: `must be at most ${field.maxLength} characters` });
  }
  if (field.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.push({ field: path, message: "must be a valid email address" });
  }
  if (field.format === "uuid" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    errors.push({ field: path, message: "must be a valid UUID" });
  }
  if (field.pattern && !new RegExp(field.pattern).test(value)) {
    errors.push({ field: path, message: `must match pattern ${field.pattern}` });
  }
  if (field.enum && !field.enum.includes(value)) {
    errors.push({ field: path, message: `must be one of: ${field.enum.join(", ")}` });
  }
}

function validateNumber(
  value: unknown,
  field: AnyField & { _kind: "number" },
  path: string,
  errors: ValidationError[],
): void {
  if (typeof value !== "number" || isNaN(value)) {
    errors.push({ field: path, message: "must be a number" });
    return;
  }
  if (field.integer && !Number.isInteger(value)) {
    errors.push({ field: path, message: "must be an integer" });
  }
  if (field.minimum !== undefined && value < field.minimum) {
    errors.push({ field: path, message: `must be at least ${field.minimum}` });
  }
  if (field.maximum !== undefined && value > field.maximum) {
    errors.push({ field: path, message: `must be at most ${field.maximum}` });
  }
}

function validateBoolean(
  value: unknown,
  _field: AnyField & { _kind: "boolean" },
  path: string,
  errors: ValidationError[],
): void {
  if (typeof value !== "boolean") {
    errors.push({ field: path, message: "must be a boolean" });
  }
}

function validateObject(
  value: unknown,
  field: AnyField & { _kind: "object" },
  path: string,
  errors: ValidationError[],
): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push({ field: path, message: "must be an object" });
    return;
  }

  const obj = value as Record<string, unknown>;

  for (const [key, propField] of Object.entries(field.properties)) {
    const propPath = `${path}.${key}`;
    validateField(obj[key], resolveField(propField), propPath, errors);
  }
}

function validateArray(
  value: unknown,
  field: AnyField & { _kind: "array" },
  path: string,
  errors: ValidationError[],
): void {
  if (!Array.isArray(value)) {
    errors.push({ field: path, message: "must be an array" });
    return;
  }

  const itemField = resolveField(field.items);
  value.forEach((item, i) => {
    validateField(item, itemField, `${path}[${i}]`, errors);
  });
}
