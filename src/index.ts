import { say } from "./elevenlabs/generate";
import { getTranscription } from "./openai/whisper/helpers";
import { waitForTranscriptionAudio } from "./sound/vad/main";
import {
  createOrGetAssistant,
  createOrGetThread,
  addMessageToThread,
  createRun,
} from "@/openai/assistants/helpers";
import fs from "fs";

if (!fs.existsSync("./tmp")) {
  fs.mkdirSync("./tmp");
}
await waitForTranscriptionAudio();

const transcription = await getTranscription();

console.log(transcription);

await createOrGetAssistant();
await createOrGetThread();
await addMessageToThread(transcription);
const run = createRun();
let message: string[] = [];
for await (const event of run) {
  if (event.event === "thread.message.delta") {
    if (event.data.delta.content) {
      message.push(
        event.data.delta.content
          .map((c) => c.type === "text" && c.text?.value)
          .join("")
      );
      console.log(event.data.delta.content);
    }
  }
}
console.log(message.join(""));
say(message.join(""));
