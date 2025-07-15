import { ArrowsRightLeftIcon, CubeIcon } from "@heroicons/react/24/outline";
import {
  BookOpenIcon,
  ChartBarIcon,
  CommandLineIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import BlobIcon from "~/icons/blob.svg";
import EthereumIcon from "~/icons/ethereum.svg";
import {
  buildBlocksRoute,
  buildTransactionsRoute,
  buildBlobsRoute,
  buildAllStatsRoute,
} from "~/utils";
import type { RenderableIcon } from "./types/icons";

function resolveApiUrl(networkName: string): string {
  if (networkName === "mainnet") {
    return "https://api.blobscan.com";
  }

  return `https://api.${networkName}.blobscan.com`;
}

const NETWORKS_FIRST_BLOB_NUMBER: Record<string, number> = {
  mainnet: 19426589,
  holesky: 894735,
  sepolia: 5187052,
  gnosis: 32880709,
  chiado: 0,
  devnet: 0,
};

export function getFirstBlobNumber(networkName: string): number | undefined {
  return NETWORKS_FIRST_BLOB_NUMBER[networkName];
}

export type NavigationItem = {
  label: string;
  href: string;
  icon: RenderableIcon;
};

export type ExpandibleNavigationItem = {
  icon: RenderableIcon;
  label: string;
  items: ExpandibleNavigationSubItem[];
};

export type ExpandibleNavigationSubItem = {
  icon?: RenderableIcon;
  label: string;
  href: string;
};

export function isExpandibleNavigationItem(
  item: unknown
): item is ExpandibleNavigationItem {
  return typeof item === "object" && item !== null && "items" in item;
}

export const getNavigationItems = ({
  networkName,
  publicSupportedNetworks,
}: {
  networkName?: string;
  publicSupportedNetworks?: ExpandibleNavigationSubItem[];
}): Array<NavigationItem | ExpandibleNavigationItem> => {
  return [
    {
      label: "Blockchain",
      icon: Squares2X2Icon,
      items: [
        {
          icon: BlobIcon,
          label: "Blobs",
          href: buildBlobsRoute(),
        },
        {
          icon: CubeIcon,
          label: "Blocks",
          href: buildBlocksRoute(),
        },
        {
          icon: ArrowsRightLeftIcon,
          label: "Transactions",
          href: buildTransactionsRoute(),
        },
      ],
    },
    {
      label: "Networks",
      icon: EthereumIcon,
      items: publicSupportedNetworks ?? [],
    },
    {
      label: "Stats",
      icon: ChartBarIcon,
      href: buildAllStatsRoute(),
    },
    {
      label: "API",
      icon: CommandLineIcon,
      href: networkName ? resolveApiUrl(networkName) : "#",
    },
    {
      label: "Docs",
      icon: BookOpenIcon,
      href: "https://docs.blobscan.com",
    },
  ];
};
