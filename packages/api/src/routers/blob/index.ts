import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getBlobDataByBlobId } from "./getBlobDataByBlobId";
import { getByBlobId } from "./getByBlobId";

export const blobRouter = t.router({
  getAll,
  getByBlobId,
  getBlobDataByBlobId,
});
