import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL_MODE: z.enum(["disable", "require"]).default("require"),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  JWT_SECRET: z.string().min(8),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  COMETCHAT_APP_ID: z.string().min(1),
  COMETCHAT_REGION: z.string().min(1),
  COMETCHAT_REST_API_KEY: z.string().min(1),
  COMETCHAT_AUTH_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
