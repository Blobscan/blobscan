import type { ReactNode } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/compat/router";
import { ChartBarIcon, QueueListIcon } from "@heroicons/react/24/outline";

import { z } from "@blobscan/zod";

import { AddressAnalytics } from "~/components/Address/AddressAnalytics";
import { CategoryBadge } from "~/components/Badges/CategoryBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { Copyable } from "~/components/Copyable";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { Link } from "~/components/Link";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { Tabs } from "~/components/Tabs";
import { api } from "~/api-client";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import { paginationParamsSchema } from "~/schemas/pagination";
import type {
  Category,
  Rollup,
  TransactionWithExpandedBlockAndBlob,
} from "~/types";
import {
  formatNumber,
  normalizeTimestamp,
  shortenHash,
  TIMESTAMP_FORMAT,
  toChecksumAddress,
} from "~/utils";

const TABS = ["transactions", "analytics"] as const;

type Tab = (typeof TABS)[number];

// The page owns `section` here only to clear it: a new tab starts on the
// first section of the Analytics tab.
const tabParamsSchema = z.object({
  tab: z.enum(TABS).optional(),
  section: z.string().optional(),
});

type TransactionRef = { hash: string; blockTimestamp: Date } | null;

/** A line of a field with more than one value, for example "First: 0x12…". */
function SubfieldLine({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-contentSecondary-light dark:text-contentSecondary-dark">
        {label}:
      </span>
      {children}
    </div>
  );
}

function TransactionRefLine({
  label,
  tx,
}: {
  label: string;
  tx: TransactionRef;
}) {
  const timestamp = tx ? normalizeTimestamp(tx.blockTimestamp) : undefined;

  return (
    // The hash is truncated when the row is too narrow. The label and the
    // date stay complete.
    <SubfieldLine label={label}>
      {tx && timestamp ? (
        <>
          <div className="min-w-0">
            <Link href={routes.tx(tx.hash)}>{shortenHash(tx.hash, 8)}</Link>
          </div>
          {/* The full date shows on hover. */}
          <span
            className="shrink-0 whitespace-nowrap text-sm text-contentTertiary-light dark:text-contentTertiary-dark"
            title={timestamp.format(TIMESTAMP_FORMAT)}
          >
            ({timestamp.fromNow()})
          </span>
        </>
      ) : (
        <span>-</span>
      )}
    </SubfieldLine>
  );
}

function getAddressRole(
  address: string,
  { from, to }: { from: string; to: string }
): "sent" | "received" | "self" {
  const isSender = from.toLowerCase() === address;
  const isReceiver = to.toLowerCase() === address;

  if (isSender && isReceiver) {
    return "self";
  }

  return isSender ? "sent" : "received";
}

const Address: NextPage = () => {
  const router = useRouter();
  const { state: urlState } = useUrlState(paginationParamsSchema);
  const { state: tabState, updateState: updateTabState } =
    useUrlState(tabParamsSchema);
  const address = (
    (router?.query.address as string | undefined) ?? ""
  ).toLowerCase();
  const checksumAddress = toChecksumAddress(address);
  const tab: Tab = tabState?.tab ?? "transactions";
  const queryOpts = {
    enabled: router?.isReady && !!address,
    refetchOnWindowFocus: false,
    retry: false,
  };

  // The all-time values of the overview and of the transaction count.
  const { data: overallData, error: overallError } =
    api.address.getOverall.useQuery({ address, timeFrame: "All" }, queryOpts);
  const overall = overallData?.data;

  const {
    data: addressTxsData,
    isLoading,
    error: txsError,
  } = api.tx.getAll.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
  }>(
    { p: urlState?.p, ps: urlState?.ps, address, expand: "block,blob" },
    {
      ...queryOpts,
      refetchOnMount: false,
      enabled: queryOpts.enabled && tab === "transactions",
    }
  );

  const error = txsError ?? overallError;

  if (error) {
    return (
      <ErrorPage
        error={error}
        overrides={{
          BAD_REQUEST: {
            title: "Invalid Address",
            description: "Please provide a valid Ethereum address.",
          },
        }}
      />
    );
  }

  const totalTransactions = overall?.allTime.totalTransactions;
  let detailsFields: DetailsLayoutProps["fields"] | undefined;

  if (overall) {
    const { firstTransaction, lastTransaction } = overall.allTime;

    detailsFields = [
      {
        name: "Address",
        helpText: "The Ethereum address of this page.",
        value: (
          // On a narrow screen, the address is truncated. The identicon and
          // the copy button stay complete.
          <div className="flex min-w-0 items-center gap-2">
            {/* We use lower case, so that the identicon does not change with the letter case. */}
            <div className="shrink-0">
              <EthIdenticon address={address} />
            </div>
            <div className="min-w-0 [&>div]:min-w-0">
              <Copyable value={checksumAddress} tooltipText="Copy Address">
                {checksumAddress}
              </Copyable>
            </div>
          </div>
        ),
      },
      ...(overall.category
        ? [
            {
              name: "Category",
              helpText:
                "Rollup when the address posts blobs for a known rollup. Other when it does not.",
              value: <CategoryBadge category={overall.category as Category} />,
            },
          ]
        : []),
      ...(overall.rollup
        ? [
            {
              name: "Rollup",
              helpText: "The rollup that this address posts blobs for.",
              value: <RollupBadge rollup={overall.rollup as Rollup} />,
            },
          ]
        : []),
      {
        name: "Blob Txs",
        helpText:
          "The first and the last blob transaction that this address sent or received.",
        value: (
          // One line on wide screens. On narrow screens, Last goes under
          // First.
          <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-8">
            <TransactionRefLine label="First" tx={firstTransaction} />
            <TransactionRefLine label="Last" tx={lastTransaction} />
          </div>
        ),
      },
    ];
  }

  return (
    <>
      <SeoMetaTags
        title={`Address ${checksumAddress || "Details"}`}
        description={`Explore address ${
          checksumAddress || "details"
        } on Blobscan.`}
      />
      <DetailsLayout
        header="Address Details"
        resource={{
          type: "address",
          value: checksumAddress,
        }}
        fields={detailsFields}
      />
      <Tabs
        selected={tab}
        onChange={(value) =>
          updateTabState({
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
              <PaginatedListLayout
                title={`Blob Transactions ${
                  totalTransactions
                    ? `(${formatNumber(totalTransactions)})`
                    : ""
                }`}
                isLoading={isLoading}
                items={addressTxsData?.transactions.map((tx) => {
                  const { blobs, ...restTx } = tx;

                  return (
                    <BlobTransactionCard
                      key={tx.hash}
                      transaction={restTx}
                      blobs={blobs}
                      addressRole={getAddressRole(address, tx)}
                    />
                  );
                })}
                totalItems={totalTransactions}
                page={urlState?.p}
                pageSize={urlState?.ps}
                itemSkeleton={<BlobTransactionCard />}
              />
            ),
          },
          {
            value: "analytics",
            label: "Analytics",
            icon: ChartBarIcon,
            content: <AddressAnalytics address={address} />,
          },
        ]}
      />
    </>
  );
};

export default Address;
