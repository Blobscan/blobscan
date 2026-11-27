import { useCallback, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/compat/router";
import { skipToken } from "@tanstack/react-query";

import { getBlockBlobTransactionFees } from "~/utils/block-fees";
import { BlockStatusBadge } from "~/components/Badges/BlockStatusBadge";
import { CountBadge } from "~/components/Badges/CountBadge";
import { Card } from "~/components/Cards/Card";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { ContentReveal } from "~/components/ContentReveal";
import { Copyable } from "~/components/Copyable";
import { DetailsValueSkeleton } from "~/components/DetailsValueSkeleton";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { EtherDisplay } from "~/components/Displays/EtherDisplay";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrow } from "~/components/NavArrow";
import type { NavArrowProps } from "~/components/NavArrow";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { TransactionFeeDistribution } from "~/components/TransactionFeeDistribution";
import { captureNavArrowClick } from "~/analytics";
import { api } from "~/api-client";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { useChain } from "~/hooks/useChain";
import { useExternalExplorers } from "~/hooks/useExternalExplorers";
import { useIsMainnet } from "~/hooks/useIsMainnet";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import { hashSchema } from "~/schemas/utils";
import type { BlockWithExpandedBlobsAndTransactions } from "~/types";
import { formatNumber, formatTimestamp, performDiv, pluralize } from "~/utils";

const FIELD_HELP = {
  Hash: "The hash of the block header.",
  Status: "The finality status of the block.",
  "Block Height":
    "Also referred to as the Block Number, the block height represents the length of the blockchain and increases with each newly added block.",
  Timestamp: "The time at which the block was created.",
  Slot: "The slot number of the block.",
  Epoch: "The consensus layer epoch the block's slot belongs to.",
  "Blob Usage": "Used blob data and total blob size for this block.",
  "Blob Transaction Fees":
    "Total execution base, priority, and blob fees paid by blob transactions in this block. Excludes ordinary transactions. Unavailable when fee data is incomplete.",
  "Base Fee":
    "Base prices per unit of execution gas and blob gas. Both are burned. Priority fees are excluded.",
  "Excess Blob Gas":
    "The total amount of blob gas consumed in excess of the target, prior to the current block",
  "Blob As Calldata Gas":
    "The estimated gas to send the same blob data as calldata. This is not additional gas charged to the block.",
  "ETH Price": "The price of 1 ETH in USD at the time this block was produced.",
  "Blob Gas Used":
    "The total blob gas used by transactions in this block, compared with the blob gas limit and target.",
};

const EXPAND_QUERY_PARAM = "transaction,blob";
const ADJACENT_BLOCK_CACHE_ONLY_OPTIONS = {
  enabled: false,
  staleTime: Infinity,
} as const;

