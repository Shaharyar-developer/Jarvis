import { createOrGetAssistant, createOrGetThread } from "@/openai/init";
import { env } from "@/utils/env";
import { RedisClient } from "@/utils/instances";
import assert from "assert";
import fs from "fs";

fs.mkdirSync("./tmp", { recursive: true });

const assistant = await createOrGetAssistant(true);
const thread = await createOrGetThread();

assert(assistant, "Assistant not created");
assert(thread, "Thread not created");
assert(await RedisClient.ensureConnection(), "Redis Database is not running");
assert(env.OPEN_AI_API_KEY, "OPEN_AI_API_KEY is required");
assert(fs.existsSync("./tmp"), "tmp directory does not exist");

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import Run from "./openai/run";
import { appRouter } from "./router";
import { transcribe, generate_speech } from "./utils/libs";
import db from "./utils/db";

const app = express();
const runInstance = new Run({ assistant, thread });

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "500mb" }));

app.use("/trpc", createExpressMiddleware({ router: appRouter }));

app.post("/audio/transcribe", async (req, res) => {
  const { base64Data, contentType } = req.body;

  if (base64Data && contentType) {
    try {
      const audioBuffer = Buffer.from(base64Data, "base64");
      const transcription = await transcribe(audioBuffer);
      res.json({ transcription });
    } catch (error) {
      console.error("Error creating transcription:", error);
      res.status(500).json({ error: "Error creating transcription" });
    }
  } else {
    res.status(400).json({ error: "Invalid request body" });
  }
});

app.post("/new", async (req, res) => {
  console.log("Req received");
  const id = "prompt";
  const { prompt } = req.body;
  console.log(await db.get(id));
  if (prompt) {
    await db.set(id, prompt);
    try {
      runInstance.on("text", (text) => {
        res.write(text);
      });

      runInstance.on("end", () => {
        res.end();
      });
      runInstance.createRun(prompt);
    } catch (error) {
      console.error("Error creating transcription:", error);
      db.del(id);
      res.status(500).json({ error: "Error creating transcription" });
    }
  } else {
    res.status(400).json({ error: "Invalid request body" });
  }
});

app.post("/audio/speech", async (req, res) => {
  const { prompt } = req.body;
  console.log("Prompt: ", prompt);
  const speech = await generate_speech(prompt);
  res.json({
    base64Data: speech.toString("base64"),
  });
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
