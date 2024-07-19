import { createOrGetAssistant, createOrGetThread } from "./openai/init";
import Run from "./openai/run";
import { env } from "./utils/env";
import assert from "assert";

const args = Bun.argv.slice(2).join(" ");

assert(env.OPEN_AI_API_KEY, "OPEN_AI_API_KEY is required");
assert(args, "Please provide a prompt, e.g. bun run dev Hello!");

const assistant = await createOrGetAssistant(true);
const thread = await createOrGetThread();
const chat = new Run({ assistant, thread });

await chat.createRun(args);
