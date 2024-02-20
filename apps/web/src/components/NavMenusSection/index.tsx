import {
  BookOpenIcon,
  ChartBarIcon,
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
import { NavItem } from "./NavItem";

export const NavMenusSection: React.FC = () => {
  return (
    <div className="flex gap-4">
      <NavItem
        label="Blockchain"
        icon={<Squares2X2Icon />}
        menuItems={[
          { label: "Blobs", href: buildBlobsRoute() },
          { label: "Blocks", href: buildBlocksRoute() },
          { label: "Transactions", href: buildTransactionsRoute() },
        ]}
      />
      <NavItem
        label="Stats"
        icon={<ChartBarIcon />}
        menuItems={[
          {
            label: "Blob Metrics",
            href: buildBlobStatsRoute(),
          },
          { label: "Block Metrics", href: buildBlockStatsRoute() },
          { label: "Transaction Metrics", href: buildTransactionStatsRoute() },
        ]}
      />
      <NavItem
        label="Docs"
        icon={<BookOpenIcon />}
        href="https://docs.blobscan.com"
      />
      {!!env.NEXT_PUBLIC_SUPPORTED_NETWORKS?.length && (
        <NavItem
          label="Networks"
          icon={<EthereumIcon />}
          menuItems={JSON.parse(env.NEXT_PUBLIC_SUPPORTED_NETWORKS || "[]")}
        />
      )}
    </div>
  );
};
