import { z } from "zod";

// ============================================================
// ENVIRONMENT VARIABLE SCHEMA
// ============================================================

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_EXPIRY: z.string().default("7d"),

  // Redis
  REDIS_URL: z.string().url().optional(),

  UPSTASH_REDIS_REST_URL: z
    .string()
    .url()
    .optional(),

  UPSTASH_REDIS_REST_TOKEN:
    z.string().optional(),

  // Server
  PORT: z
    .string()
    .default("3000")
    .transform(Number),

  NODE_ENV: z
    .enum([
      "development",
      "production",
      "test",
    ])
    .default("development"),

  // CORS
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("900000")
    .transform(Number),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default("100")
    .transform(Number),

  // API configuration
  API_KEY_PREFIX: z
    .string()
    .default("INDIAN_LOC_"),
});


// ============================================================
// TYPE
// ============================================================

export type Environment =
  z.infer<typeof envSchema>;


// ============================================================
// CACHED ENVIRONMENT
// ============================================================

let cachedEnvironment: Environment | null = null;


// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

export const getEnvironment = (): Environment => {

  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  try {

    cachedEnvironment =
      envSchema.parse(process.env);

    return cachedEnvironment;

  } catch (error) {

    if (error instanceof z.ZodError) {

      console.error(
        "Environment validation failed:"
      );

      error.errors.forEach((err) => {

        console.error(
          `  - ${err.path.join(".")}: ${err.message}`
        );

      });
    }

    throw new Error(
      "Invalid environment configuration"
    );
  }
};


// ============================================================
// ENVIRONMENT ACCESSOR
// ============================================================

export const env = {

  get DATABASE_URL() {
    return getEnvironment().DATABASE_URL;
  },

  get JWT_SECRET() {
    return getEnvironment().JWT_SECRET;
  },

  get JWT_EXPIRY() {
    return getEnvironment().JWT_EXPIRY;
  },

  get REDIS_URL() {
    return getEnvironment().REDIS_URL;
  },

  get UPSTASH_REDIS_REST_URL() {
    return getEnvironment()
      .UPSTASH_REDIS_REST_URL;
  },

  get UPSTASH_REDIS_REST_TOKEN() {
    return getEnvironment()
      .UPSTASH_REDIS_REST_TOKEN;
  },

  get PORT() {
    return getEnvironment().PORT;
  },

  get NODE_ENV() {
    return getEnvironment().NODE_ENV;
  },

  get CORS_ORIGIN() {
    return getEnvironment().CORS_ORIGIN;
  },

  get RATE_LIMIT_WINDOW_MS() {
    return getEnvironment()
      .RATE_LIMIT_WINDOW_MS;
  },

  get RATE_LIMIT_MAX_REQUESTS() {
    return getEnvironment()
      .RATE_LIMIT_MAX_REQUESTS;
  },

  get API_KEY_PREFIX() {
    return getEnvironment()
      .API_KEY_PREFIX;
  },

  get isDevelopment() {
    return (
      getEnvironment().NODE_ENV ===
      "development"
    );
  },

  get isProduction() {
    return (
      getEnvironment().NODE_ENV ===
      "production"
    );
  },
};