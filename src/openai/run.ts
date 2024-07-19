import OpenAI from "openai";
import { OpenAiClient } from "@/utils/instances";
import db, { workspaceDB } from "@/utils/db";
import type { Stream } from "openai/streaming.mjs";
import { getAllKeyValuePairs, runCommand } from "./functions";

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

  private async submitToolOutputs(
    toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[],
    runId: string,
    threadId: string,
  ) {
    return client.beta.threads.runs.submitToolOutputsStream(threadId, runId, {
      tool_outputs: toolOutputs,
      stream: true,
    });
  }

  private async processToolCalls(
    toolCalls: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall[],
  ): Promise<OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]> {
    const data = Promise.all(
      toolCalls.map(async (toolCall) => {
        switch (toolCall.function.name) {
          case "runShellCommand":
            const { command } = JSON.parse(toolCall.function.arguments);
            const data = await runCommand(command);
            return {
              output: data,
              tool_call_id: toolCall.id,
            };

          case "saveToDB": {
            const { key, value } = JSON.parse(toolCall.function.arguments);
            const data = await workspaceDB.set(key, value);
            return {
              output: data,
              tool_call_id: toolCall.id,
            };
          }

          case "deleteFromDB": {
            const { key } = JSON.parse(toolCall.function.arguments);
            const data = await workspaceDB.del(key);
            return {
              output: `Key Value Pairs Deleted: ${data}`,
              tool_call_id: toolCall.id,
            };
          }

          case "getAllFromDB": {
            const data = await getAllKeyValuePairs();

            return {
              output: JSON.stringify(data),
              tool_call_id: toolCall.id,
            };
          }

          default:
            return {
              output: "Unsupported Tool Call",
              tool_call_id: toolCall.id,
            };
        }
      }),
    );
    (await data).forEach((v) => {
      console.log(v.output);
    });
    return data;
  }

  private async handleRequiresAction(
    eventData: OpenAI.Beta.Assistants.AssistantStreamEvent.ThreadRunRequiresAction["data"],
  ) {
    const toolOutputs = await this.processToolCalls(
      eventData.required_action!.submit_tool_outputs.tool_calls,
    );

    const stream = await this.submitToolOutputs(
      toolOutputs,
      eventData.id,
      this.thread.id,
    );
    for await (const event of stream) {
      this.handleRunStreamEvent(event);
    }
  }

  public async handleRunStreamEvent(
    event: OpenAI.Beta.Assistants.AssistantStreamEvent,
  ) {
    switch (event.event) {
      case "error":
        console.error(event.data);
        break;

      case "thread.message.delta": {
        event.data.delta.content?.map((content) => {
          content.type === "text" &&
            content.text?.value &&
            process.stdout.write(content.text.value);
        });
        break;
      }

      case "thread.run.requires_action": {
        this.handleRequiresAction(event.data);
        break;
      }

      // case "thread.message.completed": {
      //   console.log(
      //     event.data.content.map(
      //       (content) => content.type === "text" && content.text?.value,
      //     ),
      //   );
      //   break;
      // }

      case "thread.run.completed":
        process.exit();
        break;
      default:
      // console.log(event.data);
    }
  }
}

export default Run;
