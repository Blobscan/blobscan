import { ErrorException } from "@blobscan/errors";

export class IpfsGatewayError extends ErrorException {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
    public readonly retryAfterMs?: number
  ) {
    super(message);
  }
}

export class BlobTooLargeError extends ErrorException {
  constructor(bytes: number, max: number) {
    super(`Response too large: ${bytes} bytes exceeds limit of ${max} bytes`);
  }
}

export class InvalidBlobCidError extends ErrorException {
  constructor(uri: string) {
    super(`Invalid IPFS CID: "${uri}"`);
  }
}

export class BlobIntegrityError extends ErrorException {
  constructor(cid: string) {
    super(
      `IPFS content integrity check failed: bytes do not match CID "${cid}"`
    );
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
