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

export type Averages = {
  energy: number;
  zcr: number;
  mfcc: number[];
  rms: number;
  loudness: {
    total: number;
  };
};
export type BoundsForAverages = {
  energy: { upper: number; lower: number };
  zcr: { upper: number; lower: number };
  mfcc: { upper: number; lower: number }[];
  rms: { upper: number; lower: number };
  loudness: {
    total: { upper: number; lower: number };
  };
};
export type AudioFeatureItem = {
  index: number;
  AudioFeatures: AudioFeatures;
};

export type FeaturesList = AudioFeatureItem[];
