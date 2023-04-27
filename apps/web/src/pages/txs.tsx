import { type NextPage } from "next";
import NextError from "next/error";

import { api } from "~/utils/api";
import { BlobTransactionCard } from "~/components/Cards/BlobTransactionCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import { PageSpinner } from "~/components/Spinners/PageSpinner";

const Txs: NextPage = function () {
  const txsQuery = api.tx.getAll.useQuery({ limit: 100 });

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

  const transactions = txsQuery.data;

  return (
    <SectionCard header={<div>Blob Transactions</div>}>
      <div className="space-y-6">
        {transactions.map((t) => (
          <BlobTransactionCard key={t.hash} transaction={t} />
        ))}
      </div>
    </SectionCard>
  );
};

export default Txs;
