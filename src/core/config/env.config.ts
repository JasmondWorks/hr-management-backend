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

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },

  // Base URL of the web app. Links we email (invitations, etc.) are built from
  // this, so it must be the address the recipient can actually reach — not the
  // API's own host. FRONTEND_URL may be a comma-separated CORS list; the first
  // entry is the canonical one.
  frontendUrl: (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")[0]
    .trim()
    .replace(/\/$/, ""),
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
  requireEnv("FRONTEND_URL");

  // REDIS_* are deliberately not required: the config block is read but no code
  // connects to Redis yet. Demanding them would block startup on any host that
  // has no Redis instance, for a dependency the app does not actually use.

  // Outbound email is required in production only. Locally a missing EMAIL_HOST
  // makes the mailer log messages to the console instead of sending them, so
  // development needs no inbox.
  if (process.env.NODE_ENV === "production") {
    requireEnv("EMAIL_HOST");
    requireEnv("EMAIL_PORT");
    requireEnv("EMAIL_USER");
    requireEnv("EMAIL_PASS");
    requireEnv("EMAIL_FROM");
  }
};
