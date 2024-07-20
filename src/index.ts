import { createOrGetAssistant, createOrGetThread } from "@/openai/init";
import Run from "@/openai/run";
import { env } from "@/utils/env";
import assert from "assert";
import { RedisClient } from "@/utils/instances";
import { LocalModels } from "@/utils/local-models";

assert(await RedisClient.ensureConnection(), "Redis Database is not running");
assert(env.OPEN_AI_API_KEY, "OPEN_AI_API_KEY is required");

// const models = new LocalModels();
// await models.init();

const assistant = await createOrGetAssistant(true);
const thread = await createOrGetThread();
const chat = new Run({ assistant, thread });

await chat.createRun(
  "Test the functions that have been made available to you.",
);
