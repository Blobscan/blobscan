import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { ErrorException } from "@blobscan/errors";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

const DEFAULT_TIMEOUT_MS = 30_000;
export const MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB — generous vs 128 KiB blob size

// CIDv1 base32lower (bafy/bafk…) or CIDv0 base58btc (Qm…)
const CID_PATTERN =
  /^(bafy|bafk)[a-z2-7]{50,}$|^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

export class IpfsGatewayError extends ErrorException {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean
  ) {
    super(message);
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

async function readBoundedBody(
  response: Response,
  maxBytes: number
): Promise<ArrayBuffer> {
  const reader = response.body?.getReader();
  if (!reader) return response.arrayBuffer();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      reader.releaseLock();
      await response.body?.cancel();
      throw new Error(`Response too large: exceeded ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  reader.releaseLock();

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

export interface IpfsStorageConfig extends BlobStorageConfig {
  gatewayUrl: string;
  timeoutMs?: number;
}

export class IpfsStorage extends BlobStorage {
  protected readonly gatewayUrl: string;
  protected readonly timeoutMs: number;

  protected constructor({ chainId, gatewayUrl, timeoutMs }: IpfsStorageConfig) {
    super(BlobStorageName.IPFS, chainId);
    this.gatewayUrl = gatewayUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  protected async _healthCheck(): Promise<void> {
    const response = await fetch(`${this.gatewayUrl}/ipfs/bafkqaaa`, {
      method: "HEAD",
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (response.status >= 500) {
      throw new Error(
        `Gateway returned ${response.status} ${response.statusText}`
      );
    }
  }

  protected async _getBlob(
    uri: string,
    { fileType }: GetBlobOpts = {}
  ): Promise<string> {
    const baseCid = uri.includes(".") ? uri.slice(0, uri.lastIndexOf(".")) : uri;
    if (!CID_PATTERN.test(baseCid)) {
      throw new Error(`Invalid IPFS CID: "${uri}"`);
    }

    const response = await fetch(`${this.gatewayUrl}/ipfs/${uri}`, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const retryable = isRetryableStatus(response.status);
      throw new IpfsGatewayError(
        `Failed to retrieve blob: ${response.status} ${response.statusText}`,
        response.status,
        retryable
      );
    }

    // Fast-path: reject before streaming when Content-Length is known
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new Error(
        `Response too large: ${contentLength} bytes (max ${MAX_RESPONSE_BYTES})`
      );
    }

    const buffer = await readBoundedBody(response, MAX_RESPONSE_BYTES);

    return fileType === "text"
      ? new TextDecoder().decode(buffer)
      : bytesToHex(buffer);
  }

  protected async _storeBlob(_: string, __: Buffer): Promise<string> {
    throw new Error(
      '"storeBlob" is not supported: IPFS references are registered externally by blobscan-ipld'
    );
  }

  protected async _removeBlob(_: string): Promise<void> {
    throw new Error('"removeBlob" is not supported: IPFS content is immutable');
  }

  // getBlobUri intentionally not overridden: IPFS cannot resolve blobs by
  // versioned hash without IPLD traversal (see TODO in git history).
  // TODO: Implement IPLD DAG traversal to resolve blobs by versioned hash.
  // The metaReference (metaCid) stored alongside dataCid contains the IPLD node
  // linking versionedHash → dataCid. Future work: traverse epoch → slot → blob
  // using IPLD linked data to enable getBlobByHash support.

  static async create(config: IpfsStorageConfig): Promise<IpfsStorage> {
    try {
      const storage = new IpfsStorage(config);

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
