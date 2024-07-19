import { RedisClient } from "./instances";

const db = RedisClient.getInstance(0);
const workspaceDB = RedisClient.getInstance(1);
export { workspaceDB };
export default db;
