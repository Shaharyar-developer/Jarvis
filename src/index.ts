import { env } from "@/utils/env";
import assert from "assert";
import { RedisClient } from "@/utils/instances";
import { createOrGetAssistant, createOrGetThread } from "@/openai/init";
import fs from "fs";

fs.mkdirSync("./tmp", { recursive: true });

const assistant = await createOrGetAssistant();
const thread = await createOrGetThread();

assert(assistant, "Assistant not created");
assert(thread, "Thread not created");
assert(await RedisClient.ensureConnection(), "Redis Database is not running");
assert(env.OPEN_AI_API_KEY, "OPEN_AI_API_KEY is required");
assert(fs.existsSync("./tmp"), "tmp directory does not exist");

import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { transcribe } from "./utils/libs";
import Run from "./openai/run";

const app = express();
const runInstance = new Run({ assistant, thread });

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "500mb" }));

app.use("/trpc", createExpressMiddleware({ router: appRouter }));

app.post("/new", async (req, res) => {
  const { base64Data, contentType } = req.body;

  if (base64Data && contentType) {
    try {
      const audioBuffer = Buffer.from(base64Data, "base64");
      const transcription = await transcribe(audioBuffer);
      runInstance.on("text", (text) => {
        res.write(text);
      });

      runInstance.on("completed", () => {
        res.end();
      });
      runInstance.createRun(transcription);
    } catch (error) {
      console.error("Error creating transcription:", error);
      res.status(500).json({ error: "Error creating transcription" });
    }
  } else {
    res.status(400).json({ error: "Invalid request body" });
  }
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
