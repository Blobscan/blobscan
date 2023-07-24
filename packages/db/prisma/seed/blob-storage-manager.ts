import {
  BlobStorageManagerBuilder,
  GoogleStorage,
  PrismaStorage,
} from "@blobscan/blob-storage-manager";

export function createLocalBlobStorageManager({
  chainId,
  googleConfig,
}: {
  googleConfig?: { apiEndpoint: string };
  chainId: number;
}) {
  const googleStorage = googleConfig
    ? new GoogleStorage({
        bucketName: "blobscan-bucket",
        projectId: "blobscan-project-test",
        apiEndpoint: googleConfig.apiEndpoint,
      })
    : null;
  const prismaStorage = !googleStorage ? new PrismaStorage() : null;

  return BlobStorageManagerBuilder.create(chainId)
    .addStorage("GOOGLE", googleStorage)
    .addStorage("PRISMA", prismaStorage)
    .build();
}
