import { BeeResponseError } from "@ethersphere/bee-js";

export async function performBeeAPICall<T>(
  call: () => T,
  context: { beeUrl: string; batchId?: string }
): Promise<T> {
  try {
    const res = await call();
    return res;
  } catch (err) {
    if (err instanceof BeeResponseError) {
      throw new Error(
        `Request ${err.method.toUpperCase()} to Bee API ${err.url} ${
          context.batchId !== undefined ? `batch "${context.batchId}" ` : " "
        }at "${context.beeUrl}" failed with status code ${err.status} ${
          err.statusText
        }: ${err.message}
          - Details: ${JSON.stringify(err.responseBody, null, 2)}
        `,
        err.cause as Error | undefined
      );
    }
    throw err;
  }
}
