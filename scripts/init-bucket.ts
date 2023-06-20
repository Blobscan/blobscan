import { Storage } from "@google-cloud/storage";

async function main() {
  if (process.env.NODE_ENV === "development") {
    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME || "blobscan-dev";
    const storage = new Storage({ apiEndpoint: "http://localhost:4443" });

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
