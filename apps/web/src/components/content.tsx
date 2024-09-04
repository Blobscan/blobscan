import type { ReactNode } from "react";
import {
  BookOpenIcon,
  ChartBarIcon,
  CommandLineIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import { env } from "~/env.mjs";
import EthereumIcon from "~/icons/ethereum.svg";
import {
  buildBlobStatsRoute,
  buildBlockStatsRoute,
  buildBlocksRoute,
  buildTransactionStatsRoute,
  buildTransactionsRoute,
  buildBlobsRoute,
  buildAllStatsRoute,
} from "~/utils";

function resolveApiUrl(): string {
  if (env.NEXT_PUBLIC_NETWORK_NAME === "mainnet") {
    return "https://api.blobscan.com";
  }

  return `https://api.${env.NEXT_PUBLIC_NETWORK_NAME}.blobscan.com`;
}

type Network = typeof env.NEXT_PUBLIC_NETWORK_NAME;

const NETWORKS_FIRST_BLOB_NUMBER: Record<Network, number> = {
  mainnet: 19426589,
  holesky: 894735,
  sepolia: 5187052,
  gnosis: 32880709,
  chiado: 0,
  devnet: 0,
};

export function getFirstBlobNumber(): number {
  return NETWORKS_FIRST_BLOB_NUMBER[env.NEXT_PUBLIC_NETWORK_NAME];
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

export const NAVIGATION_ITEMS: Array<
  NavigationItem | ExpandibleNavigationItem
> = [
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
    label: "Stats",
    icon: <ChartBarIcon />,
    items: [
      {
        label: "Blob Metrics",
        href: buildBlobStatsRoute(),
      },
      {
        label: "Block Metrics",
        href: buildBlockStatsRoute(),
      },
      {
        label: "Transaction Metrics",
        href: buildTransactionStatsRoute(),
      },
      {
        label: "All Metrics",
        href: buildAllStatsRoute(),
      },
    ],
  },
  {
    label: "Networks",
    icon: <EthereumIcon />,
    items: JSON.parse(env.NEXT_PUBLIC_SUPPORTED_NETWORKS || "[]"),
  },
  {
    label: "API",
    icon: <CommandLineIcon />,
    href: resolveApiUrl(),
  },
  {
    label: "Docs",
    icon: <BookOpenIcon />,
    href: "https://docs.blobscan.com",
  },
];
