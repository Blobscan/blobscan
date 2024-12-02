export type Command = (argv?: string[]) => Promise<void>;

export type Operation = "erase" | "deleteMany" | "aggregate";
