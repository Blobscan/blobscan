import { QueueManager } from "./QueueManager";
import { connection } from "./utils";

export const queueManager = new QueueManager(connection);
