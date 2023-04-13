import type { RouterOutputs } from "~/utils/api";

export type Block = RouterOutputs["block"]["getByHash"];

export type Transaction = RouterOutputs["tx"]["getByHash"];

export type Blob = RouterOutputs["blob"]["getById"];
