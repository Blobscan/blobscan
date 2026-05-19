import { ErrorException } from "@blobscan/errors";

export class BlobTooLargeError extends Error {
  constructor(bytes: number, max: number) {
    super(`Response too large: ${bytes} bytes exceeds limit of ${max} bytes`);
    this.name = "BlobTooLargeError";
  }
}

export class InvalidBlobCidError extends Error {
  constructor(uri: string) {
    super(`Invalid IPFS CID: "${uri}"`);
    this.name = "InvalidBlobCidError";
  }
}

export class BlobStorageError extends ErrorException {
  constructor(storageName: string, message: string, cause?: Error) {
    super(`${storageName} failed: ${message}`, cause);
  }
}

export class StorageCreationError extends BlobStorageError {
  constructor(storageName: string, message: string, cause: Error) {
    super(
      storageName,
      `Creation failed${message.length ? `: ${message}` : ""}`,
      cause
    );
  }
}

export class BlobStorageManagerError extends ErrorException {
  constructor(message: string, cause?: Error | BlobStorageError[]) {
    super(message, cause);
  }
}
