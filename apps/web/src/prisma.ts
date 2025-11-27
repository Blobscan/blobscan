import { getPrisma } from "@blobscan/db";

import { env } from "./env.mjs";

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
      sftp: {
        apiBaseUrl: env.SFTP_STORAGE_API_BASE_URL,
      },
    },
  },
});
