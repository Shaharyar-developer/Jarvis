import { getAverageFeaturesFromAudio } from "@/openai/whisper/helpers";
import type { Averages, BoundsForAverages } from "./types/audio-features";

type featuresPlusBounds = {
  averages: Averages;
  boundsForAverages: BoundsForAverages;
};
type featuresPlusBoundsList = featuresPlusBounds[];

let featuresPlusBoundsList: featuresPlusBoundsList = [];

const featuresGenerator = getAverageFeaturesFromAudio();

for await (const features of featuresGenerator) {
  featuresPlusBoundsList.push(features);
  if (featuresPlusBoundsList.length > 10) {
    featuresPlusBoundsList.splice(0, 1);
  }
  console.log(
    featuresPlusBoundsList.forEach((e) => {
      console.log(JSON.stringify(e, null, 2));
    })
  );
}
