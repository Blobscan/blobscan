import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getBlobDataByBlobId } from "./getBlobDataByBlobId";
import { getByBlobId } from "./getByBlobId";
import { getCount } from "./getCount";

export const blobRouter = t.router({
  getAll,
  getByBlobId,
  getBlobDataByBlobId,
  getCount,
});
