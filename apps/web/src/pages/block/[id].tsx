import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";

import { BlockStatusBadge } from "~/components/Badges/BlockStatusBadge";
import { Card } from "~/components/Cards/Card";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { Copyable } from "~/components/Copyable";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { EtherWithGweiDisplay } from "~/components/Displays/EtherWithGweiDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrows } from "~/components/NavArrows";
import { Separator } from "~/components/Separator";
import { api } from "~/api-client";
import { getFirstBlobNumber } from "~/content";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { useExternalExplorers } from "~/hooks/useExternalExplorers";
import NextError from "~/pages/_error";
import { useEnv } from "~/providers/Env";
import type { BlockWithExpandedBlobsAndTransactions } from "~/types";
import {
  formatBytes,
  formatEthFiatPrice,
  formatFiat,
  formatNumber,
  formatTimestamp,
  performDiv,
  pluralize,
} from "~/utils";

const Block: NextPage = function () {
  const router = useRouter();
  const { buildResourceUrl } = useExternalExplorers("consensus");

  const isReady = router.isReady;
  const blockNumberOrHash = router.query.id as string | undefined;
  const {
    data: blockData,
    error,
    isLoading,
  } = api.block.getByBlockId.useQuery<BlockWithExpandedBlobsAndTransactions>(
    { id: blockNumberOrHash ?? "", expand: "transaction,blob" },
    { enabled: isReady }
  );

  const { data: latestBlock } = api.block.getLatestBlock.useQuery();
  const blockNumber = blockData ? blockData.number : undefined;

  const { env } = useEnv();
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "sm";
  console.log(breakpoint);
  const networkName = env ? env.PUBLIC_NETWORK_NAME : undefined;

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

  if (blockData && env) {
    console.log(blockData);
    const networkBlobConfig = getNetworkBlobConfigBySlot(
      env.PUBLIC_NETWORK_NAME,
      blockData.slot
    );
    const {
      bytesPerFieldElement,
      fieldElementsPerBlob,
      blobGasLimit,
      maxBlobsPerBlock,
      targetBlobGasPerBlock,
    } = networkBlobConfig;
    const blobSize = bytesPerFieldElement * fieldElementsPerBlob;

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

    const firstBlobNumber = networkName
      ? getFirstBlobNumber(networkName)
      : undefined;

    const previousBlockHref =
      firstBlobNumber && blockNumber && firstBlobNumber < blockNumber
        ? `/block_neighbor?blockNumber=${blockNumber}&direction=prev`
        : undefined;

    detailsFields = [
      {
        name: "Block Height",
        helpText:
          "Also referred to as the Block Number, the block height represents the length of the blockchain and increases with each newly added block.",
        value: (
          <div className="flex items-center justify-start gap-4">
            {blockData.number}
            {!!blockNumber && previousBlockHref && (
              <NavArrows
                prev={{
                  tooltip: "Previous Block",
                  href: previousBlockHref,
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
        value: <BlockStatusBadge blockNumber={blockData.number} />,
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
          <Copyable value={blockData.slot.toString()} tooltipText="Copy Slot">
            <Link
              href={buildResourceUrl("beaconchain", {
                type: "slot",
                value: blockData.slot,
              })}
              isExternal
            >
              {blockData.slot}
            </Link>
          </Copyable>
        ),
      },
      {
        name: "Blob size",
        helpText: "Total amount of space used for blobs in this block.",
        value: (
          <div>
            {formatBytes(totalBlockBlobSize)}
            <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
              ({formatNumber(totalBlockBlobSize / blobSize)}{" "}
              {pluralize("blob", totalBlockBlobSize / blobSize)})
            </span>
          </div>
        ),
      },
      {
        name: "Blob Gas Used",
        helpText: `The total blob gas used by transactions in this block, along with its percentage relative to both the total blob gas limit and the blob gas target (${
          targetBlobGasPerBlock / BigInt(1024)
        } KB).`,
        value: (
          <BlobGasUsageDisplay
            networkBlobConfig={networkBlobConfig}
            blobGasUsed={blockData.blobGasUsed}
            compact={isCompact}
          />
        ),
      },
      {
        name: "Excess Blob Gas",
        helpText:
          "The total amount of blob gas consumed in excess of the target, prior to the current block",
        value: (
          <div>
            {blockData.excessBlobGas.toString()}
            <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
              ({formatNumber(Number(blockData.excessBlobGas) / blobSize)}{" "}
              {pluralize("blob", Number(blockData.excessBlobGas) / blobSize)})
            </span>
          </div>
        ),
      },
      {
        name: "Blob Gas Price",
        helpText:
          "The cost per unit of blob gas used by the blobs in this block.",
        value: (
          <EtherWithGweiDisplay
            amount={blockData.blobGasPrice}
            usdAmount={blockData.blobGasUsdPrice}
          />
        ),
      },

      {
        name: "Blob Base Fees",
        helpText:
          "The total blob gas base fees spent on all transactions included in this block.",
        value: (
          <EtherWithGweiDisplay
            amount={blockData.blobBaseFees}
            usdAmount={blockData.blobBaseUsdFees}
          />
        ),
      },
      {
        name: "Blob Gas Limit",
        helpText: "The maximum blob gas limit for this block.",
        value: (
          <div>
            {formatNumber(blobGasLimit)}
            <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
              ({formatNumber(maxBlobsPerBlock)}{" "}
              {pluralize("blob", maxBlobsPerBlock)} per block)
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
        resource={
          blockData
            ? {
                type: "block",
                value: blockData.number,
              }
            : undefined
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
