import { Storage } from "@google-cloud/storage";

const GOOGLE_STORAGE_API_ENDPOINT = process.env.GOOGLE_STORAGE_API_ENDPOINT;
async function main() {
  if (GOOGLE_STORAGE_API_ENDPOINT && GOOGLE_STORAGE_API_ENDPOINT.length) {
    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME || "blobscan-dev";
    const storage = new Storage({ apiEndpoint: GOOGLE_STORAGE_API_ENDPOINT });

    const [buckets] = await storage.getBuckets();

    const foundBucket = buckets.find(({ name }) => name === bucketName);

    if (foundBucket) {
      console.log(`Bucket "${bucketName}" found!`);

      return;
    }

    await storage.createBucket(bucketName);

    console.log(`Bucket "${bucketName}" created!`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
