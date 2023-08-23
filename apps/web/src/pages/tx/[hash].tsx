import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { Card } from "~/components/Cards/Card";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionExternalUrl,
  formatTimestamp,
  GAS_PER_BLOB,
  formatWei,
  calculateBlobGasPrice,
  formatBytes,
} from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const hash = (router.query.hash as string | undefined) ?? "";

  const {
    data: txData,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery({ hash }, { enabled: router.isReady });

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
  const blobGasPrice = txData
    ? calculateBlobGasPrice(txData.block.excessBlobGas)
    : BigInt(0);
  const blobGasUsed = txData
    ? BigInt(txData.blobs.length) * GAS_PER_BLOB
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
                  name: "Blob Fee",
                  value: (
                    <div className="flex gap-4">
                      <div>
                        <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                          Base:
                        </span>
                        {formatWei(blobGasPrice * blobGasUsed)}
                      </div>
                      <div>
                        <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                          Max:
                        </span>
                        {formatWei(txData.maxFeePerBlobGas * blobGasUsed)}
                      </div>
                    </div>
                  ),
                },
                {
                  name: "Blob Gas Price",
                  value: formatWei(blobGasPrice),
                },
                {
                  name: "Blob Gas Used",
                  value: blobGasUsed.toString(),
                },
                {
                  name: "Total Blob Size",
                  value: formatBytes(totalBlobSize),
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
