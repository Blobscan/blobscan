import { QueueManager } from "./QueueManager";
import { connection } from "./common";

export const queueManager = new QueueManager(connection);
