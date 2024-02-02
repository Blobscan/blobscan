import fs from "fs";
import path from "path";

import type { Blob } from "./types";

export type BlobFileManagerConfig = {
  basePath: string;
  folderName: string;
};

export class BlobFileManager {
  #blobFolderPath: string;

  constructor({
    basePath = __dirname,
    folderName = "eip4844-blobs",
  }: Partial<BlobFileManagerConfig> = {}) {
    this.#blobFolderPath = path.join(basePath, folderName);

    if (!fs.existsSync(this.#blobFolderPath)) {
      fs.mkdirSync(this.#blobFolderPath);
    }
  }

  checkFileExists(versionedHash: string) {
    const path = this.#buildFilePath(versionedHash);

    return fs.promises
      .access(path, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  async createFile({ data, versionedHash }: Blob) {
    try {
      if (await this.checkFileExists(versionedHash)) {
        return Promise.resolve();
      }

      const blobfilePath = this.#buildFilePath(versionedHash);

      return fs.promises.writeFile(blobfilePath, data, { encoding: "utf-8" });
    } catch (err) {
      throw new Error(
        `Couldn't store blob ${versionedHash} data on filesystem: ${err}`
      );
    }
  }

  async readFile(versionedHash: string) {
    const blobFilePath = this.#buildFilePath(versionedHash);

    try {
      const blobData = await fs.promises.readFile(blobFilePath, "utf-8");

      return blobData;
    } catch (error) {
      throw new Error(
        `Couldn't read blob ${versionedHash} data file: file is missing`
      );
    }
  }

  async removeFile(versionedHash: string) {
    try {
      await fs.promises.unlink(this.#buildFilePath(versionedHash));
    } catch (err) {
      throw new Error(
        `Couldn't remove blob ${versionedHash} data file: ${err}`
      );
    }
  }

  async removeFolder() {
    return fs.promises.rm(this.#blobFolderPath, {
      recursive: true,
    });
  }

  #buildFilePath(versionedHash: string) {
    return path.join(this.#blobFolderPath, `${versionedHash}.txt`);
  }
}
