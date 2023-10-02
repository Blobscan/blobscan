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
  formatNumber,
  formatTimestamp,
  formatWei,
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
                { name: "Block Height", value: formatNumber(blockData.number) },
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
                      {formatNumber(blockData.slot)}
                    </Link>
                  ),
                },
                {
                  name: "Total Blob Size",
                  value: formatBytes(totalBlobSize),
                },
                {
                  name: "Blob Gas Price",
                  value: formatWei(blockData.blobGasPrice),
                },
                {
                  name: "Total Blob Gas Used",
                  value: formatNumber(blockData.blobGasUsed),
                },
                {
                  name: "Total Blob As Calldata Gas",
                  value: (
                    <div>
                      {formatNumber(blockData.blobAsCalldataGasUsed)}
                      <span className="ml-1">
                        (
                        <strong>
                          {formatNumber(
                            blockData.blobAsCalldataGasUsed /
                              blockData.blobGasUsed,
                            "standard",
                            { maximumFractionDigits: 2 }
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
