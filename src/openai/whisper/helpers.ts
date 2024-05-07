import fs from "fs";
import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";
import { getFeatures } from "./vad";
/**
 * @todo Implement a queue for audio chunks and get algorithm from gramo
 */
export const captureAudioForTranscription = async () => {
  let dir = "./tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const passThrough = new PassThrough({ highWaterMark: 1024 });

  const writeStream = fs.createWriteStream("./tmp/output.wav");
  writeStream.on("close", async () => {
    const buffer = Buffer.from(fs.readFileSync("./tmp/output.wav"));
    const features = getFeatures(buffer, 1024);
    controller.end();
    return features;
  });
  const controller = ffmpeg("default")
    .inputFormat("alsa")
    .duration(0.5)
    .audioChannels(1)
    .audioFrequency(16000)
    .outputFormat("wav")
    .pipe(passThrough, { end: true });

  passThrough.pipe(writeStream);
};
