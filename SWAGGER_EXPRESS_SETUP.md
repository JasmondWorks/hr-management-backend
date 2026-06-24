# Step-by-Step Guide: Scalable Swagger Docs for Express.js (Zod-to-OpenAPI)

This guide documents a robust, type-safe, compile-time verified, and scalable API documentation system for an Express.js application using **Zod** and `@asteasolutions/zod-to-openapi`. 

By using this setup, your Zod schemas act as the **single source of truth** for both request/response validation and Swagger UI documentation. Changes in schemas automatically reflect in validation and documentation without writing duplicate JSDoc comments or manual JSON/YAML files.

---

## Table of Contents
1. [Prerequisites & Dependencies](#1-prerequisites--dependencies)
2. [Core Architecture & Setup](#2-core-architecture--setup)
   - [A. OpenAPI Registry (`registry.ts`)](#a-openapi-registry-registryts)
   - [B. Swagger Generation Engine (`swagger.ts`)](#b-swagger-generation-engine-swaggerts)
3. [Core Request Validation Middleware (`validate.middleware.ts`)](#3-core-request-validation-middleware-validatemiddlewarets)
4. [Module Architecture & Conventions](#4-module-architecture--conventions)
   - [A. DTO (Data Transfer Objects) Configuration (`*.dto.ts`)](#a-dto-data-transfer-objects-configuration-dtots)
   - [B. Route Documentation (`*.docs.ts`)](#b-route-documentation-docsts)
   - [C. Service & Controller Layout](#c-service--controller-layout)
   - [D. Express Router Configuration (`*.routes.ts`)](#d-express-router-configuration-routests)
5. [Advanced Features](#5-advanced-features)
   - [A. Path-Scoped Authentication (Padlock Icon Control)](#a-path-scoped-authentication-padlock-icon-control)
   - [B. Handling Multipart Form-Data & File Uploads (Multer Integration)](#b-handling-multipart-form-data--file-uploads-multer-integration)
6. [Bootstrapping the System (`app.ts` & `server.ts`)](#6-bootstrapping-the-system-appts--serverts)

---

## 1. Prerequisites & Dependencies

Run the following command to install the required packages:

```bash
# Production dependencies
npm i zod @asteasolutions/zod-to-openapi swagger-ui-express multer

# Development dependencies (TypeScript typings)
npm i --save-dev @types/express @types/swagger-ui-express @types/multer
```

---

## 2. Core Architecture & Setup

### A. OpenAPI Registry (`registry.ts`)
Create a central registry file `src/core/docs/registry.ts`. This file extends Zod with OpenAPI support and holds all registry definitions (schemas and security components).

```typescript
// src/core/docs/registry.ts
import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// 1. Extend Zod once to enable `.openapi()` calls on schemas
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// 2. Register global components (like Bearer Auth for JWTs)
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});
```

### B. Swagger Generation Engine (`swagger.ts`)
Create `src/core/docs/swagger.ts`. This file dynamically compiles registered paths and components into an OpenAPI v3 spec and sets up the Swagger UI router.

```typescript
// src/core/docs/swagger.ts
import swaggerUi from "swagger-ui-express";
import { Router } from "express";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

// IMPORTANT: Statically import all route documentation files to trigger their registry initialization.
// Ensure you add any new module docs files here.
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
```

---

## 3. Core Request Validation Middleware (`validate.middleware.ts`)

Create `src/core/middlewares/validate.middleware.ts`. This middleware parses query parameters, path params, and body data using Zod, handles validation errors, formats error paths to be user-friendly, and invokes Express error handlers.

```typescript
// src/core/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestException } from "../errors/app.error"; // Use your project's custom BadRequest error class

export const validate = (schema: z.ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Strip out root wrappers (e.g. 'body.') to give user-friendly errors
        const errorMessages = error.issues
          .map((issue) => {
            const fieldPath = issue.path.slice(1).join(".");
            return `${fieldPath}: ${issue.message}`;
          })
          .join(", ");
        next(new BadRequestException(`Validation failed: ${errorMessages}`));
      } else {
        next(error);
      }
    }
  };
};
```

---

## 4. Module Architecture & Conventions

Each functional domain is organized into its own module folder under `src/modules/[moduleName]`. Each module should implement the following structure.

### A. DTO (Data Transfer Objects) Configuration (`*.dto.ts`)
Define payload inputs, models, parameters, and query schemas. Register reusable schemas into OpenAPI components.

```typescript
// src/modules/auth/auth.dto.ts
import { z } from "zod";
import { registry } from "../../core/docs/registry";

// 1. Reusable Model Schema (Registered globally under "Components" in Swagger)
export const RegisterBodySchema = registry.register(
  "RegisterInput",
  z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address"),
    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters long"),
    firstName: z
      .string({ message: "First name is required" })
      .min(2, "First name must be at least 2 characters long"),
    lastName: z
      .string({ message: "Last name is required" })
      .min(2, "Last name must be at least 2 characters long"),
    phone: z
      .string({ message: "Phone number is required" })
      .min(7, "Phone number must be at least 7 characters long"),
  })
);

// 2. Express Route Validation Schemas (Wrappers for the middleware)
export const registerSchema = z.object({
  body: RegisterBodySchema,
});
```

### B. Route Documentation (`*.docs.ts`)
Document endpoints, inputs, outputs, tags, and request bodies using the `registry.registerPath()` utility.

```typescript
// src/modules/auth/auth.docs.ts
import { registry } from "../../core/docs/registry";
import { RegisterBodySchema } from "./auth.dto";
import { z } from "zod";

registry.registerPath({
  method: "post",
  path: "/auth/register",
  summary: "Register a new user",
  tags: ["Authentication"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RegisterBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({}),
          }),
        },
      },
    },
    400: { description: "Validation error" },
    409: { description: "Email already in use" },
  },
});
```

### C. Service & Controller Layout
Implement logic in classes, injecting services into controllers via constructor injection.

```typescript
// src/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.register(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  };
}
```

### D. Express Router Configuration (`*.routes.ts`)
Instantiate components, declare routes, mount validation, and wrap controller actions with an async-handling utility (like `catchAsync`).

```typescript
// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { validate } from "../../core/middlewares/validate.middleware";
import { registerSchema } from "./auth.dto";
import { catchAsync } from "../../core/utils/catch-async";

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post(
  "/register",
  validate(registerSchema),
  catchAsync(authController.register),
);

export { router as authRouter };
```

---

## 5. Advanced Features

### A. Path-Scoped Authentication (Padlock Icon Control)
To control which routes require authentication (having the padlock icon in Swagger UI) versus those that are public, **avoid** registering `security` schemes globally. Instead, declare security requirements on a path-by-path basis inside each module's `*.docs.ts` file:

* **Authenticated Endpoint:** Add the `security` property matching the component name in `registry.ts`:
  ```typescript
  // In user.docs.ts
  registry.registerPath({
    method: "get",
    path: "/users/profile",
    summary: "Get current user profile",
    tags: ["User"],
    security: [{ bearerAuth: [] }], // <--- Adds the padlock icon in Swagger UI
    responses: { ... }
  });
  ```
* **Public Endpoint:** Simply omit the `security` parameter:
  ```typescript
  // In user.docs.ts
  registry.registerPath({
    method: "post",
    path: "/users/login",
    summary: "User login",
    tags: ["User"],
    // Omit security to leave it open (no padlock icon)
    responses: { ... }
  });
  ```

---

### B. Handling Multipart Form-Data & File Uploads (Multer Integration)

File uploads (e.g. uploading a resume in PDF format) require a hybrid approach because:
1. Multer is required to process the raw binary stream and populate `req.body` with text fields and `req.file` with the file metadata.
2. Standard Zod validation on `req.body` will fail if it expects the file to be present since the file resides in `req.file`.

Here is the pattern to solve this gracefully:

#### 1. Define Dual DTO Schemas
Create one schema for Swagger (including the binary file field) and one schema for runtime Express validation (excluding the file field):

> [!IMPORTANT]
> To ensure Swagger UI renders a file input button correctly, the schema for a multipart form-data request body should **NOT** be registered as a global component using `registry.register()`. Defining it as a raw Zod schema ensures it is compiled inline, prompting Swagger UI to display the file picker instead of a component reference.

```typescript
// src/modules/candidate/candidate.dto.ts
import { z } from "zod";

// Used for Swagger Spec compilation (kept inline so that Swagger UI renders a file picker)
export const RegisterCandidateBodySchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  skills: z.string().optional(),
  resume: z.string().openapi({
    type: "string",
    format: "binary",
    description: "Candidate's resume (PDF file)",
  }),
});

// Used for runtime Express request body validation (excludes resume file since it is parsed as req.file)
export const registerCandidateSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    skills: z.string().optional(),
  }),
});
```

#### 2. Register Path under `"multipart/form-data"`
Configure the request body content type to use `multipart/form-data` instead of `application/json`:

```typescript
// src/modules/candidate/candidate.docs.ts
import { registry } from "../../core/docs/registry";
import { RegisterCandidateBodySchema } from "./candidate.dto";

registry.registerPath({
  method: "post",
  path: "/candidates/register",
  summary: "Register a candidate with resume upload",
  tags: ["Candidates"],
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": { // <--- Informs Swagger to use form-data with file picker
          schema: RegisterCandidateBodySchema,
        },
      },
    },
  },
  responses: { ... }
});
```

#### 3. Route Configuration Sequence
**Crucial Rule:** Always mount the Multer upload middleware **BEFORE** the `validate()` middleware. 

If validation is mounted first, `req.body` will be unparsed and validation will fail. Multer extracts the fields and populates `req.body` before Zod is run:

```typescript
// src/modules/candidate/candidate.routes.ts
import { Router } from "express";
import multer from "multer";
import { registerCandidateSchema } from "./candidate.dto";
import { validate } from "../../core/middlewares/validate.middleware";
import { catchAsync } from "../../core/utils/catch-async";
import { CandidateController } from "./candidate.controller";

const router = Router();
const upload = multer({ dest: "uploads/" }); // Configure storage directory

router.post(
  "/register",
  upload.single("resume"),            // 1. Process files & populate req.body first
  validate(registerCandidateSchema),  // 2. Validate text fields in req.body
  catchAsync(candidateController.register),
);
```

#### 4. Handle File Verification in the Controller
Since the file has been parsed into `req.file`, verify its presence in the controller and save its location or filename to the database:

```typescript
// src/modules/candidate/candidate.controller.ts
import { Request, Response } from "express";
import { BadRequestException } from "../../core/errors/app.error";

export class CandidateController {
  register = async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestException("Resume file (resume) is required");
    }

    const { email, firstName, lastName, skills } = req.body;
    
    // Register candidate and save req.file.filename as resumeUrl
    const candidate = await this.candidateService.register({
      email,
      firstName,
      lastName,
      skills,
      resumeUrl: req.file.filename,
    });

    res.status(201).json({ success: true, data: candidate });
  };
}
```

---

## 6. Bootstrapping the System (`app.ts`)

Mount routers and documentation routes in your main Express application file:

```typescript
// src/app.ts
import express from "express";
import { docsRouter } from "./core/docs/swagger";
import { authRouter } from "./modules/auth/auth.routes";
import { candidateRouter } from "./modules/candidate/candidate.routes";

const app = express();

app.use(express.json());

// Expose API documentation under /api/v1/docs
app.use("/api/v1/docs", docsRouter);

// Register routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/candidates", candidateRouter);
```
