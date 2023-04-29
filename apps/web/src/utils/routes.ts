export const NO_RESULTS_ROUTE = "/empty";

export function buildAddressRoute(address: string) {
  return `/address/${address}`;
}

export function buildBlobRoute(txHash: string, blobIndex: number | string) {
  return `/tx/${txHash}/blob/${blobIndex}`;
}

export function buildBlockRoute(blockNumberOrHash: string | number) {
  return `/block/${blockNumberOrHash}`;
}

export function buildTransactionRoute(hash: string) {
  return `/tx/${hash}`;
}
