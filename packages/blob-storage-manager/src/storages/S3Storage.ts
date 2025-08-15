import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import type { S3ClientConfig } from "@aws-sdk/client-s3";
import { Readable } from "stream";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage, STAGING_BLOB_URI_PREFIX } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

export interface S3StorageConfig extends BlobStorageConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export class S3Storage extends BlobStorage {
  protected _s3Client: S3Client;
  protected _bucketName: string;

  protected constructor({
    chainId,
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    forcePathStyle,
  }: S3StorageConfig) {
    super(BlobStorageName.S3, chainId);

    try {
      const clientConfig: S3ClientConfig = {
        region,
        forcePathStyle,
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

    const buffer = await this._toBuffer(response.Body);

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

    await this._uploadBlob(blobUri, data);

    return blobUri;
  }

  protected async _stageBlob(hash: string, data: Buffer): Promise<string> {
    const blobUri = `${STAGING_BLOB_URI_PREFIX}/${hash}`;

    await this._uploadBlob(blobUri, data);

    return blobUri;
  }

  protected async _uploadBlob(uri: string, data: Buffer) {
    const command = new PutObjectCommand({
      Bucket: this._bucketName,
      Key: uri,
      Body: data,
      ContentType: "application/octet-stream",
      ACL: "public-read",
    });

    await this._s3Client.send(command);
  }

  protected async _toBuffer(
    payload: Buffer | Blob | ReadableStream | Readable
  ): Promise<Buffer> {
    if (!payload) {
      throw new Error("No payload provided");
    }

    if (Buffer.isBuffer(payload)) {
      return payload;
    }

    if (payload instanceof Uint8Array) {
      return Buffer.from(payload);
    }

    if (typeof Blob !== "undefined" && payload instanceof Blob) {
      const arrayBuffer = await payload.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    if (payload instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of payload) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from([chunk]));
      }
      return Buffer.concat(chunks);
    }

    throw new Error("Unsupported payload type");
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
