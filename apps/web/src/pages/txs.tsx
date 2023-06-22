import { type NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { useTransformResult } from "~/hooks/useTransformResult";
import { transformTxsResult } from "~/query-transformers";

const Txs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const txsRes = api.tx.getAll.useQuery({ p, ps });
  const { totalTransactions, transactions } =
    useTransformResult(txsRes, transformTxsResult) || {};
  const error = txsRes.error;

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
        totalTransactions ? `(${totalTransactions})` : ""
      }`}
      items={transactions?.map((t) => (
        <BlobTransactionCard key={t.hash} transaction={t} />
      ))}
      totalItems={totalTransactions}
      page={p}
      pageSize={ps}
      itemSkeleton={<BlobTransactionCard />}
    />
  );
};

export default Txs;
