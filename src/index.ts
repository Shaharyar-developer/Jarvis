import { createOrGetAssistant, createOrGetThread } from "@/openai/init";
import Run from "@/openai/run";
import { env } from "@/utils/env";
import assert from "assert";
import input from "@inquirer/input";

const init_prompt = await input({ message: "Enter a prompt" });

assert(env.OPEN_AI_API_KEY, "OPEN_AI_API_KEY is required");

const assistant = await createOrGetAssistant(true);
const thread = await createOrGetThread();
const chat = new Run({ assistant, thread });

await chat.createRun(init_prompt);
