import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { FullTransaction } from "~/types";
import { deserializeFullTransaction, formatNumber } from "~/utils";

const Txs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const { data: rawTxsData, error } = api.tx.getAll.useQuery<{
    transactions: FullTransaction[];
    totalTransactions: number;
  }>({
    p,
    ps,
    expand: "block,blob",
  });
  const txsData = useMemo(() => {
    if (!rawTxsData) {
      return;
    }

    return {
      totalTransactions: rawTxsData.totalTransactions,
      transactions: rawTxsData.transactions.map(deserializeFullTransaction),
    };
  }, [rawTxsData]);
  const { transactions, totalTransactions } = txsData || {};

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
      header={`Transactions ${
        totalTransactions ? `(${formatNumber(totalTransactions)})` : ""
      }`}
      items={transactions?.map((tx) => (
        <BlobTransactionCard
          key={tx.hash}
          transaction={tx}
          block={tx.block}
          blobs={tx.blobs}
        />
      ))}
      totalItems={totalTransactions}
      page={p}
      pageSize={ps}
      itemSkeleton={<BlobTransactionCard />}
      emptyState="No transactions"
    />
  );
};

export default Txs;
