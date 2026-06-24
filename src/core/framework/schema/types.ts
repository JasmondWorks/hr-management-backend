// ─────────────────────────────────────────────────────────────────────────────
// Schema field types with phantom type parameter for TypeScript inference.
// The `_output` phantom type is never set at runtime — it only exists so that
// `Infer<T>` can read it through conditional type matching.
// ─────────────────────────────────────────────────────────────────────────────

export interface StringField {
  readonly _kind: "string";
  readonly _optional: boolean;
  format?: "email" | "uuid" | "date-time" | "uri";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  description?: string;
}

export interface NumberField {
  readonly _kind: "number";
  readonly _optional: boolean;
  integer?: boolean;
  minimum?: number;
  maximum?: number;
  description?: string;
}

export interface BooleanField {
  readonly _kind: "boolean";
  readonly _optional: boolean;
  description?: string;
}

export interface ObjectField<P extends Record<string, AnyField>> {
  readonly _kind: "object";
  readonly _optional: boolean;
  properties: P;
  description?: string;
}

export interface ArrayField<I extends AnyField> {
  readonly _kind: "array";
  readonly _optional: boolean;
  items: I;
  description?: string;
}

export type AnyField =
  | StringField
  | NumberField
  | BooleanField
  | ObjectField<Record<string, AnyField>>
  | ArrayField<AnyField>;

// ─────────────────────────────────────────────────────────────────────────────
// Infer<F> — maps a field definition to its TypeScript type.
// Required fields produce the plain type; optional fields add `| undefined`.
// ─────────────────────────────────────────────────────────────────────────────

type InferBase<F extends AnyField> =
  F extends StringField ? string :
  F extends NumberField ? number :
  F extends BooleanField ? boolean :
  F extends ObjectField<infer P> ? InferObject<P> :
  F extends ArrayField<infer I> ? InferBase<I>[] :
  never;

// Required keys: those whose field has _optional = false
type RequiredKeys<P extends Record<string, AnyField>> = {
  [K in keyof P]: P[K]["_optional"] extends true ? never : K;
}[keyof P];

// Optional keys: those whose field has _optional = true
type OptionalKeys<P extends Record<string, AnyField>> = {
  [K in keyof P]: P[K]["_optional"] extends true ? K : never;
}[keyof P];

type InferObject<P extends Record<string, AnyField>> =
  { [K in RequiredKeys<P>]: InferBase<P[K]> } &
  { [K in OptionalKeys<P>]?: InferBase<P[K]> };

type ResolveFieldType<F> = F extends { build(): infer R } ? R : F;

export type Infer<F> = ResolveFieldType<F> extends AnyField
  ? InferBase<ResolveFieldType<F>>
  : never;
