import { useMemo } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { Card } from "~/components/Cards/Card";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionExternalUrl,
  formatTimestamp,
  GAS_PER_BLOB,
  formatBytes,
  formatNumber,
  performDiv,
} from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const hash = (router.query.hash as string | undefined) ?? "";

  const {
    data: txData_,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery({ hash }, { enabled: router.isReady });
  const txData = useMemo(
    () =>
      txData_
        ? {
            ...txData_,
            blobAsCalldataGasUsed: BigInt(txData_.blobAsCalldataGasUsed),
            gasPrice: BigInt(txData_.gasPrice),
            maxFeePerBlobGas: BigInt(txData_.maxFeePerBlobGas),
            block: {
              ...txData_.block,
              blobGasPrice: BigInt(txData_.block.blobGasPrice),

              Gas: BigInt(txData_.block.excessBlobGas),
            },
          }
        : undefined,
    [txData_]
  );

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!isLoading && !txData) {
    return <div>Transaction not found</div>;
  }

  const sortedBlobs = txData?.blobs.sort((a, b) => a.index - b.index);
  const blobGasPrice = txData?.block.blobGasPrice ?? BigInt(0);
  const blobGasUsed = txData
    ? BigInt(txData.blobs.length) * BigInt(GAS_PER_BLOB)
    : BigInt(0);
  const totalBlobSize =
    txData?.blobs.reduce((acc, { blob }) => acc + blob.size, 0) ?? 0;

  return (
    <>
      <DetailsLayout
        header="Transaction Details"
        externalLink={
          txData ? buildTransactionExternalUrl(txData.hash) : undefined
        }
        fields={
          txData
            ? [
                { name: "Hash", value: txData.hash },
                {
                  name: "Block",
                  value: (
                    <Link href={buildBlockRoute(txData.blockNumber)}>
                      {txData.blockNumber}
                    </Link>
                  ),
                },
                {
                  name: "Timestamp",
                  value: (
                    <div className="whitespace-break-spaces">
                      {formatTimestamp(txData.block.timestamp)}
                    </div>
                  ),
                },
                {
                  name: "From",
                  value: (
                    <Link href={buildAddressRoute(txData.fromId)}>
                      {txData.fromId}
                    </Link>
                  ),
                },
                {
                  name: "To",
                  value: (
                    <Link href={buildAddressRoute(txData.toId)}>
                      {txData.toId}
                    </Link>
                  ),
                },
                {
                  name: "Total Blob Size",
                  value: formatBytes(totalBlobSize),
                },
                {
                  name: "Blob Fee",
                  value: (
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-1">
                        <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                          Base:
                        </div>
                        <EtherUnitDisplay amount={blobGasPrice * blobGasUsed} />
                      </div>
                      <div className=" flex gap-1">
                        <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                          Max:
                        </div>
                        <EtherUnitDisplay
                          amount={txData.maxFeePerBlobGas * blobGasUsed}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  name: "Blob Gas Price",
                  value: <EtherUnitDisplay amount={blobGasPrice} />,
                },
                {
                  name: "Blob Gas Used",
                  value: formatNumber(blobGasUsed),
                },
                {
                  name: "Blob As Calldata Gas",
                  value: (
                    <div>
                      {formatNumber(txData.blobAsCalldataGasUsed)}{" "}
                      <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
                        (
                        <strong>
                          {formatNumber(
                            performDiv(
                              txData.blobAsCalldataGasUsed,
                              blobGasUsed
                            ),
                            "standard",
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </strong>{" "}
                        times more expensive)
                      </span>
                    </div>
                  ),
                },
              ]
            : undefined
        }
      />

      <Card header={`Blobs ${txData ? `(${txData.blobs.length})` : ""}`}>
        <div className="space-y-6">
          {isLoading || !txData || !sortedBlobs
            ? Array.from({ length: 2 }).map((_, i) => <BlobCard key={i} />)
            : sortedBlobs.map((b) => (
                <BlobCard
                  key={b.blobHash}
                  blob={{
                    commitment: b.blob.commitment,
                    size: b.blob.size,
                    versionedHash: b.blobHash,
                  }}
                />
              ))}
        </div>
      </Card>
    </>
  );
};

export default Tx;
