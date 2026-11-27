import type { BlobPosition } from "./types";

export const routes = {
  blobs: "/blobs",
  blocks: "/blocks",
  txs: "/txs",
  stats: "/stats",

  address: (address: string) => `/address/${address}`,
  // The position (`?tx=&index=`) only tells the previous/next arrows where
  // they are; the page is the same for every position. Links that carry one
  // use `rel="nofollow"` (BLOB_POSITION_LINK_REL) and the blob page declares
  // `/blob/<versioned hash>` canonical: a blob posted in 38,624 transactions
  // had 38,624 crawlable URLs, each loading every transaction.
  blob: (id: string, position?: BlobPosition) =>
    position
      ? `/blob/${id}?tx=${position.txHash}&index=${position.index}`
      : `/blob/${id}`,
  block: (id: string | number) => `/block/${id}`,
  tx: (hash: string) => `/tx/${hash}`,
  stat: (name: string) => `/stat/${name}`,
};

export const BLOB_POSITION_LINK_REL = "nofollow";
