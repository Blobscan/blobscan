import { equals as bytesEquals } from "multiformats/bytes";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { ErrorException } from "@blobscan/errors";
import { logger } from "@blobscan/logger";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { BlobTooLargeError, InvalidBlobCidError, StorageCreationError } from "../errors";
import { recordIpfsGatewayAttempt } from "../instrumentation";
import { bytesToHex } from "../utils";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2; // 3 attempts total
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
export const MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB — generous vs 128 KiB blob size

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The dataCid is content-addressed: for the raw codec the CID is the
// sha2-256 of the block bytes. Recomputing it locally turns the (possibly
// untrusted) gateway into a dumb transport — a buggy or malicious gateway
// cannot substitute different bytes without the check failing.
async function assertMatchesCid(cid: CID, bytes: Uint8Array): Promise<void> {
  if (cid.multihash.code !== sha256.code) {
    // blobscan-ipld always uses sha2-256; skip rather than risk a false
    // negative if some other multihash is ever encountered, but surface it:
    // it means an unexpected CID shape slipped through and the bytes were
    // returned unverified.
    logger.error(
      `IPFS integrity check skipped for CID "${cid.toString()}": unsupported multihash code ${
        cid.multihash.code
      } (expected sha2-256 ${sha256.code}); bytes returned unverified`
    );
    return;
  }

  const { digest } = await sha256.digest(bytes);

  if (!bytesEquals(digest, cid.multihash.digest)) {
    throw new Error(
      `IPFS content integrity check failed: bytes do not match CID "${cid.toString()}"`
    );
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
      throw new BlobTooLargeError(buffer.byteLength, maxBytes);
    }
    return buffer;
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    const { value } = read;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      reader.releaseLock();
      await response.body?.cancel();
      throw new BlobTooLargeError(totalBytes, maxBytes);
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
  /** Optional bearer token for gated gateways (e.g. Filebase, Infura). */
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

export class IpfsStorage extends BlobStorage {
  protected readonly gatewayUrl: string;
  protected readonly apiKey?: string;
  protected readonly timeoutMs: number;
  protected readonly maxRetries: number;
  protected readonly retryBaseDelayMs: number;

  protected constructor({
    chainId,
    gatewayUrl,
    apiKey,
    timeoutMs,
    maxRetries,
    retryBaseDelayMs,
  }: IpfsStorageConfig) {
    super(BlobStorageName.IPFS, chainId);
    this.gatewayUrl = gatewayUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryBaseDelayMs = retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  }

  #requestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      // Ask for the verbatim block, not a gateway-deserialized
      // representation: combined with `?format=raw` this guarantees the
      // response is exactly the bytes the CID addresses, so the integrity
      // check is meaningful and the payload is deterministic.
      Accept: "application/vnd.ipld.raw",
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  protected async _healthCheck(): Promise<void> {
    // bafkqaaa is the empty identity block: every spec-compliant gateway can
    // serve it without a DHT lookup, so a successful GET is a representative
    // liveness probe. HEAD is avoided because some gateways reject it (405),
    // which a status-only check would silently treat as healthy.
    const response = await fetch(`${this.gatewayUrl}/ipfs/bafkqaaa`, {
      headers: this.#requestHeaders(),
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

  protected async _getBlob(uri: string): Promise<string> {
    let cid: CID;
    try {
      cid = CID.parse(uri);
    } catch {
      throw new InvalidBlobCidError(uri);
    }

    const buffer = await this.#fetchWithRetries(uri);

    try {
      await assertMatchesCid(cid, new Uint8Array(buffer));
    } catch (err) {
      recordIpfsGatewayAttempt({
        outcome: "integrity_failure",
        status: 200,
        durationMs: 0,
      });
      throw err;
    }

    return bytesToHex(buffer);
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

        // The failed attempt was already recorded as gateway_error/network_error;
        // mark a separate "retry" tick so dashboards can count retry pressure
        // without double-counting outcomes.
        recordIpfsGatewayAttempt({
          outcome: "retry",
          status: err instanceof IpfsGatewayError ? err.status : 0,
          durationMs: 0,
        });

        await sleep(this.retryBaseDelayMs * 2 ** attempt);
      }
    }
  }

  async #fetchBlobOnce(uri: string): Promise<ArrayBuffer> {
    const startedAt = Date.now();
    let response: Response;
    try {
      // `?format=raw` (+ the `application/vnd.ipld.raw` Accept header) asks
      // the gateway for the verbatim block addressed by the CID, never a
      // deserialized view or HTML directory listing. This keeps the payload
      // deterministic and locally verifiable against the CID.
      response = await fetch(`${this.gatewayUrl}/ipfs/${uri}?format=raw`, {
        headers: this.#requestHeaders(),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      const gatewayErr = toGatewayError(err);
      recordIpfsGatewayAttempt({
        outcome: "network_error",
        status: 0,
        durationMs: Date.now() - startedAt,
      });
      throw gatewayErr;
    }

    if (!response.ok) {
      const retryable = isRetryableStatus(response.status);
      recordIpfsGatewayAttempt({
        outcome: "gateway_error",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new IpfsGatewayError(
        `Failed to retrieve blob: ${response.status} ${response.statusText}`,
        response.status,
        retryable
      );
    }

    // Fast-path: reject before streaming when Content-Length is known
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      recordIpfsGatewayAttempt({
        outcome: "too_large",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new BlobTooLargeError(Number(contentLength), MAX_RESPONSE_BYTES);
    }

    try {
      const buffer = await readBoundedBody(response, MAX_RESPONSE_BYTES);
      recordIpfsGatewayAttempt({
        outcome: "success",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return buffer;
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "TimeoutError" || name === "AbortError") {
        recordIpfsGatewayAttempt({
          outcome: "network_error",
          status: response.status,
          durationMs: Date.now() - startedAt,
        });
        throw toGatewayError(err);
      }
      recordIpfsGatewayAttempt({
        outcome: err instanceof BlobTooLargeError ? "too_large" : "gateway_error",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
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

  // getBlobUri intentionally not overridden: there is no deterministic
  // versioned-hash → CID mapping, so a versioned hash can only be resolved
  // via a DB lookup of the stored, content-addressed dataReference (the raw
  // blob's dataCid). That lookup happens at the DB-aware layer (the API),
  // which then calls getBlob(dataCid) directly — no IPLD DAG traversal is
  // required because the dataCid already addresses the raw blob bytes.

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
