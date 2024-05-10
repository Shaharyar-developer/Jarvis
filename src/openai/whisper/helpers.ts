import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { getFeatures } from "./vad";
import type {
  AudioFeatures,
  AudioFeatureItem,
  Averages,
  BoundsForAverages,
} from "@/types/audio-features";
import { Queue } from "@datastructures-js/queue";
import { nanoid } from "nanoid";
import { sleep } from "bun";

export const captureAudioForFeatures = async (): Promise<string> => {
  let dir = "./tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = `./tmp/${nanoid()}.wav`;
  const writeStream = fs.createWriteStream(filePath);
  writeStream.on("close", async () => {
    controller.end();
  });

  const controller = ffmpeg("default")
    .inputFormat("alsa")
    .native()
    .duration(0.1)
    .audioChannels(1)
    .audioFrequency(16000)
    .outputFormat("wav")
    .pipe(writeStream, { end: true });

  return filePath;
};

export const extractFeaturesFromFile = async (
  filePath: string
): Promise<AudioFeatures[]> => {
  await sleep(200);
  const buffer = Buffer.from(fs.readFileSync(filePath));
  const features = getFeatures(buffer, 1024);
  return features;
};

let index = 0;
let totalFeatures: Averages = {
  energy: 0,
  zcr: 0,
  mfcc: new Array(10).fill(0),
  rms: 0,
  loudness: {
    total: 0,
  },
};
let boundsForAverages: BoundsForAverages = {
  energy: { upper: -Infinity, lower: Infinity },
  zcr: { upper: -Infinity, lower: Infinity },
  mfcc: new Array(10).fill({ upper: -Infinity, lower: Infinity }),
  rms: { upper: -Infinity, lower: Infinity },
  loudness: {
    total: { upper: -Infinity, lower: Infinity },
  },
};
const initializeBoundsForAverages = (features: AudioFeatures) => {
  features.mfcc.forEach((_, i) => {
    if (
      typeof boundsForAverages.mfcc[i] !== "object" ||
      isNaN(boundsForAverages.mfcc[i].upper) ||
      isNaN(boundsForAverages.mfcc[i].lower)
    ) {
      boundsForAverages.mfcc[i] = {
        upper: -Infinity,
        lower: Infinity,
      };
    }
  });
};

const updateTotalFeatures = (features: AudioFeatures) => {
  initializeBoundsForAverages(features);

  totalFeatures.energy += features.energy;
  totalFeatures.zcr += features.zcr;
  totalFeatures.rms += features.rms;
  totalFeatures.loudness.total += features.loudness.total;
  features.mfcc.forEach((v, i) => (totalFeatures.mfcc[i] += v));
  boundsForAverages.energy.upper = Math.max(
    boundsForAverages.energy.upper,
    features.energy
  );
  if (features.energy !== 0) {
    boundsForAverages.energy.lower = Math.min(
      boundsForAverages.energy.lower,
      features.energy
    );
  }
  boundsForAverages.zcr.upper = Math.max(
    boundsForAverages.zcr.upper,
    features.zcr
  );
  if (features.zcr !== 0) {
    boundsForAverages.zcr.lower = Math.min(
      boundsForAverages.zcr.lower,
      features.zcr
    );
  }
  boundsForAverages.rms.upper = Math.max(
    boundsForAverages.rms.upper,
    features.rms
  );
  if (features.rms !== 0) {
    boundsForAverages.rms.lower = Math.min(
      boundsForAverages.rms.lower,
      features.rms
    );
  }
  features.mfcc.forEach((v, i) => {
    boundsForAverages.mfcc[i].upper = Math.max(
      boundsForAverages.mfcc[i].upper,
      v
    );
    if (v !== 0) {
      boundsForAverages.mfcc[i].lower = Math.min(
        boundsForAverages.mfcc[i].lower,
        v
      );
    }
  });
  boundsForAverages.loudness.total.upper = Math.max(
    boundsForAverages.loudness.total.upper,
    features.loudness.total
  );
  if (features.loudness.total !== 0) {
    boundsForAverages.loudness.total.lower = Math.min(
      boundsForAverages.loudness.total.lower,
      features.loudness.total
    );
  }
};

const calculateAverages = (count: number): Averages => ({
  energy:
    ((totalFeatures.energy / count - boundsForAverages.energy.lower) /
      (boundsForAverages.energy.upper - boundsForAverages.energy.lower)) *
    100,
  zcr:
    ((totalFeatures.zcr / count - boundsForAverages.zcr.lower) /
      (boundsForAverages.zcr.upper - boundsForAverages.zcr.lower)) *
    100,
  rms:
    ((totalFeatures.rms / count - boundsForAverages.rms.lower) /
      (boundsForAverages.rms.upper - boundsForAverages.rms.lower)) *
    100,
  loudness: {
    total:
      ((totalFeatures.loudness.total / count -
        boundsForAverages.loudness.total.lower) /
        (boundsForAverages.loudness.total.upper -
          boundsForAverages.loudness.total.lower)) *
      100,
  },
  mfcc: totalFeatures.mfcc.map(
    (v, i) =>
      ((v / count - boundsForAverages.mfcc[i].lower) /
        (boundsForAverages.mfcc[i].upper - boundsForAverages.mfcc[i].lower)) *
      100
  ),
});
let featuresQueue = new Queue<AudioFeatureItem>();

export async function* getAverageFeaturesFromAudio(): AsyncGenerator<{
  averages: Averages;
  boundsForAverages: BoundsForAverages;
}> {
  while (true) {
    const file = await captureAudioForFeatures();
    const featuresArray = await extractFeaturesFromFile(file);
    featuresArray.forEach((features) => {
      featuresQueue.enqueue({
        index: index,
        AudioFeatures: features,
      });
      updateTotalFeatures(features);
      index++;
    });
    if (featuresQueue.size() > 10) {
      const dequeuedItem = featuresQueue.dequeue();
      if (dequeuedItem) {
        updateTotalFeatures(dequeuedItem.AudioFeatures);
      }
    }
    const averages = calculateAverages(featuresQueue.size());
    yield { averages, boundsForAverages };
    fs.unlinkSync(file);
  }
}