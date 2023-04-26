import type { RouterOutputs } from "~/api";

export type Block = RouterOutputs["block"]["getByHash"];

export type Transaction = RouterOutputs["tx"]["getByHash"];

export type Blob = RouterOutputs["blob"]["getByIndex"];
