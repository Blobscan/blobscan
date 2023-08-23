import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";
import type { NextRouter } from "next/router";

import { Card } from "~/components/Cards/Card";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import {
  buildBlockExternalUrl,
  buildSlotExternalUrl,
  formatBytes,
  formatTimestamp,
} from "~/utils";

function performBlockQuery(router: NextRouter) {
  const isReady = router.isReady;
  const blockNumberOrHash = router.query.id as string | undefined;
  const blockNumber = Number(blockNumberOrHash);

  if (!Number.isNaN(blockNumber)) {
    return api.block.getByBlockNumber.useQuery({ number: blockNumber });
  }

  return api.block.getByHash.useQuery(
    { hash: blockNumberOrHash ?? "" },
    { enabled: isReady }
  );
}

const Block: NextPage = function () {
  const router = useRouter();
  const { data: blockData, error, isLoading } = performBlockQuery(router);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!isLoading && !blockData) {
    return <div>Block not found</div>;
  }

  const totalBlobSize =
    blockData?.transactions.reduce(
      (acc, tx) => acc + tx.blobs.reduce((acc, { blob }) => acc + blob.size, 0),
      0
    ) ?? 0;

  return (
    <>
      <DetailsLayout
        header="Block Details"
        externalLink={
          blockData ? buildBlockExternalUrl(blockData.number) : undefined
        }
        fields={
          blockData
            ? [
                { name: "Block Height", value: blockData.number },
                { name: "Hash", value: blockData.hash },
                {
                  name: "Timestamp",
                  value: (
                    <div className="whitespace-break-spaces">
                      {formatTimestamp(blockData.timestamp)}
                    </div>
                  ),
                },
                {
                  name: "Slot",
                  value: (
                    <Link
                      href={buildSlotExternalUrl(blockData.slot)}
                      isExternal
                    >
                      {blockData.slot}
                    </Link>
                  ),
                },
                {
                  name: "Blob Gas Used",
                  value: blockData.blobGasUsed.toString(),
                },
                {
                  name: "Total Blob Size",
                  value: formatBytes(totalBlobSize),
                },
              ]
            : undefined
        }
      />

      <Card
        header={`Blob Transactions ${
          blockData ? `(${blockData.transactions.length})` : ""
        }`}
      >
        <div className="space-y-6">
          {isLoading || !blockData
            ? Array.from({ length: 3 }).map((_, i) => (
                <BlobTransactionCard key={i} />
              ))
            : blockData.transactions.map((t) => (
                <BlobTransactionCard key={t.hash} transaction={t} />
              ))}
        </div>
      </Card>
    </>
  );
};

export default Block;
