import { t } from "../../trpc-client";
import type { ProcedureConfig } from "../../types";
import { createIpfsReferences } from "./createIpfsReferences";
import { createWeaveVMReferences } from "./createWeaveVMReferences";
import { getAdjacentBlob } from "./getAdjacentBlob";
import { getAll } from "./getAll";
import { getAllByCursor } from "./getAllByCursor";
import { createBlobDataByBlobIdProcedure } from "./getBlobDataByBlobId";
import { getByBlobId } from "./getByBlobId";
import { getByBlobIdV1 } from "./getByBlobIdV1";
import { getCount } from "./getCount";

export type BlobRouterConfig = {
  blobDataProcedure: ProcedureConfig;
};

export function createBlobRouter(config?: BlobRouterConfig) {
  return t.router({
    createIpfsReferences,
    createWeaveVMReferences,
    getAdjacentBlob,
    getAll,
    getAllByCursor,
    getByBlobId,
    getByBlobIdV1,
    getCount,
    getBlobDataByBlobId: createBlobDataByBlobIdProcedure(
      config?.blobDataProcedure
    ),
  });
}
