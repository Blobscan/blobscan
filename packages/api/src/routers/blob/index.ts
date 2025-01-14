import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getBlobDataByBlobId } from "./getBlobDataByBlobId";
import { getByBlobId } from "./getByBlobId";
import { getCount } from "./getCount";
import { upsertWeaveVMReferences } from "./upsertWeaveVMReferences";

export const blobRouter = t.router({
  getAll,
  getByBlobId,
  getBlobDataByBlobId,
  getCount,
  upsertWeaveVMReferences,
});
