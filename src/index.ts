import { say } from "./elevenlabs/generate";
import { getTranscription } from "./openai/whisper/helpers";
import { waitForTranscriptionAudio } from "./sound/vad/main";
import {
  createOrGetAssistant,
  createOrGetThread,
  addMessageToThread,
  createRun,
  submitToolOutputs,
} from "@/openai/assistants/helpers";
import fs from "fs";

if (!fs.existsSync("./tmp")) {
  fs.mkdirSync("./tmp");
}
let message = "";

await createOrGetAssistant();
await createOrGetThread();

await waitForTranscriptionAudio();
const transcription = await getTranscription();

await addMessageToThread(transcription);
let run = createRun();
for await (const event of run) {
  console.log("Processing event:", event);
  if (event.event === "thread.message.completed") {
    console.log('Event is "thread.message.completed"');
    event.data.content.map((c) => {
      if (c.type === "text" && c.text?.value) {
        console.log("Adding text to message:", c.text.value);
        message += c.text.value;
      }
    });
  }

  if (event.event === "thread.run.requires_action") {
    console.log('Event is "thread.run.requires_action"');
    const toolOutputsPromises =
      event.data.required_action?.submit_tool_outputs.tool_calls.map(
        async (call) => {
          if (call.function.name === "runGetRequest") {
            console.log('Running "runGetRequest"');
            const url = JSON.parse(call.function.arguments as string);
            try {
              new URL(url.url);
            } catch (_) {
              console.log("Invalid URL:", url.url);
              return { error: "Invalid URL", tool_call_id: call.id };
            }
            console.log("Fetching URL:", url.url);
            const response = await fetch(url.url);

            return {
              tool_call_id: call.id,
              output: JSON.stringify(await response.json(), null, 2),
            };
          }
        }
      );
    if (!toolOutputsPromises) {
      console.log("Failed to get toolOutputs");
      throw new Error("Failed to get toolOutputs");
    }
    console.log("Waiting for all tool outputs");
    const settledOutputs = await Promise.allSettled(toolOutputsPromises);
    const toolOutputs = settledOutputs
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<{
          tool_call_id: string;
          output: any;
        }> => result.status === "fulfilled"
      )
      .map((result) => result.value);
    console.log("Submitting tool outputs");
    const stream = await submitToolOutputs(toolOutputs);
    for await (const event of stream) {
      console.log("Processing stream event:", event);
      if (event.event !== "error") {
        if (event.event === "thread.message.completed") {
          console.log('Stream event is "thread.message.completed"');
          event.data.content.map((c) => {
            if (c.type === "text" && c.text?.value) {
              console.log("Adding text to message:", c.text.value);
              message += c.text.value;
            }
          });
        }
      }
    }
  }
}
console.log("Saying message:", message);
await say(message);