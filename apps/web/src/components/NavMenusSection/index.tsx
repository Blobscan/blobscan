import { ChartBarIcon, Squares2X2Icon } from "@heroicons/react/24/solid";

import {
  buildBlobStatsRoute,
  buildBlockStatsRoute,
  buildBlocksRoute,
  buildTransactionStatsRoute,
  buildTransactionsRoute,
} from "~/utils";
import { NavMenuItem } from "./NavMenuItem";

export const NavMenusSection: React.FC = () => {
  return (
    <div className="flex gap-4">
      <NavMenuItem
        label="Blockchain"
        icon={<Squares2X2Icon />}
        items={[
          { label: "Blocks", href: buildBlocksRoute() },
          { label: "Transactions", href: buildTransactionsRoute() },
        ]}
      />
      <NavMenuItem
        label="Stats"
        icon={<ChartBarIcon />}
        items={[
          {
            label: "Blob Metrics",
            href: buildBlobStatsRoute(),
          },
          { label: "Block Metrics", href: buildBlockStatsRoute() },
          { label: "Transaction Metrics", href: buildTransactionStatsRoute() },
        ]}
      />
    </div>
  );
};
