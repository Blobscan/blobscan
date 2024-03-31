import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlobId } from "./getByBlobId";

export const blobRouter = t.router({
  getAll,
  getByBlobId,
});
