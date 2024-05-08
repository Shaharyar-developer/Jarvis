import {
  captureAudioForFeatures,
  extractFeaturesFromFile,
} from "@/openai/whisper/helpers";
import type { AudioFeatures } from "./openai/whisper/vad";

type FeaturesList = {
  index: number;
  AudioFeatures: AudioFeatures[];
}[];

let featuresList: FeaturesList = [];
let index = 0;
while (true) {
  const file = await captureAudioForFeatures();
  const features = await extractFeaturesFromFile(file);
  featuresList.push({
    index: index,
    AudioFeatures: features,
  });
  index++;
  console.log(featuresList.map((f) => f.index));
}
