import { registry } from "../../core/docs/registry";
import { AttendanceResponseSchema } from "./attendance.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

const listResponse = (description: string) => ({
  200: {
    description,
    content: {
      "application/json": {
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.array(AttendanceResponseSchema),
          meta: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
          }),
        }),
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/attendance/check-in",
  summary: "Check in for today (employee)",
  description: "Records the employee's check-in. Allowed once per day.",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  responses: {
    201: { description: "Checked in" },
    404: { description: "No employee profile" },
    409: { description: "Already checked in today" },
  },
});

registry.registerPath({
  method: "post",
  path: "/attendance/check-out",
  summary: "Check out for today (employee)",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Checked out" },
    400: { description: "Not checked in today" },
    409: { description: "Already checked out today" },
  },
});

registry.registerPath({
  method: "get",
  path: "/attendance/mine",
  summary: "List my attendance history (employee)",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: listResponse("Attendance retrieved"),
});

registry.registerPath({
  method: "get",
  path: "/attendance",
  summary: "List the organization's attendance (org admin)",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: listResponse("Organization attendance retrieved"),
});
