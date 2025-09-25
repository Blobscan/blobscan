import { useCallback, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { BlockStatusBadge } from "~/components/Badges/BlockStatusBadge";
import { Card } from "~/components/Cards/Card";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { Copyable } from "~/components/Copyable";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { EtherDisplay } from "~/components/Displays/EtherDisplay";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import type { NavArrowsProps } from "~/components/NavArrows";
import { NavArrows } from "~/components/NavArrows";
import { api } from "~/api-client";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { useExternalExplorers } from "~/hooks/useExternalExplorers";
import { useNetworkConfig } from "~/hooks/useNetworkConfig";
import NextError from "~/pages/_error";
import type { BlockWithExpandedBlobsAndTransactions } from "~/types";
import {
  buildBlockRoute,
  formatBytes,
  formatNumber,
  formatTimestamp,
  performDiv,
  pluralize,
} from "~/utils";

const EXPAND_QUERY_PARAM = "transaction,blob";

const Block: NextPage = function () {
  const router = useRouter();
  const utils = api.useUtils();
  const { buildResourceUrl } = useExternalExplorers("consensus");
  const [adjacentBlockLoading, setAdjacentBlockLoading] = useState(false);

  const isReady = router.isReady;
  const blockNumberOrHash = router.query.id as string | undefined;
  const { data: latestBlock } = api.block.getLatest.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const {
    data: blockData,
    error,
    isLoading,
  } = api.block.getByBlockId.useQuery<BlockWithExpandedBlobsAndTransactions>(
    { id: blockNumberOrHash ?? "", expand: EXPAND_QUERY_PARAM },
    {
      enabled: isReady,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
  const blockNumber = blockData?.number;
  const { config: networkBlobConfig, firstBlock } =
    useNetworkConfig(blockNumber);
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "sm";
  const isFirstBlock =
    blockNumber && firstBlock ? blockNumber <= firstBlock.number : false;
  const isLatestBlock =
    blockNumber && latestBlock ? blockNumber >= latestBlock.number : false;

  const handleNavClick = useCallback<NavArrowsProps["onClick"]>(
    async function (direction) {
      if (!blockNumber) {
        return;
      }

      setAdjacentBlockLoading(true);

      try {
        const adjacentBlock = await utils.block.getAdjacentBlock.ensureData(
          {
            blockNumber,
            direction,
            expand: EXPAND_QUERY_PARAM,
          },
          {
            staleTime: Infinity,
          }
        );

        utils.block.getByBlockId.setData(
          {
            id: adjacentBlock.number.toString(),
            expand: EXPAND_QUERY_PARAM,
          },
          adjacentBlock
        );

        router.push(buildBlockRoute(adjacentBlock.number));
      } finally {
        setAdjacentBlockLoading(false);
      }
    },
    [utils, router, blockNumber]
  );

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

  if (blockData && networkBlobConfig) {
    const {
      bytesPerFieldElement,
      fieldElementsPerBlob,
      blobGasLimit,
      maxBlobsPerBlock,
      targetBlobGasPerBlock,
    } = networkBlobConfig;
    const blobSize = bytesPerFieldElement * fieldElementsPerBlob;

    const totalBlobSize = blockData?.transactions.reduce((acc, { blobs }) => {
      const totalBlobsSize = blobs.reduce(
        (blobAcc, { size }) => blobAcc + size,
        0
      );

      return acc + totalBlobsSize;
    }, 0);
    const totalBlobUsageSize = blockData?.transactions.reduce(
      (acc, { blobs }) => {
        const totalusageSize = blobs.reduce(
          (blobAcc, { usageSize }) => blobAcc + usageSize,
          0
        );

        return acc + totalusageSize;
      },
      0
    );
    const blobCount = totalBlobSize / blobSize;

    detailsFields = [
      {
        name: "Block Height",
        helpText:
          "Also referred to as the Block Number, the block height represents the length of the blockchain and increases with each newly added block.",
        value: (
          <div className="flex items-center justify-start gap-4">
            {blockData.number}
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
        name: "Blob Size",
        helpText: "The total amount of blob data in this block.",
        value: (
          <span>
            {formatBytes(totalBlobSize)}
            <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
              ({formatNumber(blobCount)} {pluralize("blob", blobCount)})
            </span>
          </span>
        ),
      },
      {
        name: "Blob Usage",
        helpText:
          "The actual amount of blob data in this block that contains meaningful, non-zero content.",
        value: (
          <BlobUsageDisplay
            blobSize={totalBlobSize}
            blobUsage={totalBlobUsageSize}
            variant="minimal"
          />
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
            variant={isCompact ? "minimal" : "detailed"}
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
          <EtherDisplay
            weiAmount={blockData.blobGasPrice}
            usdAmount={blockData.blobGasUsdPrice}
            opts={{
              toUnit: "Gwei",
            }}
          />
        ),
      },

      {
        name: "Blob Base Fees",
        helpText:
          "The total blob gas base fees spent on all transactions included in this block.",
        value: (
          <EtherDisplay
            weiAmount={blockData.blobGasBaseFee}
            usdAmount={blockData.blobGasBaseUsdFee}
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

    if (blockData.ethUsdPrice) {
      detailsFields.push({
        name: "ETH Price",
        helpText:
          "The price of 1 ETH in USD at the time this block was produced.",
        value: <FiatDisplay amount={blockData.ethUsdPrice} />,
      });
    }
  }

  return (
    <>
      <DetailsLayout
        header={
          <div className="flex items-center justify-start gap-4">
            Block Details
            <NavArrows
              size="lg"
              arrows={{
                prev: {
                  tooltip: "Prev Block",
                  disabled:
                    isFirstBlock || adjacentBlockLoading || !blockNumber,
                },
                next: {
                  tooltip: "Next Block",
                  disabled:
                    isLatestBlock || adjacentBlockLoading || !blockNumber,
                },
              }}
              onClick={handleNavClick}
            />
          </div>
        }
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