const Block: NextPage = function () {
  const router = useRouter();
  const isMainnet = useIsMainnet();
  const utils = api.useUtils();
  const { buildResourceUrl } = useExternalExplorers("consensus");
  const [adjacentBlockLoading, setAdjacentBlockLoading] = useState(false);
  const [adjacentBlockError, setAdjacentBlockError] = useState<Error>();

  const isReady = router?.isReady;
  const blockNumberOrHash = router?.query.id as string | undefined;
  const { data: latestBlock } = api.block.getLatest.useQuery(undefined, {
    retry: false,
    refetchOnReconnect: false,
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
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );
  const blockNumber = blockData?.number;
  const chain = useChain();
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "sm";
  const isFirstBlock =
    blockNumber && chain ? blockNumber <= chain.firstBlobBlock.number : false;
  const isLatestBlock =
    blockNumber && latestBlock ? blockNumber >= latestBlock.number : false;
  // These queries do not send a request. They only read the cache that a click
  // fills, so an arrow becomes disabled when its result is `null`.
  const { data: prevBlock } = api.block.getAdjacentBlock.useQuery(
    blockNumber
      ? { blockNumber, direction: "prev", expand: EXPAND_QUERY_PARAM }
      : skipToken,
    ADJACENT_BLOCK_CACHE_ONLY_OPTIONS
  );
  const { data: nextBlock } = api.block.getAdjacentBlock.useQuery(
    blockNumber
      ? { blockNumber, direction: "next", expand: EXPAND_QUERY_PARAM }
      : skipToken,
    ADJACENT_BLOCK_CACHE_ONLY_OPTIONS
  );

  const handleNavClick = useCallback<NavArrowProps["onClick"]>(
    async function (direction) {
      if (!blockData) {
        return;
      }

      setAdjacentBlockLoading(true);
      setAdjacentBlockError(undefined);

      const currentBlockNumber = blockData.number;
      const startedAt = performance.now();

      try {
        const adjacentBlock = await utils.block.getAdjacentBlock.ensureData(
          {
            blockNumber: currentBlockNumber,
            direction,
            expand: EXPAND_QUERY_PARAM,
          },
          {
            staleTime: Infinity,
          }
        );

        if (!adjacentBlock) {
          captureNavArrowClick({
            page: "block",
            direction,
            outcome: "none",
            startedAt,
          });

          return;
        }

        utils.block.getByBlockId.setData(
          {
            id: adjacentBlock.number.toString(),
            expand: EXPAND_QUERY_PARAM,
          },
          adjacentBlock
        );

        utils.block.getAdjacentBlock.setData(
          {
            blockNumber: adjacentBlock.number,
            direction: direction === "next" ? "prev" : "next",
            expand: EXPAND_QUERY_PARAM,
          },
          blockData
        );

        const navigated = await router?.push(
          routes.block(adjacentBlock.number)
        );

        captureNavArrowClick({
          page: "block",
          direction,
          // `push` resolves `false` when another navigation cancels it.
          outcome: navigated === false ? "cancelled" : "navigated",
          startedAt,
        });
      } catch (err) {
        captureNavArrowClick({
          page: "block",
          direction,
          outcome: "error",
          startedAt,
        });
        setAdjacentBlockError(
          err instanceof Error
            ? err
            : new Error("Could not get the adjacent block")
        );
      } finally {
        setAdjacentBlockLoading(false);
      }
    },
    [utils, router, blockData]
  );

  if (error) {
    const blockId = hashSchema.safeParse(blockNumberOrHash).success
      ? "hash"
      : "number";

    return (
      <ErrorPage
        error={error}
        overrides={{
          NOT_FOUND: {
            title: "Block not found",
            description: `We couldn't find a block matching this block ${blockId}.`,
          },
          BAD_REQUEST: {
            title: "Invalid block id",
            description:
              "The block id you provided is invalid. Check is a correct block number or hash.",
          },
        }}
      />
    );
  }

  let detailsFields: DetailsLayoutProps["fields"] | undefined;

  if (blockData && chain) {
    const blobTransactionFees = getBlockBlobTransactionFees(blockData);
    const activeFork = chain.getActiveForkBySlot(blockData.slot);
    const {
      bytesPerFieldElement,
      fieldElementsPerBlob,
      targetBlobGasPerBlock,
    } = activeFork.blobParams;
    const blobSize = bytesPerFieldElement * fieldElementsPerBlob;
    const epoch = blockData.epoch ?? chain.getEpochBySlot(blockData.slot);

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

    detailsFields = [
      {
        name: "Hash",
        value: <Copyable value={blockData.hash} tooltipText="Copy Hash" />,
      },
      {
        name: "Status",
        value: <BlockStatusBadge blockNumber={blockData.number} />,
      },
      {
        name: "Block Height",
        value: (
          <div className="flex items-center justify-start gap-4">
            {blockData.number}
          </div>
        ),
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
        name: "Epoch",
        value: (
          <Copyable value={epoch.toString()} tooltipText="Copy Epoch">
            <Link
              href={buildResourceUrl("beaconchain", {
                type: "epoch",
                value: epoch,
              })}
              isExternal
            >
              {epoch}
            </Link>
          </Copyable>
        ),
      },
      {
        name: "Blob Usage",
        value: (
          <BlobUsageDisplay
            blobSize={totalBlobSize}
            blobUsage={totalBlobUsageSize}
            showTotal
            variant="minimal"
            width="full"
          />
        ),
      },
      {
        name: "Blob Transaction Fees",
        value:
          blobTransactionFees == null ? (
            "Unavailable"
          ) : (
            <div className="w-full">
              <EtherDisplay
                weiAmount={blobTransactionFees.totalFee}
                ethUsdPrice={blockData.ethUsdPrice}
              />
              <TransactionFeeDistribution
                executionBaseFee={blobTransactionFees.executionBaseFee}
                priorityFee={blobTransactionFees.priorityFee}
                blobFee={blobTransactionFees.blobFee}
              />
            </div>
          ),
      },
      {
        name: "Base Fee",
        revealValue: false,
        value: (
          <div className="flex flex-col gap-4">
            <div className="flex gap-1">
              <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Execution:
              </div>
              <ContentReveal className="flex flex-wrap items-center gap-1">
                {blockData.baseFeePerGas != null ? (
                  <EtherDisplay
                    weiAmount={blockData.baseFeePerGas}
                    ethUsdPrice={blockData.ethUsdPrice}
                    opts={{ toUnit: "Gwei" }}
                  />
                ) : (
                  "Unavailable"
                )}
              </ContentReveal>
            </div>
            <div className="flex gap-1">
              <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Blob:
              </div>
              <ContentReveal className="flex flex-wrap items-center gap-1">
                <EtherDisplay
                  weiAmount={blockData.blobGasPrice}
                  usdAmount={blockData.blobGasUsdPrice}
                  opts={{ toUnit: "Gwei" }}
                />
              </ContentReveal>
            </div>
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
            blobParams={activeFork.blobParams}
            showTotal
            width="full"
            blobGasUsed={blockData.blobGasUsed}
            variant={isCompact ? "minimal" : "detailed"}
          />
        ),
      },
      {
        name: "Excess Blob Gas",
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
        name: "Blob As Calldata Gas",
        value: (
          <div className="flex flex-wrap items-center gap-1">
            {formatNumber(blockData.blobAsCalldataGasUsed)}
            <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
              (
              <strong>
                {formatNumber(
                  performDiv(
                    blockData.blobAsCalldataGasUsed,
                    blockData.blobGasUsed
                  ),
                  "compact",
                  { maximumFractionDigits: 2 }
                )}
              </strong>
              × gas)
            </span>
          </div>
        ),
      },
    ];

    if (isMainnet && blockData.ethUsdPrice) {
      detailsFields.push({
        name: "ETH Price",
        value: <FiatDisplay amount={blockData.ethUsdPrice} />,
      });
    }
  }

  return (
    <>
      <SeoMetaTags
        title={`Block ${blockNumberOrHash ?? "Details"}`}
        description={`Explore block details${
          blockNumberOrHash ? ` for block ${blockNumberOrHash}` : ""
        } on Blobscan.`}
      />
      <DetailsLayout
        header={
          <div className="flex items-center justify-start gap-4">
            <NavArrow
              type="prev"
              size="lg"
              onClick={() => {
                handleNavClick("prev");
              }}
              tooltip="Prev Block"
              disabled={
                isFirstBlock ||
                prevBlock === null ||
                adjacentBlockLoading ||
                !blockNumber
              }
            />
            Block Details
            <NavArrow
              type="next"
              size="lg"
              onClick={() => handleNavClick("next")}
              tooltip="Next Block"
              disabled={
                isLatestBlock ||
                nextBlock === null ||
                adjacentBlockLoading ||
                !blockNumber
              }
            />
            {adjacentBlockError && (
              <span className="text-sm font-normal text-error-600 dark:text-error-300">
                Couldn&apos;t load the adjacent block
              </span>
            )}
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
        fieldHelp={FIELD_HELP}
        loadingFields={[
          "Hash",
          { name: "Status", value: <DetailsValueSkeleton variant="badge" /> },
          "Block Height",
          "Timestamp",
          "Slot",
          "Epoch",
          { name: "Blob Usage", value: <DetailsValueSkeleton variant="bar" /> },
          {
            name: "Blob Transaction Fees",
            value: <DetailsValueSkeleton variant="distribution" />,
          },
          {
            name: "Base Fee",
            value: (
              <DetailsValueSkeleton
                variant="subfields"
                labels={["Execution", "Blob"]}
              />
            ),
          },
          {
            name: "Blob Gas Used",
            value: <DetailsValueSkeleton variant="bar" />,
          },
          "Excess Blob Gas",
          "Blob As Calldata Gas",
          ...(isMainnet ? ["ETH Price"] : []),
        ]}
      />

      <Card
        header={
          <div className="flex items-center gap-2">
            Blob Transactions
            <CountBadge count={blockData?.transactions.length} size="sm" />
          </div>
        }
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
