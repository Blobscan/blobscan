import type { NextPage } from "next";
import { useRouter } from "next/compat/router";
import cn from "classnames";

import { z } from "@blobscan/zod";

import { AddressAnalytics } from "~/components/Address/AddressAnalytics";
import { formatDuration } from "~/components/Address/format";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { Link } from "~/components/Link";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { api } from "~/api-client";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import { paginationParamsSchema } from "~/schemas/pagination";
import type { Rollup, TransactionWithExpandedBlockAndBlob } from "~/types";
import {
  formatNumber,
  formatTimestamp,
  shortenHash,
  toChecksumAddress,
} from "~/utils";

const TABS = ["transactions", "analytics"] as const;

type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  transactions: "Transactions",
  analytics: "Analytics",
};

const tabParamsSchema = z.object({ tab: z.enum(TABS).optional() });

function TxLink({
  tx,
}: {
  tx?: { hash: string; blockTimestamp: Date } | null;
}) {
  if (!tx) {
    return <span>–</span>;
  }

  return (
    <div className="flex flex-col">
      <Link href={routes.tx(tx.hash)}>{shortenHash(tx.hash, 16)}</Link>
      <span className="text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
        {formatTimestamp(tx.blockTimestamp)}
      </span>
    </div>
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

  // The all-time values of the header and of the transaction count.
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
  const firstTx = overall?.allTime.firstTransaction;
  const lastTx = overall?.allTime.lastTransaction;
  const now = Date.now();

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
        fields={
          overall
            ? [
                {
                  name: "Address",
                  value: (
                    <div className="flex items-center gap-2">
                      <div className="relative bottom-0.5">
                        {/* We use lower case, so that the identicon does not change with the letter case. */}
                        <EthIdenticon address={address} />
                      </div>
                      <div>{checksumAddress}</div>
                    </div>
                  ),
                },
                ...(overall.rollup
                  ? [
                      {
                        name: "Rollup",
                        value: (
                          <RollupBadge rollup={overall.rollup as Rollup} />
                        ),
                      },
                    ]
                  : []),
                { name: "First Blob Tx", value: <TxLink tx={firstTx} /> },
                { name: "Last Blob Tx", value: <TxLink tx={lastTx} /> },
                {
                  name: "Active Age",
                  helpText: "The time since the first blob transaction.",
                  value: firstTx
                    ? formatDuration(now - firstTx.blockTimestamp.getTime())
                    : "–",
                },
                {
                  name: "Last Active",
                  value: lastTx
                    ? `${formatDuration(
                        now - lastTx.blockTimestamp.getTime()
                      )} ago`
                    : "–",
                },
                {
                  name: "Active Days",
                  helpText:
                    "The days with at least one blob transaction, sent or received.",
                  value: formatNumber(overall.allTime.activeDays),
                },
              ]
            : undefined
        }
      />
      <div
        role="tablist"
        className="flex gap-1 border-b border-border-light dark:border-border-dark"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() =>
              updateTabState({ tab: t !== "transactions" ? t : undefined })
            }
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "border-accent-light text-accent-light dark:border-accent-dark dark:text-accent-dark"
                : "border-transparent text-contentSecondary-light hover:text-content-light dark:text-contentSecondary-dark dark:hover:text-content-dark"
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      {tab === "analytics" ? (
        <AddressAnalytics address={address} />
      ) : (
        <PaginatedListLayout
          title={`Blob Transactions ${
            totalTransactions ? `(${formatNumber(totalTransactions)})` : ""
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
      )}
    </>
  );
};

export default Address;
