import { getAddress } from "viem";

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

// Returns the EIP-55 checksum form of an address, for display only.
// If the value is not a valid address, the function returns it unchanged.
export function toChecksumAddress(address: string): string {
  try {
    return getAddress(address.toLowerCase());
  } catch {
    return address;
  }
}

// This function shortens an Ethereum address by removing characters from the middle.
export function shortenHash(address: string, length = 4): string {
  return `0x${address.slice(2, length + 2)}…${address.slice(-length)}`;
}

export function getChainIdByName(chainName: string): number | undefined {
  switch (chainName) {
    case "mainnet":
      return 1;
    case "hoodi":
      return 560048;
    case "sepolia":
      return 11155111;
    case "gnosis":
      return 100;
  }
}

export function isAddress(address: string) {
  return addressRegex.test(address) || address.toLowerCase() === address;
}
