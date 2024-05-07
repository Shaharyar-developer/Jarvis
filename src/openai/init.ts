import { env } from "@/lib/env";
import OpenAI from "openai";

let openai: OpenAI | null = null;
function initializeOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
}

export { openai, initializeOpenAI };
