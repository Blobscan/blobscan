import { type NextPage } from "next";
import NextError from "next/error";

import { SectionCard } from "~/components/Cards/SectionCard";
import { api } from "~/api";

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

  return <SectionCard header="Transactions">aasdasda</SectionCard>;
};

export default Txs;
