import { equals as bytesEquals } from "multiformats/bytes";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { logger } from "@blobscan/logger";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import {
  BlobIntegrityError,
  BlobTooLargeError,
  IpfsGatewayError,
  InvalidBlobCidError,
  StorageCreationError,
} from "../errors";
import { recordIpfsGatewayAttempt } from "../instrumentation";
import type { BlobContext } from "../types";
import { bytesToHex } from "../utils";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2; // 3 attempts total
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
// Cap any server-supplied Retry-After so a misbehaving gateway can't park a
// request for minutes; 30 s is well past the longest realistic rate-limit
// window for the gated gateways we target.
const MAX_RETRY_AFTER_MS = 30_000;
export const MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB — generous vs 128 KiB blob size

// multicodec code for the `raw` IPLD codec — the only codec under which the
// CID's multihash is the digest of the response bytes verbatim. For other
// codecs (e.g. dag-pb 0x70) the digest is of the encoded IPLD block, so a
// bytes==digest comparison would be meaningless.
const RAW_CODEC = 0x55;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The dataCid is content-addressed: for the raw codec the CID is the
// sha2-256 of the block bytes. Recomputing it locally turns the (possibly
// untrusted) gateway into a dumb transport — a buggy or malicious gateway
// cannot substitute different bytes without the check failing.
//
// Fails closed: any CID shape we cannot verify (non-raw codec or non-sha256
// multihash) is rejected outright instead of returning unverified bytes,
// because the entire trust model of this storage assumes a successful local
// verification.
async function assertMatchesCid(cid: CID, bytes: Uint8Array): Promise<void> {
  if (cid.code !== RAW_CODEC) {
    throw new InvalidBlobCidError(
      `${cid.toString()} (unsupported codec 0x${cid.code.toString(
        16
      )}, expected raw 0x55)`
    );
  }
  if (cid.multihash.code !== sha256.code) {
    throw new InvalidBlobCidError(
      `${cid.toString()} (unsupported multihash 0x${cid.multihash.code.toString(
        16
      )}, expected sha2-256 0x12)`
    );
  }

  const { digest } = await sha256.digest(bytes);

  if (!bytesEquals(digest, cid.multihash.digest)) {
    throw new BlobIntegrityError(cid.toString());
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

// Retry-After is either delta-seconds or an HTTP-date (RFC 7231). Parse both,
// reject negatives/NaN, and clamp to MAX_RETRY_AFTER_MS so the gateway can't
// stall a caller arbitrarily.
function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;

  const trimmed = headerValue.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds)) {
    if (seconds <= 0) return undefined;
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  }

  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) {
    const delta = dateMs - Date.now();
    if (delta <= 0) return undefined;
    return Math.min(delta, MAX_RETRY_AFTER_MS);
  }

  return undefined;
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
    // Without a streaming reader we cannot bound memory usage while reading —
    // calling arrayBuffer() would buffer the full response before any size
    // check could trip. Fail closed instead of trusting the gateway not to
    // ship an oversized payload.
    await response.body?.cancel().catch(() => undefined);
    throw new IpfsGatewayError(
      "IPFS gateway response body is not streamable; cannot enforce size limit",
      response.status,
      false
    );
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    for (
      let read = await reader.read();
      !read.done;
      read = await reader.read()
    ) {
      const { value } = read;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new BlobTooLargeError(totalBytes, maxBytes);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
    await response.body?.cancel().catch(() => undefined);
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

export interface IpfsStorageConfig extends BlobStorageConfig {
  /** Read gateway for fetching blobs by CID (an IPFS HTTP gateway). */
  gatewayUrl: string;
  /**
   * Base URL of the blobscan-ipld service's write API (POST /blob). Distinct from
   * the read `gatewayUrl`; required only when storing blobs (IPFS as a writable
   * storage).
   */
  ipldUrl?: string;
  /** Optional bearer token for gated gateways (e.g. Filebase, Infura). */
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  /**
   * When false, a failed gateway health-check at construction is logged but
   * does not prevent the storage from being created — the gateway may be
   * transiently down, and per-request retries plus storage-level fallback
   * recover once it's reachable again. Defaults to true (fail fast on an
   * unreachable gateway).
   */
  verifyGatewayOnInit?: boolean;
}

export class IpfsStorage extends BlobStorage {
  protected readonly gatewayUrl: string;
  protected readonly ipldUrl?: string;
  protected readonly apiKey?: string;
  protected readonly timeoutMs: number;
  protected readonly maxRetries: number;
  protected readonly retryBaseDelayMs: number;

  protected constructor({
    chainId,
    gatewayUrl,
    ipldUrl,
    apiKey,
    timeoutMs,
    maxRetries,
    retryBaseDelayMs,
  }: IpfsStorageConfig) {
    super(BlobStorageName.IPFS, chainId);
    this.gatewayUrl = gatewayUrl.replace(/\/$/, "");
    this.ipldUrl = ipldUrl?.replace(/\/$/, "");
    // Treat empty/whitespace-only keys as absent: a `Bearer ` header with no
    // token is rejected by most gated gateways and would mask a misconfigured
    // env var as a generic 401.
    const trimmedKey = apiKey?.trim();
    this.apiKey = trimmedKey ? trimmedKey : undefined;
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

  #authHeaders(): Record<string, string> {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }

  protected async _healthCheck(): Promise<void> {
    // When a write API is configured, the blobscan-ipld service is the
    // component that owns the kubo client and the write path, so its /readyz
    // (which pings kubo) is the representative health probe for this storage.
    if (this.ipldUrl) {
      const response = await fetch(`${this.ipldUrl}/readyz`, {
        headers: this.#authHeaders(),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      // Drain the body so the connection can be reused / released.
      await response.body?.cancel().catch(() => undefined);

      if (!response.ok) {
        throw new Error(
          `blobscan-ipld service /readyz returned ${response.status} ${response.statusText}`
        );
      }
      return;
    }

    // Read-only deployment (gateway only, no blobscan-ipld API): probe the read gateway.
    // bafkqaaa is the empty identity block: every spec-compliant gateway can
    // serve it without a DHT lookup, so a successful GET is a representative
    // liveness probe. HEAD is avoided because some gateways reject it (405),
    // which a status-only check would silently treat as healthy.
    const response = await fetch(`${this.gatewayUrl}/ipfs/bafkqaaa`, {
      headers: this.#requestHeaders(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    // Drain the body so the connection can be reused / released.
    await response.body?.cancel().catch(() => undefined);

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
          status: (err as IpfsGatewayError).status,
          durationMs: 0,
        });

        // Prefer a server-supplied Retry-After (rate-limit hint) over our own
        // backoff: if the gateway tells us how long to wait we should respect
        // it instead of piling on retries that will be rejected again.
        const backoffMs =
          this.retryBaseDelayMs * 2 ** attempt * (0.5 + Math.random() * 0.5);
        const retryAfterMs = (err as IpfsGatewayError).retryAfterMs;
        await sleep(retryAfterMs ?? backoffMs);
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
      const retryAfterMs = retryable
        ? parseRetryAfter(response.headers.get("retry-after"))
        : undefined;
      recordIpfsGatewayAttempt({
        outcome: "gateway_error",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new IpfsGatewayError(
        `Failed to retrieve blob: ${response.status} ${response.statusText}`,
        response.status,
        retryable,
        retryAfterMs
      );
    }

    // Fast-path: reject before streaming when Content-Length is known.
    // A malformed header parses as NaN, which fails every numeric comparison
    // silently — parse explicitly and fall through to the streaming cap when
    // the value is not a usable integer.
    const contentLengthHeader = response.headers.get("content-length");
    const contentLength = contentLengthHeader
      ? Number.parseInt(contentLengthHeader, 10)
      : NaN;
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      recordIpfsGatewayAttempt({
        outcome: "too_large",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new BlobTooLargeError(contentLength, MAX_RESPONSE_BYTES);
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

  // Pushes a blob to the blobscan-ipld service, which runs the IPLD pipeline and
  // returns the content-addressed CID of the raw blob (`data_cid`). That CID is
  // what we persist as the dataReference and later resolve via _getBlob.
  //
  // The full beacon/execution context is required: the node needs commitment,
  // slot, epoch, etc. to build its per-epoch DAG. Unlike reads, this can't fall
  // back to deriving anything from the versioned hash, so a missing context is
  // a programming error and fails loudly.
  //
  // `finalize` is always false: it instructs the node to build the EpochNode
  // immediately, which is only correct once every blob of an epoch is stored.
  // Blobscan indexes block-by-block and can't know an epoch is complete here,
  // so finalization is left to the node (out-of-band) rather than guessed per
  // blob.
  protected async _storeBlob(
    hash: string,
    data: Buffer,
    context?: BlobContext
  ): Promise<string> {
    if (!this.ipldUrl) {
      throw new Error(
        '"storeBlob" requires a configured IPFS write API URL (IPFS_STORAGE_IPLD_URL)'
      );
    }

    if (!context) {
      throw new Error(
        '"storeBlob" requires blob context (commitment, slot, epoch, …) for the IPFS push endpoint'
      );
    }

    const body = JSON.stringify({
      commitment: context.commitment,
      versioned_hash: hash,
      data: bytesToHex(data),
      tx_hash: context.txHash,
      block_number: context.blockNumber,
      block_hash: context.blockHash,
      slot: context.slot,
      epoch: context.epoch,
      index: context.index,
      finalize: false,
    });

    return this.#pushBlobWithRetries(body);
  }

  // Mirrors #fetchWithRetries: retry transient failures (5xx, 429, network
  // errors, timeouts) with exponential backoff; surface permanent failures
  // immediately.
  async #pushBlobWithRetries(body: string): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.#pushBlobOnce(body);
      } catch (err) {
        const isRetryable = err instanceof IpfsGatewayError && err.retryable;

        if (!isRetryable || attempt >= this.maxRetries) {
          throw err;
        }

        recordIpfsGatewayAttempt({
          outcome: "retry",
          status: (err as IpfsGatewayError).status,
          durationMs: 0,
        });

        const backoffMs =
          this.retryBaseDelayMs * 2 ** attempt * (0.5 + Math.random() * 0.5);
        const retryAfterMs = (err as IpfsGatewayError).retryAfterMs;
        await sleep(retryAfterMs ?? backoffMs);
      }
    }
  }

  async #pushBlobOnce(body: string): Promise<string> {
    const startedAt = Date.now();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.ipldUrl}/blob`, {
        method: "POST",
        headers,
        body,
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
      const retryAfterMs = retryable
        ? parseRetryAfter(response.headers.get("retry-after"))
        : undefined;
      // Surface the service's `{ "error": "…" }` message when present; it pinpoints
      // validation failures (missing field, bad hex) far better than the status.
      const detail = await response
        .text()
        .then((text) => {
          try {
            return (JSON.parse(text) as { error?: string }).error ?? text;
          } catch {
            return text;
          }
        })
        .catch(() => "");
      recordIpfsGatewayAttempt({
        outcome: "gateway_error",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new IpfsGatewayError(
        `Failed to store blob: ${response.status} ${response.statusText}${
          detail ? ` - ${detail}` : ""
        }`,
        response.status,
        retryable,
        retryAfterMs
      );
    }

    let dataCid: string | undefined;
    try {
      ({ data_cid: dataCid } = (await response.json()) as {
        data_cid?: string;
      });
    } catch (err) {
      recordIpfsGatewayAttempt({
        outcome: "gateway_error",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new IpfsGatewayError(
        `Failed to parse store response: ${(err as Error).message}`,
        response.status,
        false
      );
    }

    if (!dataCid) {
      recordIpfsGatewayAttempt({
        outcome: "gateway_error",
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new IpfsGatewayError(
        "Store response did not include a data_cid",
        response.status,
        false
      );
    }

    // Fail closed on a malformed CID rather than persisting a reference that
    // _getBlob could never parse or verify.
    try {
      CID.parse(dataCid);
    } catch {
      throw new InvalidBlobCidError(dataCid);
    }

    recordIpfsGatewayAttempt({
      outcome: "success",
      status: response.status,
      durationMs: Date.now() - startedAt,
    });

    return dataCid;
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
    const storage = new IpfsStorage(config);

    try {
      await storage.healthCheck();
    } catch (err) {
      const err_ = err as Error;

      // Fail fast only when the caller opted into upfront verification.
      // Otherwise register the storage despite an unreachable gateway: a
      // transient boot-time outage shouldn't disable IPFS for the process
      // lifetime, and reads recover via per-request retries and fallback.
      if (config.verifyGatewayOnInit ?? true) {
        throw new StorageCreationError(
          this.name,
          err_.message,
          err_.cause as Error
        );
      }

      logger.warn(
        `IPFS gateway health-check failed at startup; registering storage anyway: ${err_.message}`
      );
    }

    return storage;
  }
}
