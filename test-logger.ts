import logger from './src/core/config/logger';

const err = new Error("Test error");
logger.error("Unexpected error: %O", err);
