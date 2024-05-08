import fs from "fs";
import { handleAudioProcessing } from "./openai/whisper/helpers";

const buffer = Buffer.from(fs.readFileSync("./tmp/taunt.wav"));
const features = await handleAudioProcessing(buffer);
fs.writeFileSync("./tmp/features.json", JSON.stringify(features, null, 2));

// const transcription = await transcribeAudio(file);

// await createOrGetAssistant(true);
// await createOrGetThread(true);
// await addMessageToThread(transcription);
// console.log("Transcription added to thread");

// const run = createRun();

// for await (const event of run) {
//   if (event.event === "thread.message.completed") {
//     event.data.content.forEach((c) => {
//       c.type === "text" && console.log(c.text);
//     });
//   }
// }
// const transcribeAudio = async (filePath: string) => {
//   initializeOpenAI();
//   console.log("Transcribing audio");
//   const transcription = await openai?.audio.transcriptions.create({
//     model: "whisper-1",
//     response_format: "json",
//     language: "english",
//     file: fs.createReadStream(filePath),
//   });
//   if (!transcription) throw new Error("Transcription failed");
//   return transcription.text;
// };
