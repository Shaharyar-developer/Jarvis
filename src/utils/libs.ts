import type { WaveFile } from "wavefile";
import { OpenAiClient } from "./instances";
import fs from "fs";
import path from "path";

const client = OpenAiClient.getInstance();

async function generate_speech(text: string) {
  const wav = await client.audio.speech.create({
    input: text,
    model: "tts-1",
    voice: "onyx",
    response_format: "wav",
  });
  const buffer = Buffer.from(await wav.arrayBuffer());
  fs.writeFileSync("./tmp/speech.wav", buffer);
  return buffer;
}

async function transcribe(buffer: Buffer) {
  const tempFilePath = path.join(__dirname, "temp_audio.wav");

  fs.writeFileSync(tempFilePath, buffer);

  const fileStream = fs.createReadStream(tempFilePath);

  const response = await client.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-1",
  });
  try {
    fs.unlinkSync(tempFilePath);
  } catch (err) {}
  return response.text;
}

async function summarize(text: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a highly skilled AI trained in language comprehension and summarization. I would like you to read the following text and summarize it into a concise abstract paragraph. Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content
    ? response.choices[0].message.content
    : "Faile to create summary";
}

async function extractKeyPoints(text: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a proficient AI with a specialty in distilling information into key points. I would like you to read the following text and extract the key points. Identify the most important points, providing a list of bullet points that summarize the main ideas of the text. Please avoid unnecessary details or tangential points.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content
    ? response.choices[0].message.content
    : "Failed to extract key points";
}

export { summarize, extractKeyPoints, generate_speech, transcribe };
