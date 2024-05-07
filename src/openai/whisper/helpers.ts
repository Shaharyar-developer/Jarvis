import fs from "fs";
import { nanoid } from "nanoid";
import { checkSpeech } from "@/lib/utils";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import { sleep } from "bun";
import { initializeOpenAI, openai } from "../init";

const captureAudioForTranscription = async () => {
  let counter = 0;
  let started = false;
  let dir = "./tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = `./${dir}/${nanoid()}.wav`;

  const file = fs.createWriteStream(filePath, { encoding: "binary" });

  const passThrough = new PassThrough();

  let processing = false;

  const command = ffmpeg("default")
    .inputFormat("alsa")
    .audioChannels(1)
    .audioFrequency(44100)
    .outputFormat("wav")
    .on("start", () => {
      processing = true;
    })
    .on("end", () => {
      processing = false;
    })
    .pipe(passThrough, { end: true });

  passThrough.pipe(file);

  while (true) {
    const speechCheck = await checkSpeech();
    console.log(speechCheck.speech);

    if (speechCheck.speech) {
      started = true;
      counter = 0;
    }
    if (started) {
      if (!speechCheck.speech) {
        counter++;
        if (counter === 5) {
          started = false;
          if (processing) {
            await new Promise((resolve) => command.on("end", resolve));
          }
          command.end();
          break;
        }
      }
    }
    await sleep(200);
  }

  return filePath;
};

const transcribeAudio = async (filePath: string) => {
  initializeOpenAI();
  const transcription = await openai?.audio.transcriptions.create({
    model: "whisper-1",
    response_format: "json",
    language: "english",
    file: fs.createReadStream(filePath),
  });
  return transcription?.text;
};

export { captureAudioForTranscription, transcribeAudio };
