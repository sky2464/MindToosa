import { z } from "zod";

/**
 * Environment Variable Schema
 * 
 * This schema validates all required environment variables at application startup.
 * If any required variable is missing or invalid, the application will fail fast
 * with a clear error message instead of failing at runtime.
 * 
 * Note: Some variables are optional to allow builds without all env vars.
 * Runtime validation will still occur when these features are used.
 */
/**
 * Helper to handle empty strings in environment variables
 * Converts "" to undefined to satisfy .optional() schemas
 */
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const envSchema = z.object({
  // AI Provider (optional for build, required at runtime for AI features)
  AI_PROVIDER_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1, "AI_PROVIDER_API_KEY is required for AI features").optional()),

  // Supabase
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL (e.g., https://xyz.supabase.co)"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // NextAuth (optional for build, required at runtime)
  NEXTAUTH_SECRET: z.preprocess(emptyToUndefined, z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters").optional()),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required for authentication"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required for authentication"),

  // Optional: Auth URL (defaults to localhost in development)
  AUTH_URL: z.preprocess(emptyToUndefined, z.string().url("AUTH_URL must be a valid URL").optional()),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

/**
 * Validated and type-safe environment variables
 */
function getEnv() {
  const rawEnv = {
    AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  if (process.env.SKIP_ENV_VALIDATION === "true") {
    console.log("\x1b[33m%s\x1b[0m", "⚠️ Skipping environment validation (SKIP_ENV_VALIDATION=true)");
    return {
      ...rawEnv,
      SUPABASE_URL: rawEnv.SUPABASE_URL || "https://example.com",
      SUPABASE_SERVICE_ROLE_KEY: rawEnv.SUPABASE_SERVICE_ROLE_KEY || "mock-key",
      AUTH_SECRET: rawEnv.AUTH_SECRET || "mock-secret-at-least-32-chars-long-1234567890", // Must be >= 32 chars
      GOOGLE_CLIENT_ID: rawEnv.GOOGLE_CLIENT_ID || "mock-client-id",
      GOOGLE_CLIENT_SECRET: rawEnv.GOOGLE_CLIENT_SECRET || "mock-client-secret",
      NODE_ENV: rawEnv.NODE_ENV || "production",
    } as Env;
  }

  try {
    return envSchema.parse(rawEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("\x1b[31m%s\x1b[0m", "❌ INVALID ENVIRONMENT VARIABLES:");
      error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        const value = (rawEnv as Record<string, unknown>)[path];
        console.error("\x1b[31m%s\x1b[0m", `  - ${path}: ${issue.message} (Value: "${value}")`);
      });
      console.error("\x1b[33m%s\x1b[0m", "\nTip: Check your .env.local file or Docker environment variables.");
      console.error("\x1b[33m%s\x1b[0m", "URLs must include protocol (e.g., https://)");

      if (process.env.NODE_ENV === "production") {
        console.error("\x1b[31m%s\x1b[0m", "In production, missing environment variables are fatal.");
      }
    }
    throw error;
  }
}

export const env = getEnv();

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;
