import blockscoutLogo from "~/icons/external-explorers/blockscout-logo.svg";
import type { Network } from "./types";
import type { RenderableIcon } from "./types/icons";

export type SupportedExternalExlorerId = "blockscout" | "beaconchain";

export type ExternalExplorerId = SupportedExternalExlorerId | "custom";

export type ExternalExplorer = {
  id: ExternalExplorerId;
  label: string;
  urls: Record<Network, string>;
  icon?: RenderableIcon;
};

export const EXTERNAL_EXECUTION_EXPLORERS: ExternalExplorer[] = [
  {
    id: "blockscout",
    label: "Blockscout",
    icon: blockscoutLogo,
    urls: {
      mainnet: "https://eth.blockscout.com",
      gnosis: "https://gnosis.blockscout.com",
      hoodi: "https://eth-hoodi.blockscout.com",
      sepolia: "https://eth-sepolia.blockscout.com",
      devnet: "https://eth.blockscout.com",
    },
  },
];

export const EXTERNAL_CONSENSUS_EXPLORERS: ExternalExplorer[] = [
  {
    id: "beaconchain",
    label: "Beaconcha.in",
    urls: {
      mainnet: "https://beaconcha.in",
      gnosis: "https://gnosischa.in",
      hoodi: "https://hoodi.beaconcha.in",
      sepolia: "https://light-sepolia.beaconcha.in",
      devnet: "https://eth.blockscout.com",
    },
  },
];

export const BLOBSCAN_EXPLORERS: {
  id: Network;
  label: string;
  url: string;
  apiUrl: string;
}[] = [
  {
    id: "mainnet",
    label: "Ethereum Mainnet",
    url: "https://blobscan.com",
    apiUrl: "https://api.blobscan.com",
  },
  {
    id: "gnosis",
    label: "Gnosis",
    url: "https://gnosis.blobscan.com",
    apiUrl: "https://api.gnosis.blobscan.com",
  },
  {
    id: "hoodi",
    label: "Hoodi Testnet",
    url: "https://hoodi.blobscan.com",
    apiUrl: "https://api.hoodi.blobscan.com",
  },
  {
    id: "sepolia",
    label: "Sepolia Testnet",
    url: "https://sepolia.blobscan.com",
    apiUrl: "https://api.sepolia.blobscan.com",
  },
];
