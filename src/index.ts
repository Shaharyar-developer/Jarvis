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

//! Handle the stream events more elegantly and abstract the logic to make it easer to test

const stream = await chat.createRun(args);

for await (const event of stream) {
  chat.handleRunStreamEvent(event);
}
