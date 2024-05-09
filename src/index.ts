import { getAverageFeaturesFromAudio } from "@/openai/whisper/helpers";

const featuresGenerator = getAverageFeaturesFromAudio();
let previousFeature = null;
let previousFeature2 = null;
const threshold = 20;

const getPercentageChange = (oldValue: number, newValue: number) => {
  return ((newValue - oldValue) / oldValue) * 100;
};

for await (const features of featuresGenerator) {
  if (previousFeature !== null) {
    const percentageChange = getPercentageChange(
      previousFeature,
      features.energy
    );
    if (Math.abs(percentageChange) > threshold) {
      console.log(
        "Significant fluctuation detected. Previous energy: ",
        previousFeature,
        " Current energy: ",
        features.energy,
        " Percentage change: ",
        percentageChange
      );
    } else {
      console.log(
        "No significant fluctuation detected. Previous energy: ",
        previousFeature,
        " Current energy: ",
        features.energy,
        " Percentage change: ",
        percentageChange
      );
    }
  }
  if (previousFeature2 !== null) {
    const percentageChange = getPercentageChange(
      previousFeature2,
      features.rms
    );
    if (Math.abs(percentageChange) > threshold) {
      console.log(
        "Significant fluctuation detected. Previous .rms: ",
        previousFeature2,
        " Current .rms: ",
        features.rms,
        " Percentage change: ",
        percentageChange
      );
    } else {
      console.log(
        "No significant fluctuation detected. Previous .rms: ",
        previousFeature2,
        " Current .rms: ",
        features.rms,
        " Percentage change: ",
        percentageChange
      );
    }
  }
  previousFeature = features.energy;
  previousFeature2 = features.rms;
}

