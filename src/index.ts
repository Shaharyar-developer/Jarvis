import { createOrGetAssistant, createOrGetThread } from "./openai/init";
import Run from "./openai/run";
import { env } from "./utils/env";
import assert from "assert";

const args = Bun.argv.slice(2).join(" ");

assert(env.OPEN_AI_API_KEY, "OPEN_AI_API_KEY is required");
assert(args, "Please provide a prompt, e.g. bun run dev Hello!");

//! Remember to remove the `true` argument from `createOrGetAssistant` in a production environment

const assistant = await createOrGetAssistant(true);
const thread = await createOrGetThread();
const chat = new Run({ assistant, thread });

//! Handle the stream events more elegantly and abstract the logic to make it easer to test

const stream = await chat.createRun(args);

let message: string[] = [];

for await (const event of stream) {
  switch (event.event) {
    case "error":
      console.error(event.data);
      break;

    case "thread.message.delta": {
      event.data.delta.content?.map((content) => {
        content.type === "text" &&
          content.text?.value &&
          process.stdout.write(content.text.value);
      });
      break;
    }

    // case "thread.message.completed": {
    //   console.log(
    //     event.data.content.map(
    //       (content) => content.type === "text" && content.text?.value,
    //     ),
    //   );
    //   break;
    // }

    case "thread.run.completed":
      process.exit();
      break;
    default:
    // console.log(event.data);
  }
}
