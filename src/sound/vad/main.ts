import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export const captureAudioBuffer = async (
  bufferSize: number
): Promise<Buffer> => {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  const controller = ffmpeg("default")
    .inputFormat("alsa")
    .native()
    .audioChannels(1)
    .audioFrequency(44100)
    .outputFormat("wav")
    .output(stream);

  return new Promise((resolve, reject) => {
    let size = 0;

    controller.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    controller.on("error", reject);

    stream.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= bufferSize) {
        stream.pause();
        resolve(Buffer.concat(chunks));
        stream.destroy();
        controller.kill("SIGKILL");
      }
    });

    controller.run();
  });
};
