import { RedisClient } from "./instances";

const db = RedisClient.getInstance(0);
const workspaceDB = RedisClient.getInstance(1);
const testDB = RedisClient.getInstance(2);

export { workspaceDB, testDB };
export default db;
