import { useMemo, useState } from "react";
import type { NextPage } from "next";

import type { EtherUnit } from "@blobscan/eth-format";
import { formatWei } from "@blobscan/eth-format";
import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Filters } from "~/components/Filters";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { Skeleton } from "~/components/Skeleton";
import { Table } from "~/components/Table";
import type { TimestampFormat } from "~/components/TimestampToggle";
import { TimestampToggle } from "~/components/TimestampToggle";
import { api } from "~/api-client";
import { useQueryParams } from "~/hooks/useQueryParams";
import NextError from "~/pages/_error";
import { useEnv } from "~/providers/Env";
import type { BlockWithExpandedBlobsAndTransactions, Rollup } from "~/types";
import type { ByteUnit } from "~/utils";
import {
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatNumber,
  normalizeTimestamp,
  shortenHash,
} from "~/utils";

const BYTES_UNIT: ByteUnit = "KiB";
const ETHER_UNIT: EtherUnit = "Gwei";

const Blocks: NextPage = function () {
  const { env } = useEnv();
  const { paginationParams, filterParams } = useQueryParams();
  const rollups = filterParams?.rollups?.join(",");

  const {
    data: blocksData,
    isLoading: blocksIsLoading,
    error: blocksError,
  } = api.block.getAll.useQuery<{
    blocks: BlockWithExpandedBlobsAndTransactions[];
  }>({
    ...paginationParams,
    ...filterParams,
    rollups,
    expand: "transaction,blob",
  });
  const {
    data: countData,
    error: countError,
    isLoading: countIsLoading,
  } = api.block.getCount.useQuery(
    {
      ...filterParams,
      rollups,
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  const { blocks } = blocksData || {};
  const { totalBlocks } = countData || {};
  const error = blocksError || countError;
  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");
  const blockHeaders = [
    {
      cells: [
        {
          item: "",
          className: "w-[80px]",
        },
        {
          item: "Block number",
          className: "w-[118px]",
        },
        {
          item: (
            <TimestampToggle format={timeFormat} onChange={setTimeFormat} />
          ),
          className: "w-[170px]",
        },
        {
          item: "Slot",
          className: "w-[150px]",
        },
        {
          item: "Txs",
          className: "w-[66px]",
        },
        {
          item: "Blobs",
          className: "w-[83px]",
        },
        {
          item: `Blob Usage (${BYTES_UNIT})`,
          className: "w-[155px]",
        },
        {
          item: "Blob Gas Usage",
          className: "w-[175px]",
        },

        { item: `Blob Base Fees (${ETHER_UNIT})`, className: "w-[170px]" },
        {
          item: `Blob Gas Price (${ETHER_UNIT})`,
          className: "w-[170px]",
        },
      ],
    },
  ];

  const blocksRows = useMemo(() => {
    if (!blocks || !env) {
      return;
    }

    return blocks.map(
      ({
        blobGasPrice,
        blobGasUsed,
        blobBaseFee,
        number,
        slot,
        timestamp,
        transactions,
      }) => {
        const formattedTimestamp = normalizeTimestamp(timestamp);
        const blobCount = transactions?.reduce(
          (acc, tx) => acc + tx.blobs.length,
          0
        );
        const totalBlobSize = transactions
          ?.flatMap((tx) => tx.blobs)
          .reduce((acc, { size }) => acc + size, 0);
        const totalBlobUsage = transactions
          ?.flatMap((tx) => tx.blobs)
          .reduce((acc, { usageSize }) => acc + usageSize, 0);
        const txsBlobs = transactions.flatMap((tx) =>
          tx.blobs.map(
            ({ dataStorageReferences, versionedHash, size, usageSize }, i) => ({
              transactionHash: tx.hash,
              blobVersionedHash: versionedHash,
              blobIndex: i,
              category: tx.category,
              rollup: tx.rollup,
              dataStorageReferences,
              size,
              usageSize,
            })
          )
        );
        const rollupToAmount = txsBlobs.reduce<Partial<Record<Rollup, number>>>(
          (amounts, { rollup }) => {
            if (!rollup) {
              return amounts;
            }
            const amount = amounts[rollup] ?? 0;

            amounts[rollup] = amount + 1;

            return amounts;
          },
          {} as Partial<Record<Rollup, number>>
        );

        return {
          cells: [
            {
              item: (
                <div className="relative flex gap-1">
                  {Object.entries(rollupToAmount).map(([rollup, amount]) => (
                    <div key={rollup} className="-ml-0.5">
                      <RollupBadge
                        amount={amount}
                        rollup={rollup as Rollup}
                        compact
                      />
                    </div>
                  ))}
                </div>
              ),
            },
            {
              item: (
                <Copyable
                  value={number.toString()}
                  tooltipText="Copy block number"
                >
                  <Link href={buildBlockRoute(number)}>{number}</Link>
                </Copyable>
              ),
            },
            {
              item:
                timeFormat === "relative"
                  ? formattedTimestamp.fromNow()
                  : formattedTimestamp.format("YYYY-MM-DD HH:mm:ss"),
            },
            {
              item: (
                <Copyable value={slot.toString()} tooltipText="Copy Slot">
                  {slot}
                </Copyable>
              ),
            },
            {
              item: (
                <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
                  {transactions.length}
                </span>
              ),
            },
            {
              item: (
                <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
                  {blobCount}
                </span>
              ),
            },
            {
              item: (
                <BlobUsageDisplay
                  blobSize={totalBlobSize}
                  blobUsage={totalBlobUsage}
                  byteUnit={BYTES_UNIT}
                  hideUnit
                />
              ),
            },
            {
              item: (
                <BlobGasUsageDisplay
                  networkBlobConfig={getNetworkBlobConfigBySlot(
                    env.PUBLIC_NETWORK_NAME,
                    slot
                  )}
                  blobGasUsed={blobGasUsed}
                  width={100}
                  variant="minimal"
                />
              ),
            },
            {
              item: formatWei(blobBaseFee, { toUnit: "Gwei", hideUnit: true }),
            },
            {
              item: formatWei(blobGasPrice, { toUnit: "Gwei", hideUnit: true }),
            },
          ],
          expandItem: (
            <Table
              className="mb-4 mt-2 max-h-[420px] rounded-lg bg-primary-50 px-8 dark:bg-primary-800"
              size="xs"
              alignment="left"
              headers={[
                {
                  cells: [
                    { item: "", className: "w-[70px]" },
                    {
                      item: "Tx Hash",
                      className: "w-[200px]",
                    },
                    {
                      item: "Position",
                      className: "w-[200px]",
                    },
                    {
                      item: "Blob Versioned Hash",
                      className: "w-[100px]",
                    },
                    { item: `Usage (${BYTES_UNIT})` },
                    {
                      item: "Storages",
                      className: "w-[200px]",
                    },
                  ],
                  className: "dark:border-border-dark/20",
                  sticky: true,
                },
              ]}
              rows={txsBlobs.map(
                ({
                  transactionHash,
                  blobIndex,
                  blobVersionedHash,
                  rollup,
                  category,
                  dataStorageReferences,
                  size,
                  usageSize,
                }) => ({
                  cells: [
                    {
                      item:
                        category === "rollup" && rollup ? (
                          <RollupBadge rollup={rollup} compact />
                        ) : (
                          <></>
                        ),
                    },
                    {
                      item: (
                        <Copyable
                          value={transactionHash}
                          tooltipText="Copy transaction hash"
                        >
                          <Link href={buildTransactionRoute(transactionHash)}>
                            {shortenHash(transactionHash, 27)}
                          </Link>
                        </Copyable>
                      ),
                    },
                    {
                      item: blobIndex,
                    },
                    {
                      item: (
                        <Copyable
                          value={blobVersionedHash}
                          tooltipText="Copy blob versioned hash"
                        >
                          <Link href={buildBlobRoute(blobVersionedHash)}>
                            {shortenHash(blobVersionedHash, 27)}
                          </Link>
                        </Copyable>
                      ),
                    },
                    {
                      item: (
                        <BlobUsageDisplay
                          variant="inline"
                          blobSize={size}
                          blobUsage={usageSize}
                          byteUnit={BYTES_UNIT}
                          hideUnit
                        />
                      ),
                    },
                    {
                      item: dataStorageReferences && (
                        <div className="flex items-center gap-2">
                          {dataStorageReferences.map(({ storage, url }) => (
                            <StorageBadge
                              key={storage}
                              storage={storage}
                              url={url}
                              compact
                            />
                          ))}
                        </div>
                      ),
                    },
                  ],
                })
              )}
            />
          ),
        };
      }
    );
  }, [blocks, timeFormat, env]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <>
      <Header>
        <div className="flex items-center gap-2">
          <div>Blocks</div>
          <div>
            {!countIsLoading && totalBlocks !== undefined ? (
              `(${formatNumber(totalBlocks)})`
            ) : (
              <div className="relative left-0 top-1">
                <Skeleton width={100} height={25} />
              </div>
            )}
          </div>
        </div>
      </Header>
      <Filters />
      <PaginatedTable
        isLoading={blocksIsLoading}
        headers={blockHeaders}
        rows={blocksRows}
        totalItems={totalBlocks}
        paginationData={{
          pageSize: paginationParams.ps,
          page: paginationParams.p,
        }}
        isExpandable
      />
    </>
  );
};

export default Blocks;
