import { sleep } from "bun";
import { getTranscription } from "@/openai/whisper/helpers";
import { waitForTranscriptionAudio } from "@/sound/vad/main";
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

export async function* chatLoop() {
  let message = "";
  await createOrGetAssistant();
  await createOrGetThread();
  while (true) {
    await waitForTranscriptionAudio();
    const transcription = await getTranscription();

    await addMessageToThread(transcription);
    let run = createRun();
    for await (const event of run) {
      if (event.event === "thread.message.completed") {
        event.data.content.map((c) => {
          if (c.type === "text" && c.text?.value) {
            message = c.text.value;
          }
        });
      }

      if (event.event === "thread.run.requires_action") {
        const toolOutputsPromises =
          event.data.required_action?.submit_tool_outputs.tool_calls.map(
            async (call) => {
              if (call.function.name === "runGetRequest") {
                const url = JSON.parse(call.function.arguments as string);
                try {
                  new URL(url.url);
                } catch (_) {
                  return { error: "Invalid URL", tool_call_id: call.id };
                }

                const controller = new AbortController();
                const signal = controller.signal;
                const FETCH_TIMEOUT = 3000;

                const fetchPromise = fetch(url.url, { signal });
                const timeoutId = setTimeout(
                  () => controller.abort(),
                  FETCH_TIMEOUT
                );

                try {
                  const response = await fetchPromise;
                  clearTimeout(timeoutId);
                  return {
                    tool_call_id: call.id,
                    output: JSON.stringify(await response.json(), null, 2),
                  };
                } catch (error) {
                  if (error) {
                    return {
                      error: "Fetch request timed out",
                      tool_call_id: call.id,
                    };
                  } else {
                    return {
                      error: "Fetch request failed",
                      tool_call_id: call.id,
                    };
                  }
                }
              }
            }
          );
        if (!toolOutputsPromises) {
          throw new Error("Failed to get toolOutputs");
        }
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
        const stream = await submitToolOutputs(toolOutputs);
        for await (const event of stream) {
          if (event.event !== "error") {
            if (event.event === "thread.message.completed") {
              event.data.content.map((c) => {
                if (c.type === "text" && c.text?.value) {
                  message = c.text.value;
                }
              });
            }
          }
        }
      }
    }
    yield message;
    await sleep(1000);
  }
}
