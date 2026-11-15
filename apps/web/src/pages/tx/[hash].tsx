import { useCallback, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/compat/router";
import { skipToken, useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";

import { BlockStatusBadge } from "~/components/Badges/BlockStatusBadge";
import { CategoryBadge } from "~/components/Badges/CategoryBadge";
import { CountBadge } from "~/components/Badges/CountBadge";
import { StatusBadge } from "~/components/Badges/StatusBadge";
import { Card } from "~/components/Cards/Card";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { CopyToClipboard } from "~/components/CopyToClipboard";
import { Copyable } from "~/components/Copyable";
import { DetailsValueSkeleton } from "~/components/DetailsValueSkeleton";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { EtherDisplay } from "~/components/Displays/EtherDisplay";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import { Textarea } from "~/components/Inputs/Textarea";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrow } from "~/components/NavArrow";
import type { NavArrowProps } from "~/components/NavArrow";
import { OptimismCard } from "~/components/OptimismCard";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { Separator } from "~/components/Separator";
import { TransactionFeeDistribution } from "~/components/TransactionFeeDistribution";
import { api } from "~/api-client";
import { useIsMainnet } from "~/hooks/useIsMainnet";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import type {
  GetSenderAdjacentTxInput,
  TransactionWithExpandedBlockAndBlob,
} from "~/types";
import {
  formatTimestamp,
  formatNumber,
  performDiv,
  toChecksumAddress,
} from "~/utils";

const TX_EXPAND = "block,blob";
// The signed storage URLs in a transaction response expire after one hour.
// Thus the page does not use a cached transaction that is older than this
// time.
const TX_STALE_TIME = 5 * 60 * 1000;

function toSenderAdjacentTxInput(
  hash: string,
  direction: GetSenderAdjacentTxInput["direction"]
): GetSenderAdjacentTxInput {
  return { hash, direction, expand: TX_EXPAND };
}

const Tx: NextPage = () => {
  const router = useRouter();
  const isMainnet = useIsMainnet();
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  const hash = (router?.query.hash as string | undefined) ?? "";
  const {
    data: tx,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery<TransactionWithExpandedBlockAndBlob>(
    { hash, expand: TX_EXPAND },
    {
      enabled: router?.isReady,
      staleTime: TX_STALE_TIME,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  // The page requests an adjacent transaction only when the user clicks an
  // arrow.
  // These queries do not send a request. They only read the cache that the
  // click fills, so an arrow becomes disabled when its result is `null`.
  const cacheOnlyOptions = { enabled: false, staleTime: Infinity } as const;
  const { data: prevTx } = api.tx.getSenderAdjacentTx.useQuery(
    hash ? toSenderAdjacentTxInput(hash, "prev") : skipToken,
    cacheOnlyOptions
  );
  const { data: nextTx } = api.tx.getSenderAdjacentTx.useQuery(
    hash ? toSenderAdjacentTxInput(hash, "next") : skipToken,
    cacheOnlyOptions
  );
  const [adjacentTxLoading, setAdjacentTxLoading] = useState(false);
  const [adjacentTxError, setAdjacentTxError] = useState<Error>();

  const handleNavClick = useCallback<NavArrowProps["onClick"]>(
    async (direction) => {
      if (!hash) {
        return;
      }

      setAdjacentTxLoading(true);
      setAdjacentTxError(undefined);

      try {
        const adjacentInput = toSenderAdjacentTxInput(hash, direction);
        const adjacentTx = await utils.tx.getSenderAdjacentTx.ensureData(
          adjacentInput,
          { staleTime: TX_STALE_TIME }
        );

        if (!adjacentTx) {
          return;
        }

        // Put the adjacent transaction in the cache of its page, so that the
        // page does not send a second request. The cache entry keeps the time
        // of the request, so that an old transaction does not show as new.
        //
        // Do not put the current transaction in the cache as the adjacent
        // transaction of the new page in the opposite direction. The search in
        // the opposite direction does not return a transaction in a reorged
        // block. The response does not tell if the block of the current
        // transaction is reorged.
        const adjacentUpdatedAt = queryClient.getQueryState(
          getQueryKey(api.tx.getSenderAdjacentTx, adjacentInput, "query")
        )?.dataUpdatedAt;

        utils.tx.getByHash.setData(
          { hash: adjacentTx.hash, expand: TX_EXPAND },
          adjacentTx,
          { updatedAt: adjacentUpdatedAt }
        );

        await router?.push(routes.tx(adjacentTx.hash));
      } catch (err) {
        setAdjacentTxError(
          err instanceof Error
            ? err
            : new Error("Could not get the adjacent transaction")
        );
      } finally {
        setAdjacentTxLoading(false);
      }
    },
    [hash, queryClient, router, utils]
  );

  if (error) {
    return (
      <ErrorPage
        error={error}
        overrides={{
          NOT_FOUND: {
            title: "Transaction Not Found",
            description: "We couldn't find a transaction matching this hash.",
          },
          BAD_REQUEST: {
            title: "Invalid Transaction Hash",
            description: "The transaction hash you are looking for is invalid.",
          },
        }}
      />
    );
  }

  let detailsFields: DetailsLayoutProps["fields"] | undefined;

  if (tx) {
    detailsFields = [];

    const {
      blobAsCalldataGasUsed,
      blobs,
      block,
      hash,
      blockNumber,
      blockTimestamp,
      from,
      to,
      rollup,
      category,
      blobGasUsdPrice,
      blobGasUsed,
      blobGasBaseFee,
      blobGasBaseUsdFee,
      blobGasMaxFee,
      blobGasMaxUsdFee,
      blobAsCalldataGasFee,
      ethUsdPrice,
    } = tx;
    const checksumFrom = toChecksumAddress(from);
    const checksumTo = toChecksumAddress(to);

    detailsFields = [
      {
        name: "Hash",
        helpText: "The unique hash of this transaction.",
        value: <Copyable value={hash} tooltipText="Copy Hash" />,
      },
      {
        name: "Status",
        helpText: "The block finality and transaction execution status.",
        value: (
          <div className="flex flex-wrap items-center gap-2">
            <BlockStatusBadge blockNumber={blockNumber} />
            {tx.executionStatus && <StatusBadge status={tx.executionStatus} />}
          </div>
        ),
      },
      {
        name: "Block",
        helpText: "The block that contains this item.",
        value: <Link href={routes.block(blockNumber)}>{blockNumber}</Link>,
      },
      {
        name: "Timestamp",
        helpText: "The time of the block that contains this item.",
        value: (
          <div className="whitespace-break-spaces">
            {formatTimestamp(blockTimestamp)}
          </div>
        ),
      },
      {
        name: "Position In Block",
        helpText:
          "The position of this transaction in the block, starting from zero.",
        value: tx.index,
      },
      {
        name: "From",
        helpText: "The address that sent this transaction.",
        value: (
          <Copyable value={checksumFrom} tooltipText="Copy from address">
            <Link href={routes.address(from)}>{checksumFrom}</Link>
          </Copyable>
        ),
      },
      {
        name: "To",
        helpText: "The destination address of this transaction.",
        value: (
          <Copyable value={checksumTo} tooltipText="Copy to address">
            <Link href={routes.address(to)}>{checksumTo}</Link>
          </Copyable>
        ),
      },
    ];

    detailsFields.push({
      name: "Category",
      helpText:
        "Rollup when the transaction posts blobs for a known rollup. Other when it does not.",
      value: <CategoryBadge category={category} rollup={rollup ?? undefined} />,
    });

    const totalBlobSize = blobs.reduce((acc, b) => acc + b.size, 0);
    const totalBlobUsageSize = blobs.reduce((acc, b) => acc + b.usageSize, 0);

    detailsFields.push(
      {
        name: "Blob Usage",

        helpText:
          "The total size of blob data after trailing zero bytes are removed. The percentage compares this size with the full blob size.",

        value: (
          <BlobUsageDisplay
            blobSize={totalBlobSize}
            blobUsage={totalBlobUsageSize}
            variant="minimal"
            width="full"
            showTotal
          />
        ),
      },

      {
        name: "Total Fee",
        helpText:
          "The execution base fee, priority fee, and blob fee paid by this transaction.",
        value:
          tx.totalFee != null ? (
            <div className="w-full">
              <EtherDisplay weiAmount={tx.totalFee} ethUsdPrice={ethUsdPrice} />
              <TransactionFeeDistribution
                executionBaseFee={tx.executionBaseFee}
                priorityFee={tx.priorityFee}
                blobFee={tx.blobGasBaseFee}
              />
            </div>
          ) : (
            "Unavailable"
          ),
      },
      {
        name: "Execution Fee",
        helpText:
          "Base is the execution fee burned. Priority is the fee paid to the block proposer. Their sum is the execution fee, including calldata.",
        value: (
          <div className="flex flex-col gap-4">
            <div className="flex gap-1">
              <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Base:
              </div>
              {tx.executionBaseFee != null ? (
                <EtherDisplay
                  weiAmount={tx.executionBaseFee}
                  ethUsdPrice={ethUsdPrice}
                />
              ) : (
                "Unavailable"
              )}
            </div>
            <div className="flex gap-1">
              <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Priority:
              </div>
              {tx.priorityFee != null ? (
                <EtherDisplay
                  weiAmount={tx.priorityFee}
                  ethUsdPrice={ethUsdPrice}
                />
              ) : (
                "Unavailable"
              )}
            </div>
          </div>
        ),
      },
      {
        name: "Blob Fee",
        helpText:
          "Base is the blob fee paid. Max is the maximum total blob fee allowed by the sender. These amounts exclude execution gas fees.",
        value: (
          <div className="flex flex-col gap-4">
            {blobGasBaseFee ? (
              <div className="flex gap-1">
                <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                  Base:
                </div>
                <EtherDisplay
                  weiAmount={blobGasBaseFee}
                  usdAmount={blobGasBaseUsdFee}
                />
              </div>
            ) : null}
            <div className=" flex gap-1">
              <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Max:
              </div>
              <EtherDisplay
                weiAmount={blobGasMaxFee}
                usdAmount={blobGasMaxUsdFee}
              />
            </div>
          </div>
        ),
      },
      {
        name: "Gas Used",
        helpText:
          "Execution gas and blob gas charged for this transaction. These are separate gas units.",
        value: (
          <div className="flex flex-col gap-4">
            <div className="flex gap-1">
              <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Execution:
              </span>
              {tx.gasUsed != null ? formatNumber(tx.gasUsed) : "Unavailable"}
            </div>
            <div className="flex gap-1">
              <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Blob:
              </span>
              {formatNumber(blobGasUsed)}
            </div>
          </div>
        ),
      },
      {
        name: "Gas Price",
        helpText:
          "The price per gas unit. Execution includes the priority fee. Blob is the block's blob gas price.",
        value: (
          <div className="flex flex-col gap-4">
            <div className="flex gap-1">
              <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Execution:
              </span>
              {tx.effectiveGasPrice != null ? (
                <EtherDisplay
                  weiAmount={tx.effectiveGasPrice}
                  ethUsdPrice={ethUsdPrice}
                  opts={{ toUnit: "Gwei" }}
                />
              ) : (
                "Unavailable"
              )}
            </div>
            <div className="flex gap-1">
              <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Blob:
              </span>
              <EtherDisplay
                weiAmount={block.blobGasPrice}
                usdAmount={blobGasUsdPrice}
                opts={{ toUnit: "Gwei" }}
              />
            </div>
          </div>
        ),
      },
      {
        name: "Blob As Calldata",
        helpText:
          "The estimated gas used and fee to send the same blob data as calldata. These estimates are not additional transaction fees.",
        value: (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Gas Used:
              </span>
              {formatNumber(blobAsCalldataGasUsed)}{" "}
              <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
                (
                <strong>
                  {formatNumber(
                    performDiv(blobAsCalldataGasUsed, blobGasUsed),
                    "compact",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </strong>
                × gas)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Fee:
              </span>
              <EtherDisplay weiAmount={blobAsCalldataGasFee} />
              <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
                <Separator />
                <strong>
                  {formatNumber(
                    performDiv(blobAsCalldataGasFee, blobGasBaseFee),
                    "compact",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </strong>
                × cost
              </span>
            </div>
          </div>
        ),
      }
    );

    if (isMainnet && ethUsdPrice) {
      detailsFields.push({
        name: "ETH Price",
        helpText: "The price of one ETH in USD at the time of this block.",
        value: <FiatDisplay amount={ethUsdPrice} />,
      });
    }
    detailsFields.push({
      name: "Raw Input",
      helpText:
        "The transaction input bytes in hexadecimal format. This is calldata, separate from the data stored in blobs.",
      value:
        tx.input == null ? (
          "Unavailable"
        ) : (
          <Textarea
            aria-label="Raw Input"
            readOnly
            value={tx.input}
            spellCheck={false}
            className="font-mono"
            footer={
              <>
                <span className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
                  {(tx.input.length - 2) / 2} bytes
                </span>
                <CopyToClipboard
                  value={tx.input}
                  tooltipText="Copy raw input"
                />
              </>
            }
          />
        ),
    });
  }

  return (
    <>
      <SeoMetaTags
        title={`Transaction ${tx ? tx.hash : "Details"}`}
        description={`Explore transaction details${
          tx ? ` for ${tx.hash}` : ""
        } on Blobscan.`}
      />
      <DetailsLayout
        header={
          <div className="flex items-center justify-start gap-4">
            <NavArrow
              type="prev"
              size="lg"
              onClick={() => handleNavClick("prev")}
              tooltip="Previous Transaction from This Sender"
              disabled={prevTx === null || adjacentTxLoading}
            />
            Transaction Details
            <NavArrow
              type="next"
              size="lg"
              onClick={() => handleNavClick("next")}
              tooltip="Next Transaction from This Sender"
              disabled={nextTx === null || adjacentTxLoading}
            />
            {adjacentTxError && (
              <span className="text-sm font-normal text-error-600 dark:text-error-300">
                Couldn&apos;t load the adjacent transaction
              </span>
            )}
          </div>
        }
        resource={
          tx
            ? {
                type: "tx",
                value: tx.hash,
              }
            : undefined
        }
        fields={detailsFields}
        loadingFields={[
          "Hash",
          {
            name: "Status",
            value: <DetailsValueSkeleton variant="badge" count={2} />,
          },
          "Block",
          "Timestamp",
          "Position In Block",
          "From",
          "To",
          { name: "Category", value: <DetailsValueSkeleton variant="badge" /> },
          { name: "Blob Usage", value: <DetailsValueSkeleton variant="bar" /> },
          {
            name: "Total Fee",
            value: <DetailsValueSkeleton variant="distribution" />,
          },
          {
            name: "Execution Fee",
            value: (
              <DetailsValueSkeleton
                variant="subfields"
                labels={["Base", "Priority"]}
              />
            ),
          },
          {
            name: "Blob Fee",
            value: (
              <DetailsValueSkeleton
                variant="subfields"
                labels={["Base", "Max"]}
              />
            ),
          },
          {
            name: "Gas Used",
            value: (
              <DetailsValueSkeleton
                variant="subfields"
                labels={["Execution", "Blob"]}
              />
            ),
          },
          {
            name: "Gas Price",
            value: (
              <DetailsValueSkeleton
                variant="subfields"
                labels={["Execution", "Blob"]}
              />
            ),
          },
          {
            name: "Blob As Calldata",
            value: (
              <DetailsValueSkeleton
                variant="subfields"
                labels={["Gas Used", "Fee"]}
              />
            ),
          },
          ...(isMainnet ? ["ETH Price"] : []),
          "Raw Input",
        ]}
      />

      {tx?.rollup === "optimism" && !!tx.decodedFields && (
        <OptimismCard
          data={tx.decodedFields}
          txTimestamp={tx ? tx.blockTimestamp : undefined}
        />
      )}

      <Card
        header={
          <div className="flex items-center gap-2">
            Blobs
            <CountBadge count={tx?.blobs.length} size="sm" />
          </div>
        }
      >
        <div className="space-y-6">
          {isLoading || !tx || !tx.blobs
            ? Array.from({ length: 2 }).map((_, i) => <BlobCard key={i} />)
            : // The blobs have the order of their index in the transaction.
              tx.blobs.map((b, index) => (
                <BlobCard
                  key={index}
                  blob={b}
                  position={{ txHash: tx.hash, index }}
                />
              ))}
        </div>
      </Card>
    </>
  );
};

export default Tx;
