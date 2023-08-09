import { api } from "@blobscan/open-telemetry";

export const tracer = api.trace.getTracer("@blobscan/blob-storage-manager");
