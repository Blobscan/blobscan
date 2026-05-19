import { CID } from "multiformats/cid";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { ErrorException } from "@blobscan/errors";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2; // 3 attempts total
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
export const MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB — generous vs 128 KiB blob size

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidCid(value: string): boolean {
  try {
    CID.parse(value);
    return true;
  } catch {
    return false;
  }
}

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

// fetch rejects with a TypeError on network failure and with an AbortError /
// TimeoutError DOMException when the timeout signal fires. All of these are
// transient and safe to retry, so surface them as retryable gateway errors
// instead of letting them escape as opaque generic errors.
function toGatewayError(err: unknown): IpfsGatewayError {
  const name = (err as { name?: string })?.name;
  const isTimeout = name === "TimeoutError" || name === "AbortError";
  const message = (err as Error)?.message ?? String(err);

  return new IpfsGatewayError(
    isTimeout
      ? `IPFS gateway request timed out: ${message}`
      : `IPFS gateway request failed: ${message}`,
    0,
    true
  );
}

async function readBoundedBody(
  response: Response,
  maxBytes: number
): Promise<ArrayBuffer> {
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new Error(`Response too large: exceeded ${maxBytes} bytes`);
    }
    return buffer;
  }

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
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

export class IpfsStorage extends BlobStorage {
  protected readonly gatewayUrl: string;
  protected readonly timeoutMs: number;
  protected readonly maxRetries: number;
  protected readonly retryBaseDelayMs: number;

  protected constructor({
    chainId,
    gatewayUrl,
    timeoutMs,
    maxRetries,
    retryBaseDelayMs,
  }: IpfsStorageConfig) {
    super(BlobStorageName.IPFS, chainId);
    this.gatewayUrl = gatewayUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryBaseDelayMs = retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  }

  protected async _healthCheck(): Promise<void> {
    // bafkqaaa is the empty identity block: every spec-compliant gateway can
    // serve it without a DHT lookup, so a successful GET is a representative
    // liveness probe. HEAD is avoided because some gateways reject it (405),
    // which a status-only check would silently treat as healthy.
    const response = await fetch(`${this.gatewayUrl}/ipfs/bafkqaaa`, {
      headers: { Accept: "application/octet-stream" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    // Drain the body so the connection can be reused / released.
    await response.body?.cancel();

    if (!response.ok) {
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
    if (!isValidCid(baseCid)) {
      throw new Error(`Invalid IPFS CID: "${uri}"`);
    }

    const buffer = await this.#fetchWithRetries(uri);

    return fileType === "text"
      ? new TextDecoder().decode(buffer)
      : bytesToHex(buffer);
  }

  // Retries transient gateway failures (5xx, 429, network errors, timeouts)
  // with exponential backoff. Permanent failures (4xx other than 429,
  // oversized responses) are surfaced immediately without retrying.
  async #fetchWithRetries(uri: string): Promise<ArrayBuffer> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.#fetchBlobOnce(uri);
      } catch (err) {
        const isRetryable =
          err instanceof IpfsGatewayError && err.retryable;

        if (!isRetryable || attempt >= this.maxRetries) {
          throw err;
        }

        await sleep(this.retryBaseDelayMs * 2 ** attempt);
      }
    }
  }

  async #fetchBlobOnce(uri: string): Promise<ArrayBuffer> {
    let response: Response;
    try {
      // Request the deserialized file bytes explicitly: without an Accept
      // header a gateway may return an HTML directory listing or apply
      // content negotiation, yielding non-deterministic payloads.
      response = await fetch(`${this.gatewayUrl}/ipfs/${uri}`, {
        headers: { Accept: "application/octet-stream" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      throw toGatewayError(err);
    }

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

    try {
      return await readBoundedBody(response, MAX_RESPONSE_BYTES);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "TimeoutError" || name === "AbortError") {
        throw toGatewayError(err);
      }
      throw err;
    }
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
