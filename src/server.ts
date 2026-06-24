import { app } from "./app";
import { envConfig, validateEnv } from "./core/config/env.config";
import { connectToDb } from "./core/config/db.connect";
import logger from "./core/config/logger";

validateEnv();

const PORT = envConfig.port || 3000;

async function start() {
  // 1. Connect to database
  await connectToDb();

  // 2. Start listening
  app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
    logger.info(`API docs at   http://localhost:${PORT}/api/v1/docs`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
