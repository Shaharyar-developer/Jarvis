import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import * as blessed from "blessed";
import * as contrib from "blessed-contrib";
import { getFeatures, type AudioFeatures } from "./vad";
import { sleep } from "bun";

export const captureAudioForTranscription = async (feature: Feature) => {
  const dir = "./tmp";
  const filePath = `${dir}/output.wav`;

  createDirectoryIfNotExists(dir);
  const writeStream = createWriteStream(filePath);
  const controller = setupFfmpeg(writeStream);

  handleStreamClose(writeStream, controller, feature);
};

const createDirectoryIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const createWriteStream = (filePath: string) => {
  return fs.createWriteStream(filePath);
};

const setupFfmpeg = (writeStream: fs.WriteStream) => {
  return ffmpeg("default")
    .inputFormat("alsa")
    .native()
    .duration(4)
    .audioChannels(1)
    .audioFrequency(16000)
    .audioFilters(["volume=1", "highpass=f=200", "lowpass=f=3000", "afftdn"])
    .outputFormat("wav")
    .pipe(writeStream, { end: true });
};

const handleStreamClose = (
  writeStream: fs.WriteStream,
  controller: internal.Writable | internal.PassThrough,
  feature: Feature
) => {
  writeStream.on("close", async () => {
    const buffer = Buffer.from(fs.readFileSync("./tmp/output.wav"));
    controller.end(async () => {
      console.log("Recording Ended");
      const features = await handleAudioProcessing(buffer);
      showFeatures(features, feature);
    });
  });
};

export const handleAudioProcessing = async (buffer: Buffer) => {
  await sleep(300);
  const features = getFeatures(buffer, 1024);

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
 *   loudness: {
 *      specific: Float32Array;
 *      total: number;
 *    };
 *    [key: string]: number | number[] | { specific: Float32Array; total:       number };
 * };
 */
type Feature =
  | "energy"
  | "zcr"
  | "mfcc"
  | "rms"
  | "perceptualSpread"
  | "perceptualSharpness"
  | "spectralCentroid"
  | "spectralCrest"
  | "spectralFlatness"
  | "spectralKurtosis"
  | "spectralRolloff"
  | "spectralSkewness"
  | "spectralSlope"
  | "spectralSpread"
  | "loudness";
export const showFeatures = (features: AudioFeatures[], feature?: Feature) => {
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

  const keys = feature ? [feature] : Object.keys(features[0]);

  for (let key of keys) {
    if (key === "loudness") {
      series.push({
        title: `${key}.total`,
        x: Array.from({ length: features.length }, (_, i) =>
          (i + 1).toString()
        ),
        y: features.map(
          (feature) =>
            (feature[key] as { specific: Float32Array; total: number }).total
        ),
        style: {
          line: "red",
        },
      });
      colorIndex++;
    } else if (Array.isArray(features[0][key])) {
      for (let i = 0; i < (features[0][key] as number[]).length; i++) {
        series.push({
          title: `${key}[${i}]`,
          x: Array.from({ length: features.length }, (_, i) =>
            (i + 1).toString()
          ),
          y: features.map((feature) => (feature[key] as number[])[i]),
          style: {
            line: "red",
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
          line: "red",
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
// ////////////
// ////////////
// ////////////

import { WaveFile } from "wavefile";
import type internal from "stream";

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

// const transcribeAudio = async (filePath: string) => {
//   initializeOpenAI();
//   console.log("Transcribing audio");
//   const transcription = await openai?.audio.transcriptions.create({
//     model: "whisper-1",
//     response_format: "json",
//     language: "english",
//     file: fs.createReadStream(filePath),
//   });
//   if (!transcription) throw new Error("Transcription failed");
//   return transcription.text;
// };
