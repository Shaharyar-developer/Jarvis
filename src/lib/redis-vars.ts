import db from "./db";

export const setAssistantId = async (assistantId: string) => {
  const existingAssistantId = await getAssistantId();
  if (existingAssistantId) {
    await db.del(existingAssistantId);
  }
  await db.set("assistantId", assistantId);
};
export const getAssistantId = async () => {
  return db.get("assistantId");
};

export const setThreadId = async (threadId: string) => {
  const existingThreadId = await getThreadId();
  if (existingThreadId) {
    await db.del(existingThreadId);
  }
  await db.set("threadId", threadId);
};
export const getThreadId = async () => {
  return db.get("threadId");
};

export const getRunId = async () => {
  return db.get("runId");
};
export const setRunId = async (runId: string) => {
  await db.set("runId", runId);
};