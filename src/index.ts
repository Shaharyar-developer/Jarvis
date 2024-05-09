import { getAverageFeaturesFromAudio } from "@/openai/whisper/helpers";

const featuresGenerator = getAverageFeaturesFromAudio();

for await (const features of featuresGenerator) {
  console.log(features);
}
