import type {
  AnyField,
  StringField,
  NumberField,
  BooleanField,
  ObjectField,
  ArrayField,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Builder classes — fluent API with method chaining.
// Each builder stores plain field data internally and returns `this`
// for chaining. `.build()` returns the plain field object.
// ─────────────────────────────────────────────────────────────────────────────

class StringBuilder {
  private field: Omit<StringField, "_optional"> & { _optional: false } = {
    _kind: "string",
    _optional: false,
  };

  email(): this {
    this.field.format = "email";
    return this;
  }

  uuid(): this {
    this.field.format = "uuid";
    return this;
  }

  dateTime(): this {
    this.field.format = "date-time";
    return this;
  }

  uri(): this {
    this.field.format = "uri";
    return this;
  }

  min(n: number): this {
    this.field.minLength = n;
    return this;
  }

  max(n: number): this {
    this.field.maxLength = n;
    return this;
  }

  pattern(regex: string): this {
    this.field.pattern = regex;
    return this;
  }

  oneOf(values: string[]): this {
    this.field.enum = values;
    return this;
  }

  describe(text: string): this {
    this.field.description = text;
    return this;
  }

  optional(): OptionalStringBuilder {
    return new OptionalStringBuilder({ ...this.field });
  }

  build(): StringField & { _optional: false } {
    return { ...this.field };
  }
}

class OptionalStringBuilder {
  private field: StringField & { _optional: true };

  constructor(base: Omit<StringField, "_optional">) {
    this.field = { ...base, _optional: true };
  }

  build(): StringField & { _optional: true } {
    return { ...this.field };
  }
}

class NumberBuilder {
  private field: Omit<NumberField, "_optional"> & { _optional: false } = {
    _kind: "number",
    _optional: false,
  };

  int(): this {
    this.field.integer = true;
    return this;
  }

  min(n: number): this {
    this.field.minimum = n;
    return this;
  }

  max(n: number): this {
    this.field.maximum = n;
    return this;
  }

  describe(text: string): this {
    this.field.description = text;
    return this;
  }

  optional(): OptionalNumberBuilder {
    return new OptionalNumberBuilder({ ...this.field });
  }

  build(): NumberField & { _optional: false } {
    return { ...this.field };
  }
}

class OptionalNumberBuilder {
  private field: NumberField & { _optional: true };

  constructor(base: Omit<NumberField, "_optional">) {
    this.field = { ...base, _optional: true };
  }

  build(): NumberField & { _optional: true } {
    return { ...this.field };
  }
}

class BooleanBuilder {
  private field: Omit<BooleanField, "_optional"> & { _optional: false } = {
    _kind: "boolean",
    _optional: false,
  };

  describe(text: string): this {
    this.field.description = text;
    return this;
  }

  optional(): OptionalBooleanBuilder {
    return new OptionalBooleanBuilder({ ...this.field });
  }

  build(): BooleanField & { _optional: false } {
    return { ...this.field };
  }
}

class OptionalBooleanBuilder {
  private field: BooleanField & { _optional: true };

  constructor(base: Omit<BooleanField, "_optional">) {
    this.field = { ...base, _optional: true };
  }

  build(): BooleanField & { _optional: true } {
    return { ...this.field };
  }
}

class ObjectBuilder<P extends Record<string, AnyField>> {
  private field: Omit<ObjectField<P>, "_optional"> & { _optional: false };

  constructor(properties: P) {
    this.field = { _kind: "object", _optional: false, properties };
  }

  describe(text: string): this {
    this.field.description = text;
    return this;
  }

  optional(): OptionalObjectBuilder<P> {
    return new OptionalObjectBuilder<P>({ ...this.field });
  }

  build(): ObjectField<P> & { _optional: false } {
    return { ...this.field };
  }
}

class OptionalObjectBuilder<P extends Record<string, AnyField>> {
  private field: ObjectField<P> & { _optional: true };

  constructor(base: Omit<ObjectField<P>, "_optional">) {
    this.field = { ...base, _optional: true };
  }

  build(): ObjectField<P> & { _optional: true } {
    return { ...this.field };
  }
}

class ArrayBuilder<I extends AnyField> {
  private field: Omit<ArrayField<I>, "_optional"> & { _optional: false };

  constructor(items: I) {
    this.field = { _kind: "array", _optional: false, items };
  }

  describe(text: string): this {
    this.field.description = text;
    return this;
  }

  optional(): OptionalArrayBuilder<I> {
    return new OptionalArrayBuilder<I>({ ...this.field });
  }

  build(): ArrayField<I> & { _optional: false } {
    return { ...this.field };
  }
}

class OptionalArrayBuilder<I extends AnyField> {
  private field: ArrayField<I> & { _optional: true };

  constructor(base: Omit<ArrayField<I>, "_optional">) {
    this.field = { ...base, _optional: true };
  }

  build(): ArrayField<I> & { _optional: true } {
    return { ...this.field };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Field helpers that build automatically (no explicit .build() needed).
// The `s` object is the primary public API.
// Calling s.string() returns a field — builders are transparent.
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildableField {
  build(): AnyField;
}

/**
 * Resolves a field builder or a raw AnyField into a plain AnyField.
 * Used internally by the compiler and validator.
 */
export function resolveField(f: AnyField | BuildableField): AnyField {
  if ("_kind" in f) return f as AnyField;
  return (f as BuildableField).build() as AnyField;
}

/**
 * The schema builder — the primary API surface.
 *
 * @example
 * const BodySchema = s.object({
 *   email: s.string().email(),
 *   password: s.string().min(8),
 *   age: s.number().optional(),
 * });
 */
type ResolveProperties<P extends Record<string, any>> = {
  [K in keyof P]: P[K] extends { build(): infer R } ? (R extends AnyField ? R : never) : (P[K] extends AnyField ? P[K] : never);
};

export const s = {
  string: () => new StringBuilder(),
  number: () => new NumberBuilder(),
  boolean: () => new BooleanBuilder(),
  object: <P extends Record<string, AnyField | BuildableField>>(
    properties: P,
  ) => {
    // Resolve all property builders eagerly so internals always get plain fields
    const resolved = Object.fromEntries(
      Object.entries(properties).map(([k, v]) => [k, resolveField(v)]),
    ) as any;
    return new ObjectBuilder(resolved as ResolveProperties<P>);
  },
  array: <I extends AnyField | BuildableField>(items: I) =>
    new ArrayBuilder(resolveField(items)),
};

// Re-export builders for use in resolveField outside this module
