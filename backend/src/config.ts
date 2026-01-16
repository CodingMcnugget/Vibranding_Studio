import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  ANTHROPIC_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().optional(),
  // Stagehand can run locally (LOCAL) or via Browserbase (BROWSERBASE)
  STAGEHAND_ENV: z.enum(["LOCAL", "BROWSERBASE"]).default("LOCAL"),
  BROWSERBASE_API_KEY: z.string().optional(),
  BROWSERBASE_PROJECT_ID: z.string().optional()
});

const env = envSchema.parse(process.env);

export const config = {
  port: env.PORT,
  anthropicApiKey: env.ANTHROPIC_API_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  stagehand: {
    env: env.STAGEHAND_ENV,
    browserbaseApiKey: env.BROWSERBASE_API_KEY,
    browserbaseProjectId: env.BROWSERBASE_PROJECT_ID
  }
};
