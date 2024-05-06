import mic from "mic";
import VAD from "node-vad";

const micInstance = mic({
  rate: 16000,
  channels: 2,
  debug: false,
  device: "hw:0,7",
});
const vad = new VAD(VAD.Mode.NORMAL);
// Add In Noise Reduction Before Testing for VAD
const micInputStream = micInstance.getAudioStream();

micInputStream.on("data", function (data: any) {
  vad
    .processAudio(data, 16000)
    .then((res: any) => {
      switch (res) {
        case VAD.Event.ERROR:
          console.log("ERROR");
          break;
        case VAD.Event.NOISE:
          console.log("NOISE");
          break;
        case VAD.Event.SILENCE:
          console.log("SILENCE");
          break;
        case VAD.Event.VOICE:
          console.log("VOICE");
          break;
      }
    })
    .catch(console.error);
});

micInstance.start();
