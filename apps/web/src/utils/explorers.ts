const BASE_URL =
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL ?? "https://etherscan.io/";
const BEACON_BASE_URL =
  process.env.NEXT_PUBLIC_BEACON_BASE_URL ?? "https://beaconscan.com/";

export function buildBlockExternalUrl(id: number): string {
  return `${BASE_URL}block/${id}`;
}

export function buildTransactionExternalUrl(id: string): string {
  return `${BASE_URL}tx/${id}`;
}

export function buildSlotExternalUrl(slot: number) {
  return `${BEACON_BASE_URL}slot/${slot}`;
}
