import * as networks from "./networks";

export function getNetwork(nameOrChainId: string | number) {
  const network = Object.values(networks).find((network) => {
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

export * as networks from "./networks";
export type { Network } from "./Network";
export * from "./types";
