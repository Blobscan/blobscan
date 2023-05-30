import { type NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { getPaginationParams } from "~/utils/pagination";
import {
  BlobTransactionCard,
  BlobTransactionCardSkeleton,
} from "~/components/Cards/BlobTransactionCard";
import {
  PaginatedListSection,
  PaginatedListSectionSkeleton,
} from "~/components/PaginatedListSection";

const Txs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const txsQuery = api.tx.getAll.useQuery({ p, ps });

  if (txsQuery?.error) {
    return (
      <NextError
        title={txsQuery.error.message}
        statusCode={txsQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (txsQuery.status !== "success") {
    return (
      <PaginatedListSectionSkeleton
        header="Blob Transactions"
        skeletonItem={<BlobTransactionCardSkeleton />}
      />
    );
  }

  const { transactions, totalTransactions } = txsQuery.data;

  return (
    <PaginatedListSection
      header={`Blob Transactions (${totalTransactions})`}
      items={transactions.map((t) => (
        <BlobTransactionCard key={t.hash} transaction={t} />
      ))}
      totalItems={totalTransactions}
      page={p}
      pageSize={ps}
    />
  );
};

export default Txs;
