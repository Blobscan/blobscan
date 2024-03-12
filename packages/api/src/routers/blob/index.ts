import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlobId } from "./getByBlobId";
import { getByBlobIdFull } from "./getByBlobIdFull";

export const blobRouter = t.router({
  getAll,
  getByBlobId,
  getByBlobIdFull,
});
