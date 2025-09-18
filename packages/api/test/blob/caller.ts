import { createBlobRouter } from "../../src/routers/blob";
import { t } from "../../src/trpc-client";

export const blobRouter = createBlobRouter();

export const createBlobCaller = t.createCallerFactory(blobRouter);

export type BlobCaller = ReturnType<typeof createBlobCaller>;
