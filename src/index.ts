import { chatLoop } from "@/openai/assistants/main";
import { say } from "@/elevenlabs/generate";

for await (const message of chatLoop()) {
  await say(message);
}
