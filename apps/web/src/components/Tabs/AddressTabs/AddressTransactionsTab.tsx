import type { FC } from "react";

import { CountBadge } from "~/components/Badges/CountBadge";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import {
  normalizePaginationParams,
  paginationParamsSchema,
} from "~/schemas/pagination";
import type { Pagination, TransactionWithExpandedBlockAndBlob } from "~/types";

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

export type AddressTransactionsTabProps = {
  /** The address in lower case. */
  address: string;
  /** The all-time number of blob transactions for the title. */
  totalTransactions?: number;
  enabled: boolean;
};

/** The paginated list of the blob transactions of the address. */
export const AddressTransactionsTab: FC<AddressTransactionsTabProps> =
  function ({ address, totalTransactions, enabled }) {
    const { state: urlState, isReady } = useUrlState(paginationParamsSchema);
    const { cursor, ps } = normalizePaginationParams(urlState);
    const { data, isLoading, error } = api.tx.getAll.useQuery<{
      transactions: TransactionWithExpandedBlockAndBlob[];
      pagination: Pagination;
      totalTransactions?: number;
    }>(
      {
        cursor,
        ps,
        count: true,
        address,
        expand: "block,blob",
      },
      {
        enabled: enabled && isReady,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
      }
    );

    const transactionCount = data?.totalTransactions ?? totalTransactions;

    if (error) {
      return (
        <ErrorPage
          error={error}
          overrides={
            cursor
              ? undefined
              : {
                  BAD_REQUEST: {
                    title: "Invalid Address",
                    description: "Please provide a valid Ethereum address.",
                  },
                }
          }
        />
      );
    }

    return (
      <PaginatedListLayout
        title={
          <div className="flex items-center gap-2">
            <span>Blob Transactions</span>
            <CountBadge count={transactionCount} />
          </div>
        }
        isLoading={isLoading}
        items={data?.transactions.map((tx) => {
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
        pagination={data?.pagination}
        totalItems={transactionCount}
        pageSize={ps}
        itemSkeleton={<BlobTransactionCard />}
      />
    );
  };
