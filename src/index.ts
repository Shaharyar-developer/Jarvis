import { env } from "@/utils/env";
import assert from "assert";
import { RedisClient } from "@/utils/instances";
import { createOrGetAssistant, createOrGetThread } from "@/openai/init";
import fs from "fs";

fs.mkdirSync("./tmp", { recursive: true });

assert(await RedisClient.ensureConnection(), "Redis Database is not running");
assert(env.OPEN_AI_API_KEY, "OPEN_AI_API_KEY is required");
assert(fs.existsSync("./tmp"), "tmp directory does not exist");

import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use("/trpc", createExpressMiddleware({ router: appRouter }));

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
