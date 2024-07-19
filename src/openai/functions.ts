import { workspaceDB } from "@/utils/db";
import { exec } from "child_process";

export const runCommand = (command: string): Promise<string> => {
  return new Promise((resolve) => {
    exec(command, { encoding: "utf-8" }, (error, stdout, stderr) => {
      if (error) {
        resolve(`Command failed: ${stderr.trim()}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

export async function getAllKeyValuePairs(): Promise<Record<string, string>> {
  const keyValuePairs: Record<string, string> = {};
  let cursor = "0";

  do {
    const [newCursor, keys] = await workspaceDB.scan(cursor);
    cursor = newCursor;

    if (keys.length > 0) {
      const values = await workspaceDB.mget(keys);
      keys.forEach((key, index) => {
        if (values[index]) keyValuePairs[key] = values[index];
      });
    }
  } while (cursor !== "0");
  console.log(keyValuePairs);
  return keyValuePairs;
}
