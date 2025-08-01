import { useMemo, useState } from "react";
import type { NextPage } from "next";
import NextError from "next/error";

import dayjs from "@blobscan/dayjs";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Filters } from "~/components/Filters";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { Skeleton } from "~/components/Skeleton";
import { TimestampToggle } from "~/components/TimestampToggle";
import type { TimestampFormat } from "~/components/TimestampToggle";
import { api } from "~/api-client";
import { useQueryParams } from "~/hooks/useQueryParams";
import type { BlobWithExpandedTransaction } from "~/types";
import type { ByteUnit } from "~/utils";
import {
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatNumber,
  formatTimestamp,
  shortenHash,
} from "~/utils";

const BYTES_UNIT: ByteUnit = "KiB";

const Blobs: NextPage = function () {
  const { paginationParams, filterParams } = useQueryParams();
  const rollups = filterParams?.rollups?.join(",");

  const {
    data: blobsData,
    error: blobsError,
    isLoading,
  } = api.blob.getAll.useQuery<{ blobs: BlobWithExpandedTransaction[] }>({
    ...paginationParams,
    ...filterParams,
    rollups,
    expand: "transaction",
  });
  const {
    data: countData,
    error: countError,
    isLoading: countIsLoading,
  } = api.blob.getCount.useQuery(
    {
      ...filterParams,
      rollups,
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  const error = blobsError ?? countError;
  const { blobs } = blobsData || {};
  const { totalBlobs } = countData || {};
  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");
  const blobHeaders = [
    {
      cells: [
        {
          item: "",
          className: "w-[40px]",
        },
        {
          item: "Versioned Hash",
          className: "w-[170px]",
        },
        {
          item: "Transaction Hash",
          className: "w-[172px]",
        },
        {
          item: "Block Number",
          className: "w-[120px]",
        },
        {
          item: (
            <TimestampToggle format={timeFormat} onChange={setTimeFormat} />
          ),
          className: "w-[150px]",
        },

        { item: `Blob Usage (${BYTES_UNIT})`, className: "w-[180px]" },
        {
          item: "Storages",
          className: "w-[86px]",
        },
      ],
    },
  ];
  const blobRows = useMemo(
    () =>
      blobs
        ? blobs.map(
            ({
              versionedHash,
              usageSize,
              size,
              dataStorageReferences,
              txHash,
              blockTimestamp,
              blockNumber,
              transaction,
            }) => ({
              cells: [
                {
                  item: transaction.rollup ? (
                    <RollupBadge rollup={transaction.rollup} compact />
                  ) : (
                    <></>
                  ),
                },
                {
                  item: (
                    <Copyable
                      value={versionedHash}
                      tooltipText="Copy versioned hash"
                    >
                      <Link href={buildBlobRoute(versionedHash)}>
                        {shortenHash(versionedHash, 8)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <Copyable
                      value={txHash}
                      tooltipText="Copy transaction hash"
                    >
                      <Link href={buildTransactionRoute(txHash)}>
                        {shortenHash(txHash, 8)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <div className="text-contentTertiary-light dark:text-contentTertiary-dark">
                      <Copyable
                        value={blockNumber.toString()}
                        tooltipText="Copy block number"
                      >
                        <Link href={buildBlockRoute(blockNumber)}>
                          {blockNumber}
                        </Link>
                      </Copyable>
                    </div>
                  ),
                },
                {
                  item:
                    timeFormat === "relative"
                      ? formatTimestamp(blockTimestamp, true)
                      : dayjs(blockTimestamp).format("YYYY-MM-DD HH:mm:ss"),
                },
                {
                  item: (
                    <BlobUsageDisplay
                      blobSize={size}
                      blobUsage={usageSize}
                      byteUnit={BYTES_UNIT}
                      hideUnit
                      width={130}
                    />
                  ),
                },
                {
                  item: (
                    <div className="flex flex-row gap-1">
                      {dataStorageReferences.map(({ storage, url }) => (
                        <StorageBadge
                          key={storage}
                          storage={storage}
                          url={url}
                          size="md"
                          compact
                        />
                      ))}
                    </div>
                  ),
                },
              ],
            })
          )
        : undefined,
    [blobs, timeFormat]
  );

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
          <div>Blobs</div>
          <div>
            {!countIsLoading && totalBlobs !== undefined ? (
              `(${formatNumber(totalBlobs)})`
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
        isLoading={isLoading}
        headers={blobHeaders}
        rows={blobRows}
        totalItems={totalBlobs}
        paginationData={{
          pageSize: paginationParams.ps,
          page: paginationParams.p,
        }}
      />
    </>
  );
};

export default Blobs;
