import mic from "mic";
import VAD from "node-vad";

type speech = "speaking" | "silent";

const micInstance = mic({
  rate: 16000,
  channels: 2,
  debug: false,
  device: "hw:0,7",
});

let moments: number[] = [];

const checkSpeech = (moments: number[]): speech => {
  const lastTenMoments = moments.slice(-10);

  const onesInLastTen = lastTenMoments.filter((moment) => moment === 1).length;

  if (onesInLastTen >= 2) {
    console.log("spoke", onesInLastTen);

    return "speaking";
  }
  return "silent";
};

const vad = new VAD(2);
const micInputStream = micInstance.getAudioStream();
let init = false;
setTimeout(() => {
  init = true;
}, 2000);
micInputStream.on("data", function (data: any) {
  vad
    .processAudio(data, 16000)
    .then((res: any) => {
      switch (res) {
        case VAD.Event.ERROR:
          console.log("ERROR");
          break;
        case VAD.Event.NOISE:
          break;
        case VAD.Event.SILENCE:
          init && moments.push(0);
          init && checkSpeech(moments);
          break;
        case VAD.Event.VOICE:
          init && moments.push(1);
          init && checkSpeech(moments);
          break;
      }
    })
    .catch(console.error);
});

micInstance.start();
