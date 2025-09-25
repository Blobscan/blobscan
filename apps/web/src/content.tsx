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
import { BLOBSCAN_EXPLORERS } from "./explorers";
import type { Network } from "./types";
import type { RenderableIcon } from "./types/icons";

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

export const getNavigationItems = (
  networkName?: Network
): Array<NavigationItem | ExpandibleNavigationItem> => {
  const items = [
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
      items: BLOBSCAN_EXPLORERS.map((e) => ({
        label: e.label,
        href: e.url,
      })),
    },
    {
      label: "Stats",
      icon: ChartBarIcon,
      href: buildAllStatsRoute(),
    },
    {
      label: "API",
      icon: CommandLineIcon,
      href: BLOBSCAN_EXPLORERS.find((e) => e.id === networkName)?.apiUrl ?? "",
    },
    {
      label: "Docs",
      icon: BookOpenIcon,
      href: "https://docs.blobscan.com",
    },
  ];

  return items;
};
