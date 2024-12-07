import { capitalize } from "./utils";

export type CommandErrorOptions = {
  command: string;
  operation: string;
};
export class CommandError extends Error {
  constructor(command: string, message: string, cause?: Error) {
    const formattedCommand = capitalize(command);

    const msg = `${formattedCommand} command failed: ${message}`;

    super(msg, {
      cause,
    });
  }
}
