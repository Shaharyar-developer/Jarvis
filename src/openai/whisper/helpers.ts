import { initializeOpenAI, openai } from "../init";
import fs from "fs";

export const getTranscription = async () => {
  initializeOpenAI();

  const filePath = "./tmp/output.wav";
  const transcription = await openai?.audio.transcriptions.create({
    model: "whisper-1",
    file: fs.createReadStream(filePath),
    language: "en",
    prompt: "This is a conversation between an assistant named Nyx and a user",
  });
  if (!transcription?.text) {
    throw new Error("Failed to get transcription");
  }
  return transcription.text;
};
