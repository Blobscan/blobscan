import fs from "fs";

import type { Blob } from "./types";

function fileExists(path: string) {
  return fs.promises
    .access(path, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

function buildBlobDataFilePath(versionedHash: string) {
  return `${versionedHash}.txt`;
}

export async function createBlobDataFile({ data, versionedHash }: Blob) {
  const blobfilePath = buildBlobDataFilePath(versionedHash);

  try {
    if (!(await fileExists(blobfilePath))) {
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

  const blobData = await fs.promises.readFile(blobFilePath, "utf-8");

  if (!blobData) {
    throw new Error(
      `Couldn't read blob ${versionedHash} data file: file is missing`
    );
  }

  return blobData;
}

export async function removeBlobDataFile(versionedHash: string) {
  try {
    return fs.promises.unlink(buildBlobDataFilePath(versionedHash));
  } catch (err) {
    throw new Error(`Couldn't remove blob ${versionedHash} data file: ${err}`);
  }
}
