import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { FullTransaction } from "~/types";
import { buildAddressExternalUrl, deserializeFullTransaction, formatWei } from "~/utils";

const Address: NextPage = () => {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const address = (router.query.address as string | undefined) ?? "";

  const { data: serializedAddressTxs, error } = api.tx.getAll.useQuery<{
    transactions: FullTransaction[];
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

  const { data: balanceData } = api.stats.getBalance.useQuery(
    { address },
    { enabled: router.isReady }
  );
  console.log(balanceData);
  // const balance = balanceData ? convertWei(balanceData.balance.toString(), "DILL") : null;
  // const balance = balanceData ? formatWei(balanceData.balance, {toUnit: "DILL"}) : null;
  const rawBalance = balanceData ? balanceData.balance : null;
  const balance = rawBalance === BigInt(-1) ? "Loading..." : rawBalance ? formatWei(rawBalance, {toUnit: "DILL"}) : "0 DILL";

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
          {
            name: "Balance",
            value: (
              <div className="flex items-center gap-2">
                <div className="">{balance}</div>
              </div>
            ),
          },
        ]}
      />
      <PaginatedListLayout
        title={`Transactions ${
          addressTxsData ? `(${addressTxsData.totalTransactions})` : ""
        }`}
        items={addressTxsData?.transactions.map((tx) => {
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
        totalItems={addressTxsData?.totalTransactions}
        page={p}
        pageSize={ps}
        itemSkeleton={<BlobTransactionCard />}
      />
    </>
  );
};

export default Address;
