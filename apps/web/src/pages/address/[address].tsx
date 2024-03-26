import { useMemo } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import type { TransactionWithBlock } from "~/types";
import {
  buildAddressExternalUrl,
  deserializeTransactionWithBlock,
} from "~/utils";

const Address: NextPage = () => {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const address = (router.query.address as string | undefined) ?? "";

  const { data: serializedAddressData, error } = api.tx.getByAddress.useQuery<{
    transactions: TransactionWithBlock[];
    totalTransactions: number;
  }>({ address, p, ps, expand: "block" }, { enabled: router.isReady });
  const addressData = useMemo(() => {
    if (!serializedAddressData) {
      return;
    }

    return {
      totalTransactions: serializedAddressData.totalTransactions,
      transactions: serializedAddressData.transactions.map(
        deserializeTransactionWithBlock
      ),
    };
  }, [serializedAddressData]);

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
          addressData ? `(${addressData.totalTransactions})` : ""
        }`}
        items={addressData?.transactions.map((tx) => {
          const { block, blobs, ...restTx } = tx;

          return (
            <BlobTransactionCard
              key={tx.hash}
              transaction={restTx}
              block={{
                timestamp: block.timestamp,
              }}
              blobs={blobs}
            />
          );
        })}
        totalItems={serializedAddressData?.totalTransactions}
        page={p}
        pageSize={ps}
        itemSkeleton={<BlobTransactionCard />}
      />
    </>
  );
};

export default Address;
