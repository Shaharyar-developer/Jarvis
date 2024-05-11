import { captureAudioBuffer } from "@/sound/vad/main";
import Meyda from "meyda";

const truncateTo = (buffer: Buffer, size: number) => {
  return buffer.subarray(0, size);
};
let bounds = {
  rms: { top: -Infinity, bottom: Infinity },
  energy: { top: -Infinity, bottom: Infinity },
  melBands: { top: -Infinity, bottom: Infinity },
};
let averages = {
  rms: 0,
  energy: 0,
  melBands: 0,
};
type Features = {
  rms: number;
  energy: number;
  melBands: number[];
};
while (true) {
  const data = await captureAudioBuffer(2056);
  const truncatedData = truncateTo(data, 256);
  const features = Meyda.extract(
    ["rms", "energy", "melBands"],
    truncatedData
  ) as Features;
  if (features.rms > bounds.rms.top) bounds.rms.top = features.rms;
  if (features.rms < bounds.rms.bottom) bounds.rms.bottom = features.rms;
  if (features.energy > bounds.energy.top) bounds.energy.top = features.energy;
  if (features.energy < bounds.energy.bottom)
    bounds.energy.bottom = features.energy;
  features?.melBands.forEach((band: number) => {
    if (band > bounds.melBands.top) bounds.melBands.top = band;
    if (band < bounds.melBands.bottom) bounds.melBands.bottom = band;
  });
  averages.rms = (averages.rms + features.rms) / 2;
  averages.energy = (averages.energy + features.energy) / 2;
  averages.melBands =
    (averages.melBands + features.melBands.reduce((a, b) => a + b, 0)) / 2;
  console.log(averages);
}
