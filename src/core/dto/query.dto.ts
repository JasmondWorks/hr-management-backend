import { z } from "zod";
import { registry } from "../docs/registry";

export const paginationQuerySchema = registry.register(
  "PaginationQuery",
  z.object({
    page: z.string().optional().openapi({ description: "Page number (default: 1)" }),
    limit: z.string().optional().openapi({ description: "Items per page (default: 10)" }),
    sortBy: z.string().optional().openapi({ description: "Field to sort by (e.g. createdAt)" }),
    order: z.enum(["asc", "desc"]).optional().openapi({ description: "Sort direction (default: desc)" }),
    search: z.string().optional().openapi({ description: "Search term" }),
  }),
);

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface ParsedQuery {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  order: "asc" | "desc";
  search?: string;
}

export function parseQuery(raw: PaginationQuery, defaultSortBy = "createdAt"): ParsedQuery {
  const page = Math.max(Number(raw.page) || 1, 1);
  const limit = Math.min(Math.max(Number(raw.limit) || 10, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy: raw.sortBy || defaultSortBy,
    order: raw.order || "desc",
    search: raw.search || undefined,
  };
}
