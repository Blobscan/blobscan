export class RpcDataError extends Error {}

export type RpcCall = (method: string, params: unknown[]) => Promise<unknown>;

export function createRpc(url: string, attempts = 3): RpcCall {
  let id = 0;
  return async (method, params) => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const requestId = ++id;
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: requestId,
            method,
            params,
          }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new RpcDataError("HTTP error");
        const body = (await response.json()) as {
          id?: number;
          error?: unknown;
          result?: unknown;
        };
        if (body.id !== requestId || body.error || body.result === undefined) {
          throw new RpcDataError("Invalid RPC response");
        }
        return body.result;
      } catch {
        // Do not print the URL. It can contain credentials.
        if (attempt === attempts)
          throw new RpcDataError(`${method} failed after ${attempts} attempts`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
    throw new RpcDataError("RPC request failed");
  };
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
    gasUsed: gasUsed.toString(),
    effectiveGasPrice: effectiveGasPrice.toString(),
    input: tx.input,
    baseFeePerGas: baseFeePerGas.toString(),
  };
}
