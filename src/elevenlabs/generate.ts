// {
//     "voice_id": "wJqPPQ618aTW29mptyoc",
//     "name": "Ana-Rita",
//     "samples": null,
//     "category": "professional",
//     "fine_tuning": {
//       "is_allowed_to_fine_tune": true,
//       "finetuning_state": "fine_tuned",
//       "verification_failures": [],
//       "verification_attempts_count": 0,
//       "manual_verification_requested": false,
//       "language": "en",
//       "finetuning_progress": {},
//       "message": null,
//       "dataset_duration_seconds": null,
//       "verification_attempts": null,
//       "slice_ids": null,
//       "manual_verification": null
//     },
// }
import { el, initializeElevenLabs } from "./init";
import { spawn } from "child_process";
import { pipeline } from "stream";
import { promisify } from "util";

const pipelineAsync = promisify(pipeline);

export const say = async (text: string) => {
  initializeElevenLabs();
  if (el) {
    const data = await el.generate({
      model_id: "eleven_turbo_v2",
      stream: true,
      text: text,
      voice: "Ana-Rita",
    });

    const ffmpeg = spawn("ffmpeg", ["-i", "pipe:0", "-f", "alsa", "default"]);
    await pipelineAsync(data, ffmpeg.stdin);
  } else {
    throw new Error("Failed to generate audio");
  }
};

say("Hello, how are you?");
