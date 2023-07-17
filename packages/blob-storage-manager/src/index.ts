import { BlobStorageManagerBuilder } from "./BlobStorageManagerBuilder";
import { env } from "./env";
import { GoogleStorage, SwarmStorage } from "./storages";

const blobStorageManager = BlobStorageManagerBuilder.create(env.CHAIN_ID)
  .addStorage(
    "google",
    new GoogleStorage({
      bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
      projectId: env.GOOGLE_STORAGE_PROJECT_ID,
      serviceKey: env.GOOGLE_SERVICE_KEY,
      apiEndpoint:
        env.NODE_ENV === "development" ? "http://0.0.0.0:4443" : undefined,
    })
  )
  .addStorage(
    "swarm",
    env.BEE_DEBUG_ENDPOINT && env.BEE_ENDPOINT
      ? new SwarmStorage({
          beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
          beeEndpoint: env.BEE_ENDPOINT,
        })
      : null
  )
  .build();

export { blobStorageManager, GoogleStorage, SwarmStorage };
