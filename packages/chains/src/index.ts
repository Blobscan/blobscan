import * as chains from "./chains";

export function getChain(nameOrChainId: string | number) {
  const network = Object.values(chains).find((network) => {
    if (typeof nameOrChainId === "string" && isNaN(Number(nameOrChainId))) {
      return network.name === nameOrChainId.toLowerCase();
    } else {
      return network.id === Number(nameOrChainId);
    }
  });

  if (!network) {
    throw new Error(`Unsupported network: ${nameOrChainId.toString()}`);
  }

  return network;
}

export * as chains from "./chains";
export type { Chain } from "./Chain";
export * from "./types";
