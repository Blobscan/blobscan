const addressRegex = /^0x[a-fA-F0-9]{40}$/;

// This function shortens an Ethereum address by removing characters from the middle.
export function shortenAddress(address: string, length = 4): string {
  return `0x${address.slice(2, length + 2)}…${address.slice(-length)}`;
}

export function getChainIdByName(chainName: string): number | undefined {
  switch (chainName) {
    case "mainnet":
      return 1;
    case "holesky":
      return 17000;
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
