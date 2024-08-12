import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { NextRouter } from "next/router";

import { Card } from "~/components/Cards/Card";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { Copyable } from "~/components/CopyToClipboard";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { StandardEtherUnitDisplay } from "~/components/Displays/StandardEtherUnitDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrows } from "~/components/NavArrow";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { BlockWithExpandedBlobsAndTransactions } from "~/types";
import {
  BLOB_GAS_LIMIT_PER_BLOCK,
  buildBlockExternalUrl,
  buildBlockRoute,
  buildSlotExternalUrl,
  deserializeFullBlock,
  formatBytes,
  formatNumber,
  formatTimestamp,
  GAS_PER_BLOB,
  MAX_BLOBS_PER_BLOCK,
  performDiv,
  pluralize,
} from "~/utils";

function performBlockQuery(router: NextRouter) {
  const isReady = router.isReady;
  const blockNumberOrHash = router.query.id as string | undefined;

  return api.block.getByBlockId.useQuery<BlockWithExpandedBlobsAndTransactions>(
    { id: blockNumberOrHash ?? "", expand: "transaction,blob" },
    { enabled: isReady }
  );
}

const Block: NextPage = function () {
  const router = useRouter();
  const { data: rawBlockData, error, isLoading } = performBlockQuery(router);
  const blockData = useMemo(() => {
    if (!rawBlockData) {
      return;
    }

    return deserializeFullBlock(rawBlockData);
  }, [rawBlockData]);
  const { data: latestBlock } = api.block.getLatestBlock.useQuery();

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

  let detailsFields: DetailsLayoutProps["fields"] | undefined;

  if (blockData) {
    const totalBlockBlobSize = blockData?.transactions.reduce(
      (acc, { blobs }) => {
        const totalBlobsSize = blobs.reduce(
          (blobAcc, { size }) => blobAcc + size,
          0
        );

        return acc + totalBlobsSize;
      },
      0
    );

    detailsFields = [
      {
        name: "Block Height",
        value: (
          <div className="flex items-center justify-start gap-4">
            {blockData.number}
            {latestBlock && (
              <NavArrows
                prev={buildBlockRoute(blockData.number - 1)}
                next={
                  latestBlock.number > blockData.number
                    ? buildBlockRoute(blockData.number + 1)
                    : undefined
                }
              />
            )}
          </div>
        ),
      },
      {
        name: "Hash",
        value: <Copyable value={blockData.hash} label="Copy Hash" />,
      },
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
          <Link href={buildSlotExternalUrl(blockData.slot)} isExternal>
            {blockData.slot}
          </Link>
        ),
      },
      {
        name: "Blob Size",
        value: (
          <div>
            {formatBytes(totalBlockBlobSize)}
            <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
              ({formatNumber(totalBlockBlobSize / GAS_PER_BLOB)}{" "}
              {pluralize("blob", totalBlockBlobSize / GAS_PER_BLOB)})
            </span>
          </div>
        ),
      },
      {
        name: "Blob Gas Price",
        value: <StandardEtherUnitDisplay amount={blockData.blobGasPrice} />,
      },
      {
        name: "Blob Gas Used",
        value: <BlobGasUsageDisplay blobGasUsed={blockData.blobGasUsed} />,
      },
      {
        name: "Blob Gas Limit",
        value: (
          <div>
            {formatNumber(BLOB_GAS_LIMIT_PER_BLOCK)}
            <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
              ({formatNumber(MAX_BLOBS_PER_BLOCK)}{" "}
              {pluralize("blob", MAX_BLOBS_PER_BLOCK)} per block)
            </span>
          </div>
        ),
      },
      {
        name: "Blob As Calldata Gas",
        value: (
          <div>
            {formatNumber(blockData.blobAsCalldataGasUsed)}
            <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
              (
              <strong>
                {formatNumber(
                  performDiv(
                    blockData.blobAsCalldataGasUsed,
                    blockData.blobGasUsed
                  ),
                  "standard",
                  { maximumFractionDigits: 2 }
                )}
              </strong>{" "}
              times more expensive)
            </span>
          </div>
        ),
      },
    ];
  }

  return (
    <>
      <DetailsLayout
        header="Block Details"
        externalLink={
          blockData ? buildBlockExternalUrl(blockData.number) : undefined
        }
        fields={detailsFields}
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
            : blockData.transactions.map(({ blobs, ...tx }) => (
                <BlobTransactionCard
                  key={tx.hash}
                  transaction={{ ...tx, blockNumber: blockData.number }}
                  blobs={blobs}
                />
              ))}
        </div>
      </Card>
    </>
  );
};

export default Block;
