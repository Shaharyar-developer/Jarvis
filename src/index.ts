/**
 * This is the main entry point of the application.
 * This is how it goes:
 *  Any outstanding runs are first deleted
 *  Chat loop is an async generator
 *  When ran:
 *  1. It creates or gets an assistant, if create then saves its id to redis db
 *  2. It creates or gets a thread if create then saves its id to redis db
 *  3. It starts a while loop
 *  4. It runs a function that uses a custom VAD algorithm from shaharyar-dev
 *  5. When speech is stopped it saves the entire audio file to an output.wav
 *  6. It gets a transcription from openai whisper and then adds that     transcription to the thread
 *  7. It creates a run stream and starts a for loop on the events
 *  8. It checks the event.event element of the object to determine what to do, e.g; extracting text or submitting tool outputs
 *  9. It yields the message to the chat loop
 *  10. The message is then passed to the say function which is a wrapper function around the elevenlabs library that takes text, generates audio and then plays it with ffmpeg and alsa
 */

import { say } from "@/elevenlabs/generate";
import { chatLoop } from "@/openai/assistants/main";
import { deleteRun } from "./openai/assistants/helpers";
try {
  await deleteRun();
} catch (error) {}
  

for await (const message of chatLoop()) {
  await say(message);
}
