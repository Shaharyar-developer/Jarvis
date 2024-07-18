import OpenAi from "openai";
import IoRedis from "ioredis";
import { env } from "@/utils/env";

class OpenAiSingleton {
  private static instance: OpenAi;

  private constructor() {}

  public static getInstance(): OpenAi {
    if (!OpenAiSingleton.instance) {
      OpenAiSingleton.instance = new OpenAi({ apiKey: env.OPEN_AI_API_KEY });
    }

    return OpenAiSingleton.instance;
  }
}

class RedisSingleton {
  private static instance: IoRedis;

  private constructor() {}

  public static getInstance(): IoRedis {
    if (!RedisSingleton.instance) {
      RedisSingleton.instance = new IoRedis({ host: "localhost", port: 6379 });
    }

    return RedisSingleton.instance;
  }
}

export { OpenAiSingleton as OpenAiClient, RedisSingleton as RedisClient };
