import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { NextRouter } from "next/router";

import { Card } from "~/components/Cards/Card";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { Copyable } from "~/components/Copyable";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrows } from "~/components/NavArrows";
import { BlockStatus } from "~/components/Status";
import { getFirstBlobNumber } from "~/components/content";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { BlockWithExpandedBlobsAndTransactions } from "~/types";
import {
  BLOB_GAS_LIMIT_PER_BLOCK,
  buildBlockExternalUrl,
  buildSlotExternalUrl,
  deserializeFullBlock,
  formatBytes,
  formatNumber,
  formatTimestamp,
  GAS_PER_BLOB,
  MAX_BLOBS_PER_BLOCK,
  performDiv,
  pluralize,
  TARGET_BLOB_GAS_PER_BLOCK,
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
  const blockNumber = blockData ? blockData.number : undefined;

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
        helpText:
          "Also referred to as the Block Number, the block height represents the length of the blockchain and increases with each newly added block.",
        value: (
          <div className="flex items-center justify-start gap-4">
            {blockData.number}
            {blockNumber !== undefined && (
              <NavArrows
                prev={{
                  tooltip: "Previous Block",
                  href:
                    getFirstBlobNumber() < blockNumber
                      ? `/block_neighbor?blockNumber=${blockNumber}&direction=prev`
                      : undefined,
                }}
                next={{
                  tooltip: "Next Block",
                  href:
                    latestBlock && blockNumber < latestBlock.number
                      ? `/block_neighbor?blockNumber=${blockNumber}&direction=next`
                      : undefined,
                }}
              />
            )}
          </div>
        ),
      },
      {
        name: "Status",
        helpText: "The finality status of the block.",
        value: <BlockStatus blockNumber={blockData.number} />,
      },
      {
        name: "Hash",
        helpText: "The hash of the block header.",
        value: <Copyable value={blockData.hash} tooltipText="Copy Hash" />,
      },
      {
        name: "Timestamp",
        helpText: "The time at which the block was created.",
        value: (
          <div className="whitespace-break-spaces">
            {formatTimestamp(blockData.timestamp)}
          </div>
        ),
      },
      {
        name: "Slot",
        helpText: "The slot number of the block.",
        value: (
          <Link href={buildSlotExternalUrl(blockData.slot)} isExternal>
            {blockData.slot}
          </Link>
        ),
      },
      {
        name: "Blob size",
        helpText: "Total amount of space used for blobs in this block.",
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
        helpText:
          "The cost per unit of blob gas used by the blobs in this block.",
        value: <EtherUnitDisplay amount={blockData.blobGasPrice} />,
      },
      {
        name: "Blob Gas Used",
        helpText: `The total blob gas used by the blobs in this block, along with its percentage relative to both the total blob gas limit and the blob gas target (${(
          TARGET_BLOB_GAS_PER_BLOCK / 1024
        ).toFixed(0)} KB).`,
        value: <BlobGasUsageDisplay blobGasUsed={blockData.blobGasUsed} />,
      },
      {
        name: "Blob Gas Limit",
        helpText: "The maximum blob gas limit for this block.",
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
        helpText:
          "The total gas that would have been used in this block if the blobs were sent as calldata.",
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
