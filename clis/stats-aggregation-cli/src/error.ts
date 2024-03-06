import { capitalize } from "./utils";

export type CommandErrorOptions = {
  command: string;
  operation: string;
};
export class CommandError extends Error {
  constructor(message: string, { command, operation }: CommandErrorOptions) {
    const formattedCommand = capitalize(command);

    super(`${formattedCommand} stats ${operation} failed: ${message}`);
  }
}
