export interface PaginationParams {
  page?: number;
  limit?: number;
}

export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: any) {}

  async findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  async findPaginated(
    params: PaginationParams,
    where: any = {},
  ): Promise<{ data: T[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({ where, skip, take: limit }),
      this.model.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string | number): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create({
      data,
    });
  }

  async update(id: string | number, data: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string | number): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }
}
