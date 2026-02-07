export function buildAddressRoute(address: string) {
  return `/address/${address}`;
}

export function buildBlobRoute(versionedHash: string) {
  return `/blob/${versionedHash}`;
}

export function buildBlockRoute(blockNumberOrHash: string | number) {
  return `/block/${blockNumberOrHash}`;
}

export function buildTransactionRoute(hash: string) {
  return `/tx/${hash}`;
}

export function buildBlobsRoute() {
  return "/blobs";
}

export function buildBlocksRoute() {
  return "/blocks";
}

export function buildTransactionsRoute() {
  return "/txs";
}

export function buildAllStatsRoute() {
  return "/stats/";
}

export function buildStatRoute(metric: string) {
  return `/stat/${metric}`;
}
