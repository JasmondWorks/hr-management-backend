import type { ParsedQuery } from "../dto/query.dto";

/**
 * Options for shaping which non-scalar (relation) fields come back from a query.
 * `include`/`select` are mutually exclusive at the Prisma level — pass only one.
 */
export interface FindOptions {
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  omit?: Record<string, unknown>;
}

/**
 * @typeParam T         - the model's scalar/result type (default query result).
 * @typeParam TDelegate - the Prisma delegate type (e.g. `typeof prisma.organization`).
 *   Pass it from a subclass to get full Prisma intellisense on `this.model`
 *   (include/select/where/etc). Defaults to `any` for repositories that don't need it.
 */
export abstract class BaseRepository<T, TDelegate = any> {
  protected readonly useSoftDelete: boolean = false;

  protected constructor(protected readonly model: TDelegate) {}

  // Allows creating a temporary repository instance that uses a transaction delegate (e.g. tx.candidate)
  withTransaction(delegate: any): this {
    const clone = Object.create(this);
    clone.model = delegate;
    return clone;
  }

  // Loosely-typed view of the delegate for the generic helpers below, so the
  // base doesn't fight Prisma's exact per-model arg types while staying reusable.
  private get delegate(): any {
    return this.model;
  }

  private applySoftDeleteFilter(where: any = {}) {
    if (!this.useSoftDelete) return where;
    return { ...where, isDeleted: false };
  }

  async findAll<R = T>(options: FindOptions & { where?: any } = {}): Promise<R[]> {
    const where = this.applySoftDeleteFilter(options.where);
    return this.delegate.findMany({ ...options, where });
  }

  async findPaginated<R = T>(
    query: ParsedQuery,
    where: any = {},
    options: FindOptions = {},
  ): Promise<{ data: R[]; total: number }> {
    const filteredWhere = this.applySoftDeleteFilter(where);
    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where: filteredWhere,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.order },
        ...options,
      }),
      this.delegate.count({ where: filteredWhere }),
    ]);

    return { data, total };
  }

  async findById<R = T>(
    id: string | number,
    options: FindOptions = {},
  ): Promise<R | null> {
    const where = this.applySoftDeleteFilter({ id });
    return this.delegate.findFirst({
      where,
      ...options,
    });
  }

  async create(data: Partial<T>): Promise<T> {
    return this.delegate.create({
      data,
    });
  }

  async update(id: string | number, data: Partial<T>): Promise<T> {
    // Ideally, we might want to check soft delete here too, but updating by ID implies we know the ID.
    // If we only want to allow updates on non-deleted records:
    const where = this.useSoftDelete ? { id, isDeleted: false } : { id };
    // Prisma `update` requires a unique constraint on `where`. `isDeleted` is not part of the unique constraint (usually just `id`).
    // So we use `updateMany` and return the updated record (or just trust the `id` for now).
    // Let's stick to standard `update` for simplicity, as soft-deleted records shouldn't typically be updated anyway.
    return this.delegate.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string | number): Promise<T> {
    if (!this.useSoftDelete) {
      throw new Error("softDelete is not enabled for this repository");
    }
    return this.delegate.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async delete(id: string | number): Promise<T> {
    return this.delegate.delete({
      where: { id },
    });
  }
}
