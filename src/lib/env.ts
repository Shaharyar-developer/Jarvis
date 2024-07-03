import { createEnv } from "@t3-oss/env-core";
import { z } from "zod"; // Ensure Zod is imported

export const env = createEnv({
  server: {
    OPENAI_API_KEY: z.string().min(1),
  },
  client: {},
  clientPrefix: "NEXT_PUBLIC_",
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
});
