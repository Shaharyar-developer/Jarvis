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
  private static index: number;
  private constructor() {}

  public static getInstance(index: number): IoRedis {
    if (!RedisSingleton.instance || RedisSingleton.index !== index) {
      RedisSingleton.index = index;
      RedisSingleton.instance = new IoRedis({
        host: "localhost",
        port: 6379,
        db: index,
      });
    }

    return RedisSingleton.instance;
  }
}

export { OpenAiSingleton as OpenAiClient, RedisSingleton as RedisClient };
