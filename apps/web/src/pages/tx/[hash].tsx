import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { Card } from "~/components/Cards/Card";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { StandardEtherUnitDisplay } from "~/components/Displays/StandardEtherUnitDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { FullTransaction } from "~/types";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionExternalUrl,
  formatTimestamp,
  formatBytes,
  formatNumber,
  formatWei,
  deserializeFullTransaction,
} from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const hash = (router.query.hash as string | undefined) ?? "";

  const {
    data: rawTxData,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery<FullTransaction>(
    { hash, expand: "block,blob" },
    { enabled: router.isReady }
  );
  const tx = useMemo(() => {
    if (!rawTxData) {
      return;
    }

    return deserializeFullTransaction(rawTxData);
  }, [rawTxData]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!isLoading && !tx) {
    return <div>Transaction not found</div>;
  }

  const { data: transactionDetail } = api.stats.getTransaction.useQuery(
    { hash },
    { enabled: router.isReady }
  );
  console.log(transactionDetail);

  let detailsFields: DetailsLayoutProps["fields"] | undefined;

  if (tx) {
    detailsFields = [];

    const {
      blobs,
      block,
      hash,
      blockNumber,
      from,
      to,
      rollup,
      blobGasUsed,
      blobGasBaseFee,
      blobGasMaxFee,
    } = tx;

    const gasPrice = transactionDetail?.data? BigInt(transactionDetail.data.gasPrice) : BigInt(0);
    const gasUsed = transactionDetail?.data? BigInt(transactionDetail.data.gas) : BigInt(0);
    const transactionFee = gasPrice * gasUsed;
    detailsFields = [
      {
        name: "Hash",
        value: hash,
      },
      {
        name: "Block",
        value: <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>,
      },
      {
        name: "Timestamp",
        value: (
          <div className="whitespace-break-spaces">
            {formatTimestamp(block.timestamp)}
          </div>
        ),
      },
      {
        name: "From",
        value: <Link href={buildAddressRoute(from)}>{from}</Link>,
      },
      {
        name: "To",
        value: <Link href={buildAddressRoute(to)}>{to}</Link>,
      },
      {
        name: "Nonce",
        value: transactionDetail? BigInt(transactionDetail.data.nonce).toString() : "refresh to load.",
      },
      {
        name: "Value",
        value: transactionDetail?.data? formatWei(BigInt(transactionDetail.data.value), {toUnit: "DILL"}) : "refresh to load.",
      },
      {
        name: "Gas Price",
        value: transactionDetail?.data? <StandardEtherUnitDisplay amount={gasPrice} /> : "refresh to load.",
      },
      //{
      //  name: "Gas Usage",
      //  value: gasUsed.toString(),
      //},
      {
        name: "Transaction Fee",
        value: transactionDetail?.data? <StandardEtherUnitDisplay amount={transactionFee} /> : "refresh to load.",
      },
    ];

    if (rollup) {
      detailsFields.push({
        name: "Rollup",
        value: <RollupBadge rollup={rollup} />,
      });
    }

    const totalBlobSize = blobs.reduce((acc, b) => acc + b.size, 0);
    if (tx.blobs.length > 0){
      detailsFields.push(
        {
          name: "Total Blob Size",
          value: formatBytes(totalBlobSize),
        },
        {
          name: "Blob Gas Price",
          value: <StandardEtherUnitDisplay amount={block?.blobGasPrice} />,
        },
        {
          name: "Blob Fee",
          value: (
            <div className="flex flex-col gap-4">
              {blobGasBaseFee ? (
                <div className="flex gap-1">
                  <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                    Base:
                  </div>
                  <StandardEtherUnitDisplay amount={blobGasBaseFee} />
                </div>
              ) : null}
              <div className=" flex gap-1">
                <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                  Max:
                </div>
                <StandardEtherUnitDisplay amount={blobGasMaxFee} />
              </div>
            </div>
          ),
        },
        {
          name: "Blob Gas Used",
          value: formatNumber(blobGasUsed),
        },
      );
    }

  }

  return tx && tx.blobs && tx.blobs.length > 0 ?(
    <>
      <DetailsLayout
        header="Transaction Details"
        externalLink={tx ? buildTransactionExternalUrl(tx.hash) : undefined}
        fields={detailsFields}
      />

      <Card header={`Blobs ${tx ? `(${tx.blobs.length})` : ""}`}>
        <div className="space-y-6">
          {isLoading || !tx || !tx.blobs
            ? Array.from({ length: 2 }).map((_, i) => <BlobCard key={i} />)
            : tx.blobs.map((b) => <BlobCard key={b.versionedHash} blob={b} />)}
        </div>
      </Card>
    </>
  ):(
    <>
      <DetailsLayout
        header="Transaction Details"
        externalLink={tx ? buildTransactionExternalUrl(tx.hash) : undefined}
        fields={detailsFields}
      />
    </>
  );
};

export default Tx;
