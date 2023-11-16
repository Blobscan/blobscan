import fs from "fs";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import type { $Enums } from "@blobscan/db";

import type { Blob } from "./types";

export function checkBlobDataFileExists(versionedHash: string) {
  const path = buildBlobDataFilePath(versionedHash);

  return fs.promises
    .access(path, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export function buildBlobDataFilePath(versionedHash: string) {
  return `${versionedHash}.txt`;
}

export async function createBlobDataFile({ data, versionedHash }: Blob) {
  const blobfilePath = buildBlobDataFilePath(versionedHash);

  try {
    if (await checkBlobDataFileExists(blobfilePath)) {
      return Promise.resolve();
    }

    return fs.promises.writeFile(blobfilePath, data, { encoding: "utf-8" });
  } catch (err) {
    throw new Error(
      `Couldn't store blob ${versionedHash} data on filesystem: ${err}`
    );
  }
}

export async function readBlobDataFile(versionedHash: string) {
  const blobFilePath = buildBlobDataFilePath(versionedHash);

  try {
    const blobData = await fs.promises.readFile(blobFilePath, "utf-8");

    return blobData;
  } catch (error) {
    throw new Error(
      `Couldn't read blob ${versionedHash} data file: file is missing`
    );
  }
}

export async function removeBlobDataFile(versionedHash: string) {
  try {
    await fs.promises.unlink(buildBlobDataFilePath(versionedHash));
  } catch (err) {
    throw new Error(`Couldn't remove blob ${versionedHash} data file: ${err}`);
  }
}

export async function propagateBlob(
  versionedHash: string,
  targetStorage: $Enums.BlobStorage
) {
  const blobStorageManager = await createOrLoadBlobStorageManager();
  const blobData = await readBlobDataFile(versionedHash);

  const result = await blobStorageManager.storeBlob(
    {
      data: blobData,
      versionedHash,
    },
    {
      storages: [targetStorage],
    }
  );

  const storageRef = result.references[0];

  if (!storageRef) {
    throw new Error(
      `Blob reference missing when storing ${versionedHash} in ${targetStorage}`
    );
  }

  return storageRef;
}
