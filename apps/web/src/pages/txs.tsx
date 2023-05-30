import { useCallback } from "react";
import { type NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import {
  buildRouteWithPagination,
  getPaginationParams,
} from "~/utils/pagination";
import { BlobTransactionCard } from "~/components/Cards/BlobTransactionCard";
import {
  PaginatedListSection,
  type PaginatedListSectionProps,
} from "~/components/PaginatedListSection";
import { PageSpinner } from "~/components/Spinners/PageSpinner";

const Txs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const txsQuery = api.tx.getAll.useQuery({ p, ps });

  const handlePageSelected = useCallback<
    PaginatedListSectionProps["onPageSelected"]
  >(
    (page, pageSize) => {
      void router.push(
        buildRouteWithPagination(router.pathname, page, pageSize),
      );
    },
    [router],
  );

  if (txsQuery?.error) {
    return (
      <NextError
        title={txsQuery.error.message}
        statusCode={txsQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (txsQuery.status !== "success") {
    return <PageSpinner label="Loading transactions..." />;
  }

  const { transactions, totalTransactions } = txsQuery.data;

  return (
    <PaginatedListSection
      header={<div>Blob Transactions ({totalTransactions})</div>}
      items={transactions.map((t) => (
        <BlobTransactionCard key={t.hash} transaction={t} />
      ))}
      totalItems={totalTransactions}
      page={p}
      pageSize={ps}
      onPageSelected={handlePageSelected}
    />
  );
};

export default Txs;
