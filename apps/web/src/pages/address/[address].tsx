import type { NextPage } from "next";
import { useRouter } from "next/router";

import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import { paginationParamsSchema } from "~/schemas/pagination";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";

const Address: NextPage = () => {
  const router = useRouter();
  const { state: urlState } = useUrlState(paginationParamsSchema);
  const address = (router.query.address as string | undefined) ?? "";

  const {
    data: addressTxsData,
    isLoading,
    error,
  } = api.tx.getAll.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
    totalTransactions: number;
  }>(
    { p: urlState?.p, ps: urlState?.ps, from: address, expand: "block,blob" },
    {
      enabled: router.isReady,
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
    <>
      <DetailsLayout
        header="Address Details"
        resource={{
          type: "address",
          value: address,
        }}
        fields={[
          {
            name: "Address",
            value: (
              <div className="flex items-center gap-2">
                <div className="relative bottom-0.5">
                  <EthIdenticon address={address} />
                </div>
                <div className="">{address}</div>
              </div>
            ),
          },
        ]}
      />
      <PaginatedListLayout
        title={`Blob Transactions ${
          addressTxsData?.totalTransactions
            ? `(${addressTxsData.totalTransactions})`
            : ""
        }`}
        isLoading={isLoading}
        items={addressTxsData?.transactions.map((tx) => {
          const { blobs, ...restTx } = tx;

          return (
            <BlobTransactionCard
              key={tx.hash}
              transaction={restTx}
              blobs={blobs}
            />
          );
        })}
        totalItems={addressTxsData?.totalTransactions}
        page={urlState?.p}
        pageSize={urlState?.ps}
        itemSkeleton={<BlobTransactionCard />}
      />
    </>
  );
};

export default Address;
