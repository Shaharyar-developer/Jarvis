import { env } from "../../lib/env.js";
import OpenAI from "openai";
import { getAssistantId, setAssistantId } from "../../lib/redis-vars.js";

let openai: OpenAI | null = null;

function initializeOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
}
const config: OpenAI.Beta.Assistants.AssistantCreateParams = {
  model: "gpt-3.5-turbo-1106",
  name: "Nyx",
  instructions:
    "You are Nyx, A Helpful, Playful and Intelligent Assistant. You will only respond with a maximum of 30 words. You are here to help and entertain.",
  response_format: { type: "json_object" },
};

async function getOrCreateAssistant(): Promise<OpenAI.Beta.Assistants.Assistant> {
  initializeOpenAI();
  const assistantId = await getAssistantId();
  if (assistantId) {
    {
      console.log("getting assistant");

      const retrievedAssistant = await openai?.beta.assistants.retrieve(
        assistantId
      );
      if (retrievedAssistant) {
        return retrievedAssistant;
      }
    }
  }
  const assistant = await openai?.beta.assistants.create(config);
  console.log("creating assistant");

  if (assistant) {
    await setAssistantId(assistant.id);
    return assistant;
  } else throw new Error("Failed to create assistant");
}

export { getOrCreateAssistant };
