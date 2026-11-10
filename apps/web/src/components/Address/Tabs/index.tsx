import type { FC } from "react";
import { ChartBarIcon, QueueListIcon } from "@heroicons/react/24/outline";

import { z } from "@blobscan/zod";

import { Tabs } from "~/components/Tabs";
import { useUrlState } from "~/hooks/useUrlState";
import { AddressAnalyticsTab } from "./AddressAnalyticsTab";
import { AddressTransactionsTab } from "./AddressTransactionsTab";

const TABS = ["transactions", "analytics"] as const;

type Tab = (typeof TABS)[number];

// This component owns `section` here only to clear it: a new tab starts on
// the first section of the Analytics tab.
const tabParamsSchema = z.object({
  tab: z.enum(TABS).optional(),
  section: z.string().optional(),
});

export type AddressTabsProps = {
  /** The address in lower case. */
  address: string;
  /** The number of blob txs of all the time. */
  totalTransactions?: number;
  /** True when the queries can run. */
  enabled: boolean;
};

/** The tabs of the address page: the transactions and the analytics. */
export const AddressTabs: FC<AddressTabsProps> = function ({
  address,
  totalTransactions,
  enabled,
}) {
  const { state, updateState } = useUrlState(tabParamsSchema);
  const tab: Tab = state?.tab ?? "transactions";

  return (
    <Tabs
      selected={tab}
      onChange={(value) =>
        updateState({
          tab: value !== "transactions" ? value : undefined,
          section: undefined,
        })
      }
      tabs={[
        {
          value: "transactions",
          label: "Transactions",
          icon: QueueListIcon,
          content: (
            <AddressTransactionsTab
              address={address}
              totalTransactions={totalTransactions}
              enabled={enabled}
            />
          ),
        },
        {
          value: "analytics",
          label: "Analytics",
          icon: ChartBarIcon,
          content: <AddressAnalyticsTab address={address} />,
        },
      ]}
    />
  );
};
