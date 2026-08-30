import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const AttendanceResponseSchema = registry.register(
  "Attendance",
  z.object({
    id: z.string().uuid(),
    employeeId: z.string().uuid(),
    date: z.string(),
    checkInTime: z.string().nullable(),
    checkOutTime: z.string().nullable(),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "ON_LEAVE", "WEEKEND"]),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const getAttendancesSchema = z.object({
  query: paginationQuerySchema.extend({
    employeeId: z.string().uuid().optional(),
  }),
});
