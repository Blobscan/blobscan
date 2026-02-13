export const routes = {
  blobs: "/blobs",
  blocks: "/blocks",
  txs: "/txs",
  stats: "/stats",

  address: (address: string) => `/address/${address}`,
  blob: (id: string) => `/blob/${id}`,
  block: (id: string | number) => `/block/${id}`,
  tx: (hash: string) => `/tx/${hash}`,
  stat: (name: string) => `/stat/${name}`,
};
