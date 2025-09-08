import { getPrisma } from "@blobscan/db";
import { env } from "@blobscan/env";

export const prisma = getPrisma({
  customFieldExtension: {
    blobUrlField: {
      gcs: {
        bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
        apiBaseUrl: env.GOOGLE_STORAGE_API_ENDPOINT,
      },
      loadNetwork: {
        apiBaseUrl: env.WEAVEVM_STORAGE_API_BASE_URL,
      },
      postgres: {
        apiBaseUrl: env.BLOBSCAN_API_BASE_URL,
      },
      s3: {
        apiBaseUrl: env.S3_STORAGE_ENDPOINT,
        bucketName: env.S3_STORAGE_BUCKET_NAME,
      },
    },
  },
});
