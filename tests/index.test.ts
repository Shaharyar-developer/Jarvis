import {
  BUFFER_SIZE,
  SAMPLE_RATE,
  bounds,
  calculateAverage,
  calculatePercentageChange,
  captureAudioBuffer,
  feature,
  updateBounds,
  updateMelBandsBounds,
  type Features,
} from "@/sound/vad/main";
import Meyda from "meyda";

export const waitForTranscriptionAudio = async () => {
  let BASE_ENERGY: number | undefined;
  const featuresList: Features[] = [];
  while (true) {
    const data = await captureAudioBuffer(BUFFER_SIZE);
    let audioData = new Int16Array(data.buffer);

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
    BASE_ENERGY = averages.averages.energy;
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
      features.energy > (BASE_ENERGY || 5_000_000) &&
      features.zcr < 50 &&
      percentageChange.energyChange > 100 &&
      percentageChange.zcrChange <= 50
    ) {
      console.log(
        JSON.stringify(
          {
            energy: features.energy.toLocaleString(),
            zcr: features.zcr,
            energyChange: percentageChange.energyChange.toLocaleString(),
            zcrChange: percentageChange.zcrChange,
            averageEnergy: averages.averages.energy.toLocaleString(),
            averageZcr: averages.averages.zcr,
          },
          null,
          2
        )
      );
    } else {
    }
  }
  return true;
};

await waitForTranscriptionAudio();
