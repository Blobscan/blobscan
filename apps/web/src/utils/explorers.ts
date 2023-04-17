const BASE_URL = "https://etherscan.io/";

export function buildBlockExternalUrl(id: number): string {
  return `${BASE_URL}block/${id}`;
}

export function buildTransactionExternalUrl(id: string): string {
  return `${BASE_URL}tx/${id}`;
}
