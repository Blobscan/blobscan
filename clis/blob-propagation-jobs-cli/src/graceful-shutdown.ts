import { context } from "./context-instance";

export function gracefulShutdown() {
  return context.close();
}
