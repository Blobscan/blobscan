export function buildBlobRoute(txHash: string, blobIndex: number) {
  return `/tx/${txHash}/blob/${blobIndex}`;
}

export function buildBlockRoute(blockNumberOrHash: string | number) {
  return `/block/${blockNumberOrHash}`;
}

export function buildTransactionRoute(hash: string) {
  return `/tx/${hash}`;
}
