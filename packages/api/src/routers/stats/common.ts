export const BASE_PATH = "stats";
export const BLOCK_BASE_PATH = `${BASE_PATH}/blocks`;
export const BLOB_BASE_PATH = `${BASE_PATH}/blobs`;
export const TRANSACTION_BASE_PATH = `${BASE_PATH}/transactions`;

export function buildStatsPath(path: string) {
  return `/${BASE_PATH}/${path}`;
}
