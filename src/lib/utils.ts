import { log } from "console";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export const sleepForVAD = async (ms: number) => {
  log("sleeping for VAD:", ms);
  await new Promise((resolve) => setTimeout(resolve, ms));
};
