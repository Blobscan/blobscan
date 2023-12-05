import fs from "fs";
import path from "path";

import type { Blob } from "./types";

export class BlobFileManager {
  #blobDirPath: string;

  constructor(basePath: string) {
    this.#blobDirPath = path.join(basePath, "blobs");

    if (!fs.existsSync(this.#blobDirPath)) {
      fs.mkdirSync(this.#blobDirPath);
    }
  }

  checkBlobDataFileExists(versionedHash: string) {
    const path = this.#buildBlobDataFilePath(versionedHash);

    return fs.promises
      .access(path, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  async createBlobDataFile({ data, versionedHash }: Blob) {
    try {
      if (await this.checkBlobDataFileExists(versionedHash)) {
        return Promise.resolve();
      }

      const blobfilePath = this.#buildBlobDataFilePath(versionedHash);

      return fs.promises.writeFile(blobfilePath, data, { encoding: "utf-8" });
    } catch (err) {
      throw new Error(
        `Couldn't store blob ${versionedHash} data on filesystem: ${err}`
      );
    }
  }

  async readBlobDataFile(versionedHash: string) {
    const blobFilePath = this.#buildBlobDataFilePath(versionedHash);

    try {
      const blobData = await fs.promises.readFile(blobFilePath, "utf-8");

      return blobData;
    } catch (error) {
      throw new Error(
        `Couldn't read blob ${versionedHash} data file: file is missing`
      );
    }
  }

  async removeBlobDataFile(versionedHash: string) {
    try {
      await fs.promises.unlink(this.#buildBlobDataFilePath(versionedHash));
    } catch (err) {
      throw new Error(
        `Couldn't remove blob ${versionedHash} data file: ${err}`
      );
    }
  }

  #buildBlobDataFilePath(versionedHash: string) {
    return path.join(this.#blobDirPath, `${versionedHash}.txt`);
  }
}
