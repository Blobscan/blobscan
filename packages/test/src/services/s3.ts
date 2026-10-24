import { env } from "@blobscan/env";

const S3_BUCKET_RETRY_MS = 250;
const S3_BUCKET_TIMEOUT_MS = 30_000;

function getCreateBucketUrl(endpoint: string, bucketName: string) {
  const url = new URL(endpoint);

  url.pathname = `${url.pathname.replace(/\/$/, "")}/${bucketName}`;

  return url;
}

/**
 * S3Mock creates its initial buckets lazily on the first request. Create the
 * test bucket explicitly so storage clients don't race bucket initialization.
 */
export async function ensureS3Bucket() {
  if (!env.S3_STORAGE_ENABLED) {
    return;
  }

  const {
    S3_STORAGE_BUCKET_NAME: bucketName,
    S3_STORAGE_ENDPOINT: endpoint,
    S3_STORAGE_REGION: region,
  } = env;

  if (!bucketName || !endpoint) {
    return;
  }

  const url = getCreateBucketUrl(endpoint, bucketName);
  const body = `<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LocationConstraint>${
    region ?? "us-east-1"
  }</LocationConstraint></CreateBucketConfiguration>`;
  const deadline = Date.now() + S3_BUCKET_TIMEOUT_MS;
  let lastError: unknown;

  do {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/xml",
        },
        body,
      });

      // S3Mock returns 409 when the initial bucket already exists.
      if (response.ok || response.status === 409) {
        return;
      }

      lastError = new Error(
        `S3 mock returned HTTP ${response.status}: ${await response.text()}`
      );
    } catch (err) {
      lastError = err;
    }

    await new Promise((resolve) => setTimeout(resolve, S3_BUCKET_RETRY_MS));
  } while (Date.now() < deadline);

  throw new Error(
    `S3 bucket "${bucketName}" could not be created at ${endpoint}`,
    { cause: lastError }
  );
}
