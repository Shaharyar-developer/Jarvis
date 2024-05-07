import * as Meyda from "meyda";

// let url =
//   "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav";
// let buffer = Buffer.from(await fetch(url).then((x) => x.arrayBuffer()));

// let wav = new wavefile.WaveFile(buffer);
// wav.toBitDepth("32f");
// wav.toSampleRate(16000);
// let audioData = wav.getSamples();
// if (Array.isArray(audioData)) {
//   if (audioData.length > 1) {
//     const SCALING_FACTOR = Math.sqrt(2);

//     for (let i = 0; i < audioData[0].length; ++i) {
//       audioData[0][i] =
//         (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
//     }
//   }
//   audioData = audioData[0];
//   console.log(getFeatures(audioData, 1024));
// }

// let start = performance.now();
// let end = performance.now();
// console.log(`Execution duration: ${(end - start) / 1000} seconds`);

import { WaveFile } from "wavefile";

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
    const features = Meyda.default.extract("loudness", slice);
    feature.push(features);
  }
  return feature;
}
