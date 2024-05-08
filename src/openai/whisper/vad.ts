import * as Meyda from "meyda";
import { WaveFile } from "wavefile";
export type AudioFeatures = {
  energy: number;
  zcr: number;
  mfcc: number[];
  rms: number;
  loudness: {
    specific: Float32Array;
    total: number;
  };
  [key: string]: number | number[] | { specific: Float32Array; total: number };
};
export function getFeatures(buffer: Buffer, fftSize: number) {
  let wav = new WaveFile(buffer);
  wav.toBitDepth("32f");
  wav.toSampleRate(16000);
  let audioData = wav.getSamples();
  if (Array.isArray(audioData)) {
    if (audioData.length > 1) {
      const SCALING_FACTOR = Math.sqrt(2);

      for (let i = 0; i < audioData[0].length; ++i) {
        audioData[0][i] =
          (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
      }
    }
    audioData = new Float64Array(audioData[0]);
  }

  const feature = [];
  if (audioData.length % fftSize !== 0) {
    const padding = new Float64Array(fftSize - (audioData.length % fftSize));
    audioData = new Float64Array([...audioData, ...padding]);
  }
  for (let i = 0; i < audioData.length; i += fftSize) {
    const slice = audioData.slice(i, i + fftSize);
    const features = Meyda.default.extract(
      ["energy", "zcr", "mfcc", "rms", "loudness"],
      slice
    );
    feature.push(features);
  }

  return feature as AudioFeatures[];
}
