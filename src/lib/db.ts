import { Redis } from "ioredis";

const CONFIG = {
  host: "localhost",
  port: 6379,
};

class Singleton {
  private static dbInstance: Redis;
  static getDbInstance() {
    if (!Singleton.dbInstance) {
      Singleton.dbInstance = new Redis(CONFIG);
    }
    return Singleton.dbInstance;
  }
}

export const db = Singleton.getDbInstance;
