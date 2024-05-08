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

  const writeStream = fs.createWriteStream("./tmp/blank.wav");
  writeStream.on("close", async () => {
    const buffer = Buffer.from(fs.readFileSync("./tmp/blank.wav"));
    controller.end(async () => {
      handleAudioProcessing(buffer);
    });
  });

  const controller = ffmpeg("default")
    .inputFormat("alsa")
    .native()
    .duration(4)
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

  const colors = ["yellow", "green", "blue", "magenta", "cyan", "red", "white"];
  let series: any[] = [];
  let colorIndex = 0;

  for (let key of Object.keys(features[0])) {
    if (Array.isArray(features[0][key])) {
      for (let i = 0; i < (features[0][key] as number[]).length; i++) {
        series.push({
          title: `${key}[${i}]`,
          x: Array.from({ length: features.length }, (_, i) =>
            (i + 1).toString()
          ),
          y: features.map((feature) => (feature[key] as number[])[i]),
          style: {
            line: colors[colorIndex % colors.length],
          },
        });
        colorIndex++;
      }
    } else {
      series.push({
        title: key,
        x: Array.from({ length: features.length }, (_, i) =>
          (i + 1).toString()
        ),
        y: features.map((feature) => feature[key] as number),
        style: {
          line: colors[colorIndex % colors.length],
        },
      });
      colorIndex++;
    }
  }

  screen.append(line);
  line.setData(series);

  screen.key(["escape", "q", "C-c"], function (ch, key) {
    return process.exit(0);
  });

  screen.render();
  return screen;
};

import { WaveFile } from "wavefile";

export const createBlankAudioFile = async () => {
  let dir = "./tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // Create a blank buffer of 4 seconds (16-bit mono audio at 16kHz)
  const samples = new Float32Array(16000 * 4);

  // Create a new wav file
  let wav = new WaveFile();
  wav.fromScratch(1, 16000, "32f", samples);

  // Write the buffer to a file
  fs.writeFileSync("./tmp/blank.wav", wav.toBuffer());
};