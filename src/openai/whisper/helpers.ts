import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { getFeatures, type AudioFeatures } from "./vad";
import { sleep } from "bun";

export const captureAudioForFeatures = async (): Promise<string> => {
  let dir = "./tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = "./tmp/output.wav";
  const writeStream = fs.createWriteStream(filePath);
  writeStream.on("close", async () => {
    controller.end();
  });

  const controller = ffmpeg("default")
    .inputFormat("alsa")
    .native()
    .duration(0.3)
    .audioChannels(1)
    .audioFrequency(16000)
    .outputFormat("wav")
    .pipe(writeStream, { end: true });

  return filePath;
};

export const extractFeaturesFromFile = async (
  filePath: string
): Promise<AudioFeatures[]> => {
  await sleep(300);
  const buffer = Buffer.from(fs.readFileSync(filePath));
  const features = getFeatures(buffer, 1024);
  return features;
};