import { env } from "@/lib/env";
import { ElevenLabsClient } from "elevenlabs";

let el: ElevenLabsClient | null = null;
function initializeElevenLabs() {
  if (!el) {
    el = new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });
  }
}
export { el, initializeElevenLabs };
