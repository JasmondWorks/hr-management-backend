import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./core/middlewares/error.middleware";
import { docsRouter } from "./core/docs/swagger";
import { authRouter } from "./modules/auth/auth.routes";
import { userRouter } from "./modules/user/user.routes";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Swagger Docs UI
app.use("/api/v1/docs", docsRouter);

// Feature API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

// Error handler (always last)
app.use(errorHandler);

export { app };
