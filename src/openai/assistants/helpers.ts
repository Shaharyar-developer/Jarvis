import { openai, initializeOpenAI } from "../init";
import OpenAI from "openai";
import {
  getAssistantId,
  setAssistantId,
  getThreadId,
  setThreadId,
  getRunId,
  setRunId,
} from "@/lib/redis-vars";

const config: OpenAI.Beta.Assistants.AssistantCreateParams = {
  model: "gpt-3.5-turbo-1106",
  name: "Nyx",
  instructions:
    "You are Nyx, A Helpful, Playful and Intelligent Assistant made by Shaharyar. You will only respond with a maximum of 15 words. You are here to help and entertain.",
  response_format: { type: "text" },
  temperature: 0.8,
};

const createOrGetAssistant = async (
  forceNewAssistant = false
): Promise<OpenAI.Beta.Assistants.Assistant> => {
  initializeOpenAI();
  if (forceNewAssistant) {
    const assistant = await openai?.beta.assistants.create(config);
    if (assistant) {
      await setAssistantId(assistant.id);
      return assistant;
    } else throw new Error("Failed to create assistant");
  }
  const assistantId = await getAssistantId();
  if (assistantId) {
    {
      const retrievedAssistant = await openai?.beta.assistants.retrieve(
        assistantId
      );
      if (retrievedAssistant) {
        return retrievedAssistant;
      }
    }
  }
  const assistant = await openai?.beta.assistants.create(config);

  if (assistant) {
    await setAssistantId(assistant.id);
    return assistant;
  } else throw new Error("Failed to create assistant");
};

const createOrGetThread = async (
  forceNewThread = false
): Promise<OpenAI.Beta.Threads.Thread> => {
  initializeOpenAI();
  if (forceNewThread) {
    const thread = await openai?.beta.threads.create();
    if (!thread) throw new Error("Failed to create thread");
    await setThreadId(thread.id);
    return thread;
  }
  const threadId = await getThreadId();
  if (threadId) {
    {
      const retrievedThread = await openai?.beta.threads.retrieve(threadId);
      if (retrievedThread) {
        return retrievedThread;
      }
    }
  }

  const thread = await openai?.beta.threads.create();
  if (!thread) throw new Error("Failed to create thread");
  return thread;
};

const addMessageToThread = async (message: string) => {
  initializeOpenAI();
  const thread = await createOrGetThread();
  return await openai?.beta.threads.messages.create(thread.id, {
    role: "user",
    content: message,
  });
};
/**
 * @example
 * for await (const event of run) {
 *   if (event.event === "thread.message.delta") {
 *     if (event.data.delta.content) {
 *       message.push(
 *         event.data.delta.content
 *           .map((c) => c.type === "text" && c.text?.value)
 *           .join("")
 *       );
 *     }
 *   }
 * }
 */
async function* createRun() {
  initializeOpenAI();
  const threadId = await getThreadId();
  const assistantId = await getAssistantId();
  if (threadId && assistantId) {
    const runStream = await openai?.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      stream: true,
    });
    if (!runStream) throw new Error("Failed to create runStream");
    for await (const event of runStream) {
      if (event.event === "error") throw new Error("Error in runStream");
      setRunId(event.data.id);
      yield event;
    }
  }
}

const retrieveRun = async () => {
  initializeOpenAI();
  const runId = await getRunId();
  const threadId = await getThreadId();
  if (!runId || !threadId) throw new Error("Missing runId or threadId");
  return await openai?.beta.threads.runs.retrieve(threadId, runId, {
    stream: true,
  });
};

export {
  createOrGetAssistant,
  createOrGetThread,
  addMessageToThread,
  createRun,
  retrieveRun,
};
