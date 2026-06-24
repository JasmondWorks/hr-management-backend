import prisma from "./prisma";
import logger from "./logger";

const connectToDb = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connection established");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error connecting to database: ${message}`);
    process.exit(1);
  }
};

export { connectToDb };
