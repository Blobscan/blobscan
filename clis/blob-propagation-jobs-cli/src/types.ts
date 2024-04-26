export type Command<R = unknown> = (argv?: string[]) => Promise<R>;
