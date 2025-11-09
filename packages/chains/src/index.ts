import * as chains from "./chains";

export function getChain(nameOrChainId: string | number) {
  const chain = Object.values(chains).find((chain) => {
    if (typeof nameOrChainId === "string" && isNaN(Number(nameOrChainId))) {
      return chain.name === nameOrChainId.toLowerCase();
    } else {
      return chain.id === Number(nameOrChainId);
    }
  });

  if (!chain) {
    throw new Error(`Unsupported chain: ${nameOrChainId.toString()}`);
  }

  return chain;
}

export * as chains from "./chains";
export type { Chain } from "./Chain";
export * from "./types";
