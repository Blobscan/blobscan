export class RpcDataError extends Error {}

export type RpcCall = (method: string, params: unknown[]) => Promise<unknown>;

type PendingCall = {
  id: number;
  method: string;
  params: unknown[];
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export function createRpc(url: string, attempts = 5, batchSize = 20): RpcCall {
  if (attempts < 1 || batchSize < 1)
    throw new Error("Invalid RPC batch options");
  let id = 0;
  const queue: PendingCall[] = [];
  let running = false;

  async function send(calls: PendingCall[]) {
    let pending = calls;
    for (let attempt = 1; pending.length && attempt <= attempts; attempt++) {
      let retryAfter = 0;
      let reason = "RPC request failed";
      try {
        console.log(
          `RPC batch: ${pending.length} calls; attempt ${attempt}/${attempts}.`
        );
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            pending.map(({ id, method, params }) => ({
              jsonrpc: "2.0",
              id,
              method,
              params,
            }))
          ),
          signal: AbortSignal.timeout(30_000),
        });
        const retryHeader = response.headers.get("retry-after");
        if (retryHeader) {
          retryAfter = /^\d+(?:\.\d+)?$/.test(retryHeader)
            ? Number(retryHeader) * 1000
            : Math.max(0, Date.parse(retryHeader) - Date.now());
          if (!Number.isFinite(retryAfter)) retryAfter = 0;
        }
        if (response.status === 429) reason = "Rate limit";
        if (!response.ok) throw new RpcDataError(reason);
        const body: unknown = await response.json();
        if (!Array.isArray(body)) {
          const error = object(body).error;
          if (
            error &&
            /rate|limit|too many/i.test(String(object(error).message))
          )
            reason = "Rate limit";
          throw new RpcDataError(reason);
        }
        const responses = new Map<number, Record<string, unknown>>();
        const expected = new Set(pending.map((call) => call.id));
        for (const raw of body) {
          const item = object(raw);
          if (
            typeof item.id !== "number" ||
            !expected.has(item.id) ||
            responses.has(item.id)
          ) {
            throw new RpcDataError("Invalid RPC response IDs");
          }
          responses.set(item.id, item);
        }
        const retry: PendingCall[] = [];
        for (const call of pending) {
          const item = responses.get(call.id);
          if (item && !item.error && item.result !== undefined) {
            call.resolve(item.result);
          } else {
            if (
              item?.error &&
              /rate|limit|too many/i.test(String(object(item.error).message))
            )
              reason = "Rate limit";
            retry.push(call);
          }
        }
        pending = retry;
      } catch {
        // Do not print the URL or response body. They can contain credentials.
      }
      if (!pending.length) break;
      if (attempt === attempts) {
        for (const call of pending)
          call.reject(
            new RpcDataError(`${call.method} failed after ${attempts} attempts`)
          );
        break;
      }
      const delay = Math.max(
        retryAfter,
        Math.min(30_000, 1000 * 2 ** (attempt - 1)) +
          Math.floor(Math.random() * 250)
      );
      console.warn(
        `${reason}; retrying ${pending.length} RPC calls in ${Math.ceil(
          delay / 1000
        )}s.`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  async function drain() {
    while (queue.length) await send(queue.splice(0, batchSize));
    running = false;
  }

  return (method, params) =>
    new Promise((resolve, reject) => {
      queue.push({ id: ++id, method, params, resolve, reject });
      if (!running) {
        running = true;
        queueMicrotask(() => {
          void drain();
        });
      }
    });
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RpcDataError("RPC data is unavailable or invalid");
  }
  return value as Record<string, unknown>;
}

function quantity(value: unknown): bigint {
  if (
    typeof value !== "string" ||
    !/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(value)
  ) {
    throw new RpcDataError("Invalid RPC quantity");
  }
  return BigInt(value);
}

type StoredAmount = {
  toString(): string;
  toFixed?: (digits: number) => string;
};

function storedQuantity(value: StoredAmount) {
  return BigInt(value.toFixed?.(0) ?? value.toString());
}

export type StoredTransaction = {
  hash: string;
  blockHash: string;
  blockNumber: number;
  blobGasUsed: StoredAmount;
  block: { blobGasPrice: StoredAmount };
};

export async function getTransactionData(
  rpc: RpcCall,
  stored: StoredTransaction
) {
  const [rawTx, rawReceipt, rawBlock] = await Promise.all([
    rpc("eth_getTransactionByHash", [stored.hash]),
    rpc("eth_getTransactionReceipt", [stored.hash]),
    rpc("eth_getBlockByNumber", [
      `0x${stored.blockNumber.toString(16)}`,
      false,
    ]),
  ]);
  const tx = object(rawTx);
  const receipt = object(rawReceipt);
  const block = object(rawBlock);
  const sameHash = (actual: unknown, expected: string) =>
    typeof actual === "string" &&
    actual.toLowerCase() === expected.toLowerCase();

  if (
    !sameHash(tx.hash, stored.hash) ||
    !sameHash(receipt.transactionHash, stored.hash) ||
    !sameHash(tx.blockHash, stored.blockHash) ||
    !sameHash(receipt.blockHash, stored.blockHash) ||
    !sameHash(block.hash, stored.blockHash) ||
    quantity(tx.blockNumber) !== BigInt(stored.blockNumber) ||
    quantity(receipt.blockNumber) !== BigInt(stored.blockNumber) ||
    quantity(block.number) !== BigInt(stored.blockNumber)
  ) {
    throw new RpcDataError("Transaction or block does not match the database");
  }
  if (typeof tx.input !== "string" || !/^0x(?:[0-9a-f]{2})*$/i.test(tx.input)) {
    throw new RpcDataError("Invalid transaction input");
  }
  const status = quantity(receipt.status);
  if (status !== 0n && status !== 1n)
    throw new RpcDataError("Invalid execution status");
  const executionStatus =
    status === 1n ? ("SUCCESS" as const) : ("FAILED" as const);
  const gasUsed = quantity(receipt.gasUsed);
  const effectiveGasPrice = quantity(receipt.effectiveGasPrice);
  const baseFeePerGas = quantity(block.baseFeePerGas);
  if (effectiveGasPrice < baseFeePerGas)
    throw new RpcDataError("Gas price is below the base fee");
  if (
    quantity(receipt.blobGasUsed) !== storedQuantity(stored.blobGasUsed) ||
    quantity(receipt.blobGasPrice) !== storedQuantity(stored.block.blobGasPrice)
  ) {
    throw new RpcDataError("Blob gas data does not match the database");
  }
  return {
    executionStatus,
    gasUsed: gasUsed.toString(),
    effectiveGasPrice: effectiveGasPrice.toString(),
    input: tx.input,
    baseFeePerGas: baseFeePerGas.toString(),
  };
}
