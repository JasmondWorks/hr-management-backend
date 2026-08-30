import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./core/middlewares/error.middleware";
import { docsRouter } from "./core/docs/swagger";
import { router as v1Routes } from "./routes/v1.routes";

const app = express();

// Allowed browser origins. `credentials: true` forbids "*", so we use an
// explicit allowlist. Defaults cover the Next.js dev server on 3000/3001;
// FRONTEND_URL (comma-separated) adds/overrides for other environments. The
// API's own origin is included so the Swagger "Try it out" UI (served from this
// server) works.
const PORT = process.env.PORT || 5000;
const backendUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ?? "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  backendUrl,
];

// Middlewares
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header) and allowlisted origins.
      // For anything else, deny WITHOUT throwing (no 500) — the browser simply
      // won't receive CORS headers and blocks the response client-side.
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Liveness probe for the host's health checks. Deliberately does not touch the
// database: this answers "is the process serving?", and failing it would restart
// a healthy app during a transient database blip.
app.get("/", (_req, res) => {
  const location = `${_req.protocol}://${_req.headers.host}`;
  res.json({
    message: "Welcome to the Human Resource Management System Backend",
    docs: `${location}/api/v1/docs`,
    health: `${location}/health`,
    routes: `${location}/api/v1`,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Swagger Docs UI
app.use("/api/v1/docs", docsRouter);

// Feature API Routes
app.use("/api/v1", v1Routes);

// Error handler (always last)
app.use(errorHandler);

export { app };
