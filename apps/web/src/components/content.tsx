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
} from "~/utils";

function resolveApiUrl(): string {
  if (env.NEXT_PUBLIC_NETWORK_NAME === "mainnet") {
    return "https://api.blobscan.com";
  }

  return `https://api.${env.NEXT_PUBLIC_NETWORK_NAME}.blobscan.com`;
}

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export type ExpandibleNavItem = {
  label: string;
  icon: ReactNode;
  items: ExpandibleSubItem[];
};

export type ExpandibleSubItem = {
  label: string;
  href: string;
};

export function isExpandible(
  item: ExpandibleNavItem | NavItem
): item is ExpandibleNavItem {
  return (item as ExpandibleNavItem).items !== undefined;
}

export const MENU_ITEMS: Array<NavItem | ExpandibleNavItem> = [
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
