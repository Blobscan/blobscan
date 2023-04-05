import { RouterOutputs } from "~/utils/api";

export type Block = RouterOutputs["block"]["getAll"][0];

export type Transaction = RouterOutputs["tx"]["getAll"][0];

export type Blob = RouterOutputs["blob"]["getAll"][0];
