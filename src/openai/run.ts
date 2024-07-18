import OpenAI from "openai";
import { OpenAiClient } from "@/utils/instances";
import type { Stream } from "openai/streaming.mjs";

const client = OpenAiClient.getInstance();

class Run {
  private assistant: OpenAI.Beta.Assistant;
  private thread: OpenAI.Beta.Thread;

  constructor(args: {
    assistant: OpenAI.Beta.Assistant;
    thread: OpenAI.Beta.Thread;
  }) {
    this.assistant = args.assistant;
    this.thread = args.thread;
  }

  public async createRun(
    prompt: string,
  ): Promise<Stream<OpenAI.Beta.Assistants.AssistantStreamEvent>> {
    await client.beta.threads.messages.create(this.thread.id, {
      role: "user",
      content: prompt,
    });
    return await client.beta.threads.runs.create(this.thread.id, {
      assistant_id: this.assistant.id,
      stream: true,
    });
  }
}

export default Run;
