import type { AxiosError } from "axios";

import { ErrorException } from "@blobscan/errors";
import type { ErrorCause } from "@blobscan/errors";
import { z } from "@blobscan/zod";

export class SyncerError extends ErrorException {
  constructor(syncerName: string, message: string, cause: ErrorCause) {
    super(`Syncer "${syncerName}" failed: ${message}`, cause);
  }
}

const swarmApiResponseErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  reasons: z.array(z.unknown()).optional(),
});

export class SwarmNodeError extends ErrorException {
  code: number | undefined;
  reasons?: unknown[];

  constructor(error: AxiosError) {
    let message: string;
    let code: number | undefined;
    const result = swarmApiResponseErrorSchema.safeParse(error.response?.data);
    let reasons: unknown[] | undefined;

    if (result.success) {
      code = result.data.code;
      message = result.data.message;
      reasons = result.data.reasons;
    } else {
      message = error.message;
    }

    super(message, error.cause);

    this.code = code;
    this.reasons = reasons;
  }
}
