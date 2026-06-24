import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./core/middlewares/error.middleware";
import { docsRouter, initSwagger } from "./core/docs/swagger";
import { loadModules, registerModules } from "./core/loader";
import logger from "./core/config/logger";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// 1. Auto-discover and load feature modules from src/modules/
const modules = loadModules();
logger.info(`Loaded ${modules.length} module(s): ${modules.map((m) => m.name).join(", ")}`);

// 2. Mount each module router under /api/v1/<name>
registerModules(app, modules);

// 3. Build Swagger spec & mount API docs
initSwagger(modules);
app.use("/api/v1/docs", docsRouter);

// Error handler (always last)
app.use(errorHandler);

export { app };
