import { t } from "../../trpc-client";
import { createWeaveVMReferences } from "./createWeaveVMReferences";
import { getAll } from "./getAll";
import { getBlobData } from "./getBlobData";
import { getBlobDataByBlobId } from "./getBlobDataByBlobId";
import { getByBlobId } from "./getByBlobId";
import { getCount } from "./getCount";

export const blobRouter = t.router({
  createWeaveVMReferences,
  getAll,
  getByBlobId,
  getBlobData,
  getBlobDataByBlobId,
  getCount,
});
