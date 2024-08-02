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

export type MenuItem = {
  label: string;
  href: string;
  icon: ReactNode;
  type: "single";
};

export type ExpandibleMenuItem = {
  label: string;
  icon: ReactNode;
  items: {
    label: string;
    href: string;
  }[];
  type: "expandible";
};

export const MENU_DATA: Array<MenuItem | ExpandibleMenuItem> = [
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
    type: "expandible",
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
    type: "expandible",
  },
  {
    label: "Networks",
    icon: <EthereumIcon />,
    items: JSON.parse(env.NEXT_PUBLIC_SUPPORTED_NETWORKS || "[]"),
    type: "expandible",
  },
  {
    label: "API",
    icon: <CommandLineIcon />,
    href: resolveApiUrl(),
    type: "single",
  },
  {
    label: "Docs",
    icon: <BookOpenIcon />,
    href: "https://docs.blobscan.com",
    type: "single",
  },
];
