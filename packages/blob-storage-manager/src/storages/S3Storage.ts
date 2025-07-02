import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import type { S3ClientConfig } from "@aws-sdk/client-s3";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

export interface S3StorageConfig extends BlobStorageConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName: string;
  endpoint?: string;
}

export class S3Storage extends BlobStorage {
  private _s3Client: S3Client;
  private _bucketName: string;

  protected constructor({
    chainId,
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
  }: S3StorageConfig) {
    // @ts-expect-error - S3 will be added to the BlobStorageName enum after Prisma migration
    super(BlobStorageName.S3, chainId);

    try {
      const clientConfig: S3ClientConfig = {
        region,
      };

      if (accessKeyId && secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId,
          secretAccessKey,
        };
      }

      if (endpoint) {
        clientConfig.endpoint = endpoint;
      }

      this._s3Client = new S3Client(clientConfig);
      this._bucketName = bucketName;
    } catch (err) {
      throw new Error("Failed to create S3 storage client", {
        cause: err,
      });
    }
  }

  protected async _healthCheck() {
    try {
      // Check if the bucket exists and is accessible
      await this._s3Client.send(
        new HeadBucketCommand({ Bucket: this._bucketName })
      );
    } catch (err) {
      throw new Error(
        `Bucket ${this._bucketName} does not exist or is not accessible`,
        {
          cause: err,
        }
      );
    }
  }

  protected async _getBlob(uri: string, { fileType }: GetBlobOpts) {
    const command = new GetObjectCommand({
      Bucket: this._bucketName,
      Key: uri,
    });

    const response = await this._s3Client.send(command);

    if (!response.Body) {
      throw new Error(`Failed to get blob content from ${uri}`);
    }

    // Convert the readable stream to a buffer
    const chunks: Uint8Array[] = [];
    // @ts-expect-error - Body is a ReadableStream
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return fileType === "text" ? buffer.toString() : bytesToHex(buffer);
  }

  protected async _removeBlob(uri: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this._bucketName,
      Key: uri,
    });

    await this._s3Client.send(command);
  }

  protected async _storeBlob(
    versionedHash: string,
    data: Buffer
  ): Promise<string> {
    const blobUri = this.getBlobUri(versionedHash);

    const command = new PutObjectCommand({
      Bucket: this._bucketName,
      Key: blobUri,
      Body: data,
      ContentType: "application/octet-stream",
    });

    await this._s3Client.send(command);

    return blobUri;
  }

  getBlobUri(hash: string) {
    return `${this.chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.bin`;
  }

  static async create(config: S3StorageConfig) {
    try {
      const storage = new S3Storage(config);

      await storage.healthCheck();

      return storage;
    } catch (err) {
      const err_ = err as Error;

      throw new StorageCreationError(
        this.name,
        err_.message,
        err_.cause as Error
      );
    }
  }
}
