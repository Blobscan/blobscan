export const RATE_LIMIT_CONTACT_EMAIL = "contact@blobscan.com";

export type TooManyRequestsBody = {
  code: "TOO_MANY_REQUESTS";
  message: string;
};

/**
 * Body of every 429 Blobscan answers itself, so clients of the API and of the
 * web endpoints handle one format. Send the wait time in a `Retry-After`
 * header as well.
 *
 * @param reason What was exceeded, as a full sentence.
 */
export function createTooManyRequestsBody({
  reason,
  retryAfterSeconds,
}: {
  reason: string;
  retryAfterSeconds: number;
}): TooManyRequestsBody {
  return {
    code: "TOO_MANY_REQUESTS",
    message: `${reason} Retry in ${retryAfterSeconds}s. Need more capacity? Contact us at ${RATE_LIMIT_CONTACT_EMAIL}`,
  };
}
