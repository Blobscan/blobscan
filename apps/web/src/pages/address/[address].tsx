import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { getPaginationParams } from "~/utils/pagination";
import {
  BlobTransactionCard,
  BlobTransactionCardSkeleton,
} from "~/components/Cards/BlobTransactionCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import {
  PaginatedListSection,
  PaginatedListSectionSkeleton,
} from "~/components/PaginatedListSection";

const Address: NextPage = () => {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const address = router.query.address as string;

  const txQuery = api.tx.getByAddress.useQuery({ address, p, ps });

  if (txQuery.error) {
    return (
      <NextError
        title={txQuery.error.message}
        statusCode={txQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <div className="flex w-11/12 flex-col gap-8 md:gap-16">
      <SectionCard
        header={
          <div className="flex">
            <EthIdenticon address={address} />
            <div className="sm:text-lge ml-2 text-base">Address</div>
          </div>
        }
      >
        <h2 className="truncate text-xs font-bold text-content-light dark:text-content-dark sm:text-lg">
          {address}
        </h2>
      </SectionCard>
      {txQuery.status === "success" ? (
        <PaginatedListSection
          header={`Blob Transactions (${txQuery.data.totalTransactions})`}
          items={txQuery.data.transactions.map((t) => (
            <BlobTransactionCard key={t.hash} transaction={t} />
          ))}
          totalItems={txQuery.data.totalTransactions}
          page={p}
          pageSize={ps}
        />
      ) : (
        <PaginatedListSectionSkeleton
          header="Blob Transactions"
          skeletonItem={<BlobTransactionCardSkeleton />}
        />
      )}
    </div>
  );
};

export default Address;
