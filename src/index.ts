import { captureAudioForTranscription } from "@/openai/whisper/helpers";

await captureAudioForTranscription();

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
