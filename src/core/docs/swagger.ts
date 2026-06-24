import swaggerUi from "swagger-ui-express";
import { Router } from "express";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

// Statically import the docs to trigger registration
import "../../modules/auth/auth.docs";
import "../../modules/user/user.docs";
import "../../modules/candidate/candidate.docs";

const generator = new OpenApiGeneratorV3(registry.definitions);

const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "HRMS API",
    version: "1.0.0",
    description: "Enterprise HR Management System API",
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Development server",
    },
  ],
});

export const docsRouter = Router();
docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
