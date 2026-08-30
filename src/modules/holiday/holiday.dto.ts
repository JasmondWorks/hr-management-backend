import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const HolidayResponseSchema = registry.register(
  "Holiday",
  z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    name: z.string(),
    date: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const CreateHolidayBodySchema = registry.register(
  "CreateHolidayInput",
  z.object({
    name: z
      .string({ message: "Holiday name is required" })
      .min(2, "Holiday name must be at least 2 characters long"),
    date: z.coerce.date(),
  }),
);

export const createHolidaySchema = z.object({
  body: CreateHolidayBodySchema,
});

export const holidayIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid holiday ID format (must be UUID)"),
  }),
});

export const getHolidaysSchema = z.object({
  query: paginationQuerySchema,
});

export type CreateHolidayDto = z.infer<typeof CreateHolidayBodySchema>;
