import { OpenAiClient } from "./instances";

const client = OpenAiClient.getInstance();

async function summarize(text: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a highly skilled AI trained in language comprehension and summarization. I would like you to read the following text and summarize it into a concise abstract paragraph. Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content
    ? response.choices[0].message.content
    : "Faile to create summary";
}

async function extractKeyPoints(text: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a proficient AI with a specialty in distilling information into key points. I would like you to read the following text and extract the key points. Identify the most important points, providing a list of bullet points that summarize the main ideas of the text. Please avoid unnecessary details or tangential points.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content
    ? response.choices[0].message.content
    : "Failed to extract key points";
}

export { summarize, extractKeyPoints };
