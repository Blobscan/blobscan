import { useMemo, useState } from "react";
import type { NextPage } from "next";

import dayjs from "@blobscan/dayjs";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { ListControlBar } from "~/components/ControlBars/ListControlBar";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { TimestampToggle } from "~/components/Toggles";
import type { TimestampFormat } from "~/components/Toggles";
import { api } from "~/api-client";
import { useListPageParams } from "~/hooks/useListPageParams";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import type { BlobWithExpandedTransaction, Pagination } from "~/types";
import type { ByteUnit } from "~/utils";
import { formatTimestamp, shortenHash } from "~/utils";

const BYTES_UNIT: ByteUnit = "KiB";

const Blobs: NextPage = function () {
  const { pagination, filterParams, sort, isReady } = useListPageParams();
  const {
    data: blobsData,
    error: blobsError,
    isLoading,
  } = api.blob.getAll.useQuery<{
    blobs: BlobWithExpandedTransaction[];
    pagination: Pagination;
  }>(
    {
      ...pagination,
      ...filterParams,
      sort,
      expand: "transaction",
    },
    { enabled: isReady }
  );
  const { blobs } = blobsData || {};
  const error = blobsError;
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
              index,
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
                      <Link
                        href={routes.blob(versionedHash, { txHash, index })}
                      >
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
                      <Link href={routes.tx(txHash)}>
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
                        <Link href={routes.block(blockNumber)}>
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
    return <ErrorPage error={error} />;
  }

  return (
    <>
      <SeoMetaTags title="Blobs" description="Browse and explore all blobs." />
      <Header>Blobs</Header>
      <ListControlBar />
      <PaginatedTable
        emptyStateDescription="No Blobs"
        isLoading={isLoading}
        headers={blobHeaders}
        rows={blobRows}
        pagination={blobsData?.pagination}
        paginationData={pagination}
      />
    </>
  );
};

export default Blobs;
