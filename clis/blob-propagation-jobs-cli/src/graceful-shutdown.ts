import { queueManager } from "./queue-manager";

export function gracefulShutdown() {
  return queueManager.close();
}
