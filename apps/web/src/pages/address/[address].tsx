import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { BlobTransactionCard } from "~/components/Cards/BlobTransactionCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import { PageSpinner } from "~/components/Spinners/PageSpinner";
import { api } from "~/api";

const TXS_LIMIT = 20;

const Address: NextPage = () => {
  const router = useRouter();
  const address = router.query.address as string;

  const txQuery = api.tx.getByAddress.useQuery({ address, limit: TXS_LIMIT });

  if (txQuery.error) {
    return (
      <NextError
        title={txQuery.error.message}
        statusCode={txQuery.error.data?.httpStatus ?? 500}
      />
    );
    l;
  }

  if (txQuery.status !== "success") {
    return <PageSpinner label="Loading address data..." />;
  }

  if (!txQuery.data) {
    return <>Address has no data</>;
  }

  const txs = txQuery.data;

  return (
    <>
      <div className="md:flex md:items-center ">
        <EthIdenticon address={address} scale={0} />
        <h2 className="ml-2 text-sm font-bold leading-7 text-content-light dark:text-content-dark sm:truncate sm:text-2xl sm:tracking-tight">
          Address {address}
        </h2>
      </div>
      <div className="flex w-11/12 flex-col gap-8 md:gap-16">
        <SectionCard header={<div>Blob Transactions ({txs.length})</div>}>
          <div className="space-y-6">
            {txs.map((t) => (
              <BlobTransactionCard key={t.hash} transaction={t} />
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
};

export default Address;
