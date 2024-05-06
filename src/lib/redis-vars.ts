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
