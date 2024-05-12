import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import * as bc from "blessed-contrib";
import * as b from "blessed";
import Meyda from "meyda";
import fs from "fs";

type Features = {
  rms: number;
  zcr: number;
  energy: number;
  melBands: number[];
};
type Bounds = {
  top: number;
  bottom: number;
};
type MelBandsBounds = {
  max: number;
  min: number;
};

const SAMPLE_RATE = 44100;
const BUFFER_SIZE = 1024;

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
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });

    controller.on("error", reject);

    stream.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= bufferSize) {
        stream.pause();
        const buffer = Buffer.concat(chunks);
        stream.destroy();
        controller.kill("SIGKILL");
        resolve(buffer);
      }
    });

    controller.run();
  });
};

const captureAudioForTranscription = () => {
  let resolvePromise: (buffer: Buffer) => void;
  const stream = new PassThrough();
  const controller = ffmpeg("default")
    .inputFormat("alsa")
    .native()
    .audioChannels(1)
    .audioFrequency(44100)
    .outputFormat("wav")
    .output(stream);

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    controller.on("end", () => {
      const buffer = fs.readFileSync("./tmp/output.wav");
      resolve(buffer);
    });

    controller.on("error", reject);

    stream.pipe(fs.createWriteStream("./tmp/output.wav"));
    controller.run();
  });

  const stop = () => {
    stream.pause();
    stream.end();
    controller.kill("SIGKILL");
    const buffer = fs.readFileSync("./tmp/output.wav");
    resolvePromise(buffer);
  };

  return { promise, stop };
};
let feature: number[] = [];
let bounds = {
  rms: { top: -Infinity, bottom: Infinity },
  zcr: { top: -Infinity, bottom: Infinity },
  energy: { top: -Infinity, bottom: Infinity },
  melBands: { min: Infinity, max: -Infinity },
};

