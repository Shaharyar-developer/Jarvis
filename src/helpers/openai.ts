import OpenAI from "openai";
import { getOpenAiInstance } from "@/lib/clients";
import { AssistantStreamEvent } from "openai/resources/beta/index";
import { Stream } from "openai/streaming";
import { db } from "@/lib/db";

const client = getOpenAiInstance();
const assistantParams = {
  model: "gpt-3.5-turbo-1106",
  description: "Nyx, a digital assistant",
  instructions:
    "You are Nyx, your purpose is to help the user with their questions and tasks.",
  name: "Nyx",
  temperature: 0.4,
};

/**
 * @todo  Singleton Pattern Implementation: The Chat class is implemented as a singleton, which is appropriate for cases where a single instance is needed. However, the lack of thread safety in JavaScript's single-threaded environment is not a concern here, but it's something to be mindful of in environments that support multi-threading.

Error Handling: The code makes asynchronous calls (await) within try blocks without corresponding catch blocks for error handling. This omission can lead to unhandled promise rejections if any of the asynchronous operations fail. It's advisable to add try-catch blocks around asynchronous operations or ensure that calling functions handle errors appropriately.

Concurrency Concerns: The methods ensureAssistant and ensureThread check for the existence of an assistant or thread and create them if they don't exist. However, if multiple calls to these methods happen nearly simultaneously (before the first call completes and sets the instance variables), it could lead to unnecessary duplicate creations. Implementing a locking mechanism or ensuring that initialize is called and awaited before any other method can mitigate this issue.

Database Operations: The code interacts with a database (db()) to store and retrieve assistant_id and thread_id. The robustness of this code is dependent on the implementation of db(). Ensuring that db() handles errors and concurrency issues is crucial for the overall reliability of the Chat class.

Dependency on External Services: The class heavily depends on the OpenAI API and a database for its operations. Any changes or downtime in these services could impact the functionality. Implementing fallbacks or retries could improve resilience.

Lack of Input Validation: The createMessage method accepts a message string and directly passes it to the OpenAI API without validation. Ensuring that inputs are validated against a set of criteria (e.g., length, content type) can prevent potential errors or misuse.

Documentation and Usage Pattern: The comment at the end provides a basic usage pattern, which is helpful. However, more detailed documentation, especially regarding the need to call initialize before other methods and potential error cases, would be beneficial for maintainers and users of the class.

Testing and Debugging: There's no indication of unit tests or logging, which are essential for identifying and fixing errors early. Implementing tests, especially for edge cases and error conditions, and adding logging for critical operations can greatly enhance maintainability and debuggability.
 */

class Chat {
  private static instance: Chat;
  private assistant!: OpenAI.Beta.Assistant;
  private thread!: OpenAI.Beta.Thread;
  private messages: OpenAI.Beta.Threads.Message[] = [];
  private run?: Stream<AssistantStreamEvent>;

  private constructor() {}

  public static getInstance(): Chat {
    if (!Chat.instance) {
      Chat.instance = new Chat();
    }
    return Chat.instance;
  }

  // New initialization method that must be called after creating an instance
  public async initialize() {
    await this.ensureAssistant();
    await this.ensureThread();
  }

  private async ensureAssistant() {
    if (!this.assistant) {
      const assistantId = await db().get("assistant_id");
      if (!assistantId) {
        this.assistant = await client.beta.assistants.create(assistantParams);
        await db().set("assistant_id", this.assistant.id);
      } else {
        this.assistant = await client.beta.assistants.retrieve(assistantId);
      }
    }
  }

  private async ensureThread() {
    if (!this.thread) {
      const threadId = await db().get("thread_id");
      if (!threadId) {
        this.thread = await client.beta.threads.create();
        await db().set("thread_id", this.thread.id);
      } else {
        this.thread = await client.beta.threads.retrieve(threadId);
      }
    }
  }

  public async createMessage(message: string) {
    await this.ensureAssistant();
    await this.ensureThread();
    const messageResponse = await client.beta.threads.messages.create(
      this.thread.id,
      {
        content: message,
        role: "user",
      }
    );
    return messageResponse;
  }

  public async getMessages() {
    await this.ensureThread();
    const messagesResponse = await client.beta.threads.messages.list(
      this.thread.id
    );
    this.messages = messagesResponse.data;
    return this.messages;
  }

  public async createRunStream() {
    await this.ensureThread();
    await this.ensureAssistant();
    this.run = await client.beta.threads.runs.create(this.thread.id, {
      assistant_id: this.assistant.id,
      stream: true,
    });
    return this.run;
  }

  public getRunStream() {
    if (!this.run) {
      throw new Error("Run stream has not been initialized.");
    }
    return this.run;
  }
}

// Usage pattern documentation:
// 1. Call Chat.getInstance() to get an instance of Chat.
// 2. Immediately call initialize() on the instance before calling any other methods.
// 3. Do not call getRunStream() before createRunStream() has been successfully executed.

export { Chat };
