import type { BlobPosition } from "./types";

export const routes = {
  blobs: "/blobs",
  blocks: "/blocks",
  txs: "/txs",
  stats: "/stats",

  address: (address: string) => `/address/${address}`,
  blob: (id: string, position?: BlobPosition) =>
    position
      ? `/blob/${id}?tx=${position.txHash}&index=${position.index}`
      : `/blob/${id}`,
  block: (id: string | number) => `/block/${id}`,
  tx: (hash: string) => `/tx/${hash}`,
  stat: (name: string) => `/stat/${name}`,
};
