import { registry } from "../../core/docs/registry";
import { CreateHolidayBodySchema, HolidayResponseSchema } from "./holiday.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

registry.registerPath({
  method: "post",
  path: "/holidays",
  summary: "Create an organization holiday (org admin)",
  description:
    "Adds an org-wide holiday and notifies every member of the organization.",
  tags: ["Holidays"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateHolidayBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Holiday created",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: HolidayResponseSchema,
          }),
        },
      },
    },
    409: { description: "A holiday already exists on this date" },
  },
});

registry.registerPath({
  method: "get",
  path: "/holidays",
  summary: "List organization holidays",
  tags: ["Holidays"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Holidays retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(HolidayResponseSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/holidays/{id}",
  summary: "Delete an organization holiday (org admin)",
  tags: ["Holidays"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Holiday UUID" }),
    }),
  },
  responses: {
    200: { description: "Holiday deleted" },
    403: { description: "Not your organization's holiday" },
    404: { description: "Holiday not found" },
  },
});
