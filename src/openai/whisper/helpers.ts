import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import * as blessed from "blessed";
import * as contrib from "blessed-contrib";
import { getFeatures, type AudioFeatures } from "./vad";
import { sleep } from "bun";

export const captureAudioForTranscription = async () => {
  let dir = "./tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const writeStream = fs.createWriteStream("./tmp/output.wav");
  writeStream.on("close", async () => {
    const buffer = Buffer.from(fs.readFileSync("./tmp/output.wav"));
    controller.end(async () => {
      handleAudioProcessing(buffer);
    });
  });

  const controller = ffmpeg("hw:0,7")
    .inputFormat("alsa")
    .native()
    .duration(0.3)
    .audioChannels(1)
    .audioFrequency(16000)
    .outputFormat("wav")
    .pipe(writeStream, { end: true });
};

export const handleAudioProcessing = async (buffer: Buffer) => {
  await sleep(300);
  const features = getFeatures(buffer, 1024);
  showFeatures(features);
  return features;
};
/**
 * AudioFeatures = {
 *   energy: number;
 *   zcr: number;
 *   mfcc: number[];
 *   rms: number;
 *   perceptualSpread: number;
 *   perceptualSharpness: number;
 *   spectralCentroid: number;
 *   spectralCrest: number;
 *   spectralFlatness: number;
 *   spectralKurtosis: number;
 *   spectralRolloff: number;
 *   spectralSkewness: number;
 *   spectralSlope: number;
 *   spectralSpread: number;
 *   [key: string]: number | number[];
 * };
 */
export const showFeatures = (features: AudioFeatures[]) => {
  const screen = blessed.screen();
  const line = contrib.line({
    width: 180,
    height: 40,
    left: 3,
    top: 3,
    xPadding: 5,
    label: "Features Over Time",
  });

  const series = Object.keys(features[0]).map((key) => {
    const yData = features.map((feature) => feature[key]);
    const flattenedYData = ([] as number[]).concat(...yData);
    return {
      title: key,
      x: Array.from({ length: features.length }, (_, i) => (i + 1).toString()),
      y: flattenedYData,
      e: {
        line: "yellow",
      },
    };
  });

  screen.append(line);
  line.setData(series);

  screen.key(["escape", "q", "C-c"], function (ch, key) {
    return process.exit(0);
  });

  screen.render();
  return screen;
};
