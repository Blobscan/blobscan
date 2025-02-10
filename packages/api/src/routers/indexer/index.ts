import { t } from "../../trpc-client";
import { handleReorg } from "./handleReorg";
import { indexData } from "./indexData";

export const indexerRouter = t.router({
  handleReorg,
  indexData,
});