const updateBounds = (bounds: Bounds, value: number) => {
  bounds.top = Math.max(bounds.top, value);
  bounds.bottom = Math.min(bounds.bottom, value);
};
const updateMelBandsBounds = (bounds: MelBandsBounds, bands: number[]) => {
  bounds.max = Math.max(bounds.max, ...bands);
  bounds.min = Math.min(bounds.min, ...bands);
};
const calculateAverage = (featuresList: Features[]) => {
  let rms = 0;
  let zcr = 0;
  let energy = 0;
  let melBands = Array(26).fill(0);
  let rmsBounds = { min: Infinity, max: -Infinity };
  let energyBounds = { min: Infinity, max: -Infinity };
  let zcrBounds = { min: Infinity, max: -Infinity };

  let melBandsBounds = Array(26).fill({ min: Infinity, max: -Infinity });
  let melBandsMin = Infinity;
  let melBandsMax = -Infinity;

  featuresList.forEach((features) => {
    rms += features.rms;
    energy += features.energy;
    zcr += features.zcr;
    const minBand = Math.min(...features.melBands);
    const maxBand = Math.max(...features.melBands);
    if (features.rms > rmsBounds.max) rmsBounds.max = features.rms;
    if (features.rms < rmsBounds.min) rmsBounds.min = features.rms;
    if (features.zcr > zcrBounds.max) zcrBounds.max = features.zcr;
    if (features.zcr < zcrBounds.min) zcrBounds.min = features.zcr;
    if (features.energy > energyBounds.max) energyBounds.max = features.energy;
    if (features.energy < energyBounds.min) energyBounds.min = features.energy;

    features.melBands.forEach((band, i) => {
      melBands[i] += band;
      if (band > melBandsBounds[i].max) melBandsBounds[i].max = band;
      if (band < melBandsBounds[i].min) melBandsBounds[i].min = band;
    });
    if (minBand < melBandsMin) melBandsMin = minBand;
    if (maxBand > melBandsMax) melBandsMax = maxBand;
  });

  rms /= featuresList.length;
  zcr /= featuresList.length;
  energy /= featuresList.length;
  melBands = melBands.map((band) => band / featuresList.length);

  return {
    averages: { rms, energy, melBands, zcr },
    bounds: {
      rms: rmsBounds,
      zcr: zcrBounds,
      energy: energyBounds,
      melBands: { min: melBandsMin, max: melBandsMax },
    },
  };
};
const calculatePercentageChange = (
  lastFeatures: Features,
  currentFeatures: Features
) => {
  const calculateChange = (last: number, current: number) => {
    const change = current - last;
    return Math.floor((change / last) * 100);
  };

  const rmsChange = calculateChange(lastFeatures.rms, currentFeatures.rms);
  const zcrChange = calculateChange(lastFeatures.zcr, currentFeatures.zcr);

  const energyChange = calculateChange(
    lastFeatures.energy,
    currentFeatures.energy
  );

  const melBandsMinChange = calculateChange(
    Math.min(...lastFeatures.melBands),
    Math.min(...currentFeatures.melBands)
  );

  const melBandsMaxChange = calculateChange(
    Math.max(...lastFeatures.melBands),
    Math.max(...currentFeatures.melBands)
  );

  return {
    rmsChange,
    zcrChange,
    energyChange,
    melBandsMinChange,
    melBandsMaxChange,
  };
};
export const plotGraph = (feature: number[]) => {
  let data: bc.Widgets.LineData[] = [];
  const screen = b.screen();
  const line = bc.line({
    style: {
      line: "blue",
      text: "green",
      baseline: "magenta",
    },
    xLabelPadding: 3,
    xPadding: 0,
    label: "Feature Line Graph",
    border: { type: "line", fg: 5 },
    mouse: true,
    bg: "black",
  });
  if (Array.isArray(feature))
    data = feature.map(() => ({
      x: feature.map((_, i) => i.toString()),
      y: feature.map((f) => f),
    }));

  screen.append(line);
  line.setData(data);
  screen.render();
};
export const waitForTranscriptionAudio = async () => {
  const featuresList: Features[] = [];
  let hasStartedSpeaking = false;
  let timesSinceStoppedSpeaking = 0;
  const audioCaptureControllerStopMethod = captureAudioForTranscription();
  while (true) {
    const data = await captureAudioBuffer(BUFFER_SIZE);
    let audioData = new Int16Array(data.buffer);
    console.log(timesSinceStoppedSpeaking);

    Meyda.sampleRate = SAMPLE_RATE;
    Meyda.bufferSize = BUFFER_SIZE;
    if (audioData.length < BUFFER_SIZE) {
      audioData = Int16Array.from(
        { length: BUFFER_SIZE },
        (_, i) => audioData[i] || 0
      );
    }
    const ad = audioData.subarray(0, BUFFER_SIZE);

    const features = Meyda.extract(
      ["zcr", "energy", "rms", "melBands"],
      ad.subarray(0, BUFFER_SIZE)
    ) as Features;

    updateBounds(bounds.rms, features.rms);
    updateBounds(bounds.zcr, features.zcr);
    updateBounds(bounds.energy, features.energy);
    updateMelBandsBounds(bounds.melBands, features.melBands);

    const averages = calculateAverage(featuresList);
    featuresList.push(features);
    if (feature.length > 50) feature.shift();

    const percentageChange = calculatePercentageChange(
      {
        energy: averages.averages.energy,
        rms: averages.averages.rms,
        zcr: averages.averages.zcr,
        melBands: averages.averages.melBands,
      },
      features
    );
    if (
      features.energy > 5_000_000 &&
      features.zcr < 50 &&
      percentageChange.energyChange > 100 &&
      percentageChange.zcrChange <= 50
    ) {
      hasStartedSpeaking = true;
      timesSinceStoppedSpeaking = 0;
    } else {
      if (hasStartedSpeaking) {
        timesSinceStoppedSpeaking++;
      }
      if (timesSinceStoppedSpeaking > 20) {
        console.log(timesSinceStoppedSpeaking);
        break;
      }
    }
  }
  audioCaptureControllerStopMethod.stop();
  await audioCaptureControllerStopMethod.promise;
  return true;
};

