import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { env as processEnv } from "bun";

export const env = createEnv({
  server: {
    OPENAI_API_KEY: z.string().optional(),
    ELEVENLABS_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    OPENAI_API_KEY: processEnv.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: processEnv.ELEVENLABS_API_KEY,
  },
});