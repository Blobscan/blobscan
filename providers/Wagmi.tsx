import { configureChains, createClient, allChains, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { ReactNode } from "react";

if (!process.env.NEXT_PUBLIC_DONATION_CHAIN_ID) {
  throw new Error("Missing NEXT_PUBLIC_DONATION_CHAIN_ID");
}
const DONATION_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_DONATION_CHAIN_ID);

const { chains, provider } = configureChains(
  allChains.filter((c) => c.id === DONATION_CHAIN_ID),
  [publicProvider()]
);

const client = createClient({
  connectors: [new MetaMaskConnector({ chains })],
  provider,
});

export const Wagmi = ({ children }: { children: ReactNode }) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};
