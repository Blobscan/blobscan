import { t } from "../../trpc-client";
import { createWeaveVMReferences } from "./createWeaveVMReferences";
import { getAll } from "./getAll";
import { getByBlobId } from "./getByBlobId";
import { getCount } from "./getCount";

export const blobRouter = t.router({
  createWeaveVMReferences,
  getAll,
  getByBlobId,
  getCount,
});
