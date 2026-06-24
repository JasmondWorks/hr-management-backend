export const envConfig = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,

  jwt: {
    accessSecret: process.env.ACCESS_SECRET,
    refreshSecret: process.env.REFRESH_SECRET,
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  },
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    db: process.env.POSTGRES_DB,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const validateEnv = () => {
  requireEnv("PORT");
  requireEnv("NODE_ENV");
  requireEnv("ACCESS_SECRET");
  requireEnv("REFRESH_SECRET");
  requireEnv("ACCESS_TOKEN_EXPIRES_IN");
  requireEnv("REFRESH_TOKEN_EXPIRES_IN");
  requireEnv("POSTGRES_HOST");
  requireEnv("POSTGRES_PORT");
  requireEnv("POSTGRES_USER");
  requireEnv("POSTGRES_PASSWORD");
  requireEnv("POSTGRES_DB");
  requireEnv("REDIS_HOST");
  requireEnv("REDIS_PORT");
};
