import swaggerUi from "swagger-ui-express";
import { Router } from "express";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

// Statically import the docs to trigger registration
import "../../modules/auth/auth.docs";
import "../../modules/user/user.docs";
import "../../modules/organization/organization.docs";
import "../../modules/employee/employee.docs";
import "../../modules/application/application.docs";
import "../../modules/department/department.docs";
import "../../modules/office-branch/office-branch.docs";
import "../../modules/invitation/invitation.docs";
import "../../modules/onboarding/onboarding.docs";
import "../../modules/job/job.docs";
import "../../modules/notification/notification.docs";
import "../../modules/attendance/attendance.docs";
import "../../modules/payroll/payroll.docs";
import "../../modules/leave/leave.docs";
import "../../modules/holiday/holiday.docs";
import "../../modules/project/project.docs";
import "../../modules/upload/upload.docs";

const generator = new OpenApiGeneratorV3(registry.definitions);

// Point Swagger "Try it out" at the backend's own origin, not the frontend.
const PORT = process.env.PORT || 5000;

const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "HRMS API",
    version: "1.0.0",
    description: "Enterprise HR Management System API",
  },
  servers: [
    {
      url: `http://localhost:${PORT}/api/v1`,
      description: "Development server",
    },
  ],
});

export const docsRouter = Router();
docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
