import OpenAI from "openai";
import { env } from "@/lib/env";

// const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

class Singleton {
  private static openaiInstance: OpenAI;
  static getOpenAiInstance() {
    if (!Singleton.openaiInstance) {
      Singleton.openaiInstance = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
    return Singleton.openaiInstance;
  }
}

export const getOpenAiInstance = Singleton.getOpenAiInstance;
