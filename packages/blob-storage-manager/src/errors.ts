class ErrorException extends Error {
  constructor(message: string, cause?: Error | Error[]) {
    super(message, {
      cause,
    });

    this.name = this.constructor.name;
  }
}

export class BlobStorageError extends ErrorException {
  constructor(storageName: string, message: string, cause?: Error) {
    super(`${storageName} failed: ${message}`, cause);
  }
}

export class StorageCreationError extends BlobStorageError {
  cause: BlobStorageError;

  constructor(storageName: string, message: string, cause: BlobStorageError) {
    super(storageName, `Creation failed: ${message}`);

    this.cause = cause;
  }
}

export class BlobStorageManagerError extends ErrorException {
  constructor(message: string, cause?: Error | BlobStorageError[]) {
    // const storageErrorsMessage = storageErrors?.length
    //   ? `Failed storages: ${storageErrors.map((e) => e.message).join(", ")}`
    //   : "";
    super(message, cause);
  }
}
