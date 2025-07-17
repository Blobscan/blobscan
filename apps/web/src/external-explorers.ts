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
      holesky: "https://eth-holesky.blockscout.com",
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
      holesky: "https://light-holesky.beaconcha.in",
      hoodi: "https://hoodi.beaconcha.in",
      sepolia: "https://light-sepolia.beaconcha.in",
      devnet: "https://eth.blockscout.com",
    },
  },
];
