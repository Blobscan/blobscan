import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { formatNumber } from "~/utils";

const Txs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const { data, error } = api.tx.getAllFull.useQuery({ p, ps });
  const { transactions, totalTransactions } = data || {};

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <PaginatedListLayout
      header={`Blob Transactions ${
        totalTransactions ? `(${formatNumber(totalTransactions)})` : ""
      }`}
      items={transactions?.map((tx) => {
        const { block, ...filteredTx } = tx;

        return (
          <BlobTransactionCard
            key={tx.hash}
            transaction={filteredTx}
            block={{ ...block }}
          />
        );
      })}
      totalItems={totalTransactions}
      page={p}
      pageSize={ps}
      itemSkeleton={<BlobTransactionCard />}
      emptyState="No blob transactions"
    />
  );
};

export default Txs;
