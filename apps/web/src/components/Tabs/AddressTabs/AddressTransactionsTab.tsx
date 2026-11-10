import type { FC } from "react";

import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import { paginationParamsSchema } from "~/schemas/pagination";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import { formatNumber } from "~/utils";

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
  /** The number of blob txs of all the time, for the title and the pages. */
  totalTransactions?: number;
  enabled: boolean;
};

/** The paginated list of the blob transactions of the address. */
export const AddressTransactionsTab: FC<AddressTransactionsTabProps> =
  function ({ address, totalTransactions, enabled }) {
    const { state: urlState } = useUrlState(paginationParamsSchema);
    const { data, isLoading, error } = api.tx.getAll.useQuery<{
      transactions: TransactionWithExpandedBlockAndBlob[];
    }>(
      { p: urlState?.p, ps: urlState?.ps, address, expand: "block,blob" },
      {
        enabled,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
      }
    );

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

    return (
      <PaginatedListLayout
        title={`Blob Transactions ${
          totalTransactions ? `(${formatNumber(totalTransactions)})` : ""
        }`}
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
        totalItems={totalTransactions}
        page={urlState?.p}
        pageSize={urlState?.ps}
        itemSkeleton={<BlobTransactionCard />}
      />
    );
  };
