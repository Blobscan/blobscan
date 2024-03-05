export type Command = (argv?: string[]) => Promise<void>;

export type Entity = "blob" | "block" | "tx";

export type Operation = "deleteAll" | "deleteMany" | "populate" | "increment";
