import type { ReactNode } from "react";
import {
  BookOpenIcon,
  ChartBarIcon,
  CommandLineIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import EthereumIcon from "~/icons/ethereum.svg";
import {
  buildBlocksRoute,
  buildTransactionsRoute,
  buildBlobsRoute,
  buildAllStatsRoute,
} from "~/utils";

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
  icon: ReactNode;
};

export type ExpandibleNavigationItem = {
  label: string;
  icon: ReactNode;
  items: ExpandibleNavigationSubItem[];
};

export type ExpandibleNavigationSubItem = {
  label: string;
  href: string;
};

export function isExpandibleNavigationItem(
  item: unknown
): item is ExpandibleNavigationItem {
  return typeof item === "object" && item !== null && "items" in item;
}

export const getNavigationItems = (
  networkName: string,
  publicSupportedNetworks: string
): Array<NavigationItem | ExpandibleNavigationItem> => {
  return [
    {
      label: "Blockchain",
      icon: <Squares2X2Icon />,
      items: [
        {
          label: "Blobs",
          href: buildBlobsRoute(),
        },
        {
          label: "Blocks",
          href: buildBlocksRoute(),
        },
        {
          label: "Transactions",
          href: buildTransactionsRoute(),
        },
      ],
    },
    {
      label: "Networks",
      icon: <EthereumIcon />,
      items: JSON.parse(publicSupportedNetworks || "[]"),
    },
    {
      label: "Stats",
      icon: <ChartBarIcon />,
      href: buildAllStatsRoute(),
    },
    {
      label: "API",
      icon: <CommandLineIcon />,
      href: resolveApiUrl(networkName),
    },
    {
      label: "Docs",
      icon: <BookOpenIcon />,
      href: "https://docs.blobscan.com",
    },
  ];
};
