import {
  pipeline,
  AutomaticSpeechRecognitionPipeline,
  TextToAudioPipeline,
} from "@xenova/transformers";
import { performance } from "perf_hooks";
import wavefile from "wavefile";
import fs from "fs";

class LocalModels {
  private transcriber: AutomaticSpeechRecognitionPipeline | undefined;
  private synthesizer: TextToAudioPipeline | undefined;
  private embeddings: string;

  constructor() {
    this.embeddings =
      "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin";
  }

  async init() {
    this.transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en",
      {
        quantized: true,

        progress_callback: (progress: unknown) => {
          console.log(progress);
        },
      },
    );
    // this.synthesizer = await pipeline("text-to-speech", "Xenova/speecht5_tts", {
    //   quantized: false,
    //   progress_callback: (progress: unknown) => {
    //     console.log(progress);
    //   },
    // });
  }

  async transcribe() {
    if (!this.transcriber) {
      throw new Error(
        "Transcriber not initialized. Call init() before transcribe().",
      );
    }
    const buffer = fs.readFileSync("./tmp/speech.wav");
    let wav = new wavefile.WaveFile(buffer);
    fs.writeFileSync("./speech3.wav", wav.toBuffer());
    wav.toBitDepth("32f");
    wav.toSampleRate(16000);
    let audioData = wav.getSamples();
    if (Array.isArray(audioData)) {
      if (audioData.length > 1) {
        const SCALING_FACTOR = Math.sqrt(2);
        // Merge channels (into first channel to save memory)
        for (let i = 0; i < audioData[0].length; ++i) {
          audioData[0][i] =
            (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
        }
      }

      // Select first channel
      audioData = audioData[0];
      let output = await this.transcriber(audioData, {
        language: "en",
      });
      if (Array.isArray(output)) {
        return output.map((x) => x.text).join(" ");
      } else {
        return output.text;
      }
    } else {
      let output = await this.transcriber(audioData, {
        language: "en",
      });
      if (Array.isArray(output)) {
        return output.map((x) => x.text).join(" ");
      } else {
        return output.text;
      }
    }
  }
  async generate_speech() {
    if (!this.synthesizer) {
      throw new Error(
        "Synthesizer not initialized. Call init() before generate_speech().",
      );
    }
    const result = await this.synthesizer(
      "Hmmm, you could try using a state variable to hold the form data",
      {
        speaker_embeddings: this.embeddings,
      },
    );
    const wav = new wavefile.WaveFile();
    wav.fromScratch(1, result.sampling_rate, "32f", result.audio);
    fs.writeFileSync("result.wav", wav.toBuffer());
  }
}

export { LocalModels };
