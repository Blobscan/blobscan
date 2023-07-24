import { BlobStorageManager } from "./BlobStorageManager";
import { env } from "./env";
import { GoogleStorage, PrismaStorage, SwarmStorage } from "./storages";

const blobStorageManager = BlobStorageManager.tryFromEnv(env);

export type { BlobReference } from "./BlobStorageManager";
export { blobStorageManager, GoogleStorage, SwarmStorage, PrismaStorage };
