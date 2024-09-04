import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { useQueryParams } from "~/hooks/useQueryParams";
import NextError from "~/pages/_error";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import { buildAddressExternalUrl, deserializeFullTransaction } from "~/utils";

const Address: NextPage = () => {
  const router = useRouter();
  const { p, ps } = useQueryParams();
  const address = (router.query.address as string | undefined) ?? "";

  const { data: serializedAddressTxs, error } = api.tx.getAll.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
    totalTransactions: number;
  }>(
    { to: address, from: address, p, ps, expand: "block,blob" },
    { enabled: router.isReady }
  );
  const addressTxsData = useMemo(() => {
    if (!serializedAddressTxs) {
      return;
    }

    return {
      totalTransactions: serializedAddressTxs.totalTransactions,
      transactions: serializedAddressTxs.transactions.map(
        deserializeFullTransaction
      ),
    };
  }, [serializedAddressTxs]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <>
      <DetailsLayout
        header="Address Details"
        externalLink={buildAddressExternalUrl(address)}
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
          addressTxsData ? `(${addressTxsData.totalTransactions})` : ""
        }`}
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
        page={p}
        pageSize={ps}
        itemSkeleton={<BlobTransactionCard />}
      />
    </>
  );
};

export default Address;
