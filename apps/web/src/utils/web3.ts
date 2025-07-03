// This function shortens an Ethereum address by removing characters from the middle.
export function shortenAddress(address: string, length = 4): string {
  return `${address.slice(0, length)}…${address.slice(-length)}`;
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
