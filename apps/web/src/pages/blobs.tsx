import { useMemo, useState } from "react";
import type { NextPage } from "next";
import NextError from "next/error";

import dayjs from "@blobscan/dayjs";

import { Copyable } from "~/components/Copyable";
import { Filters } from "~/components/Filters";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { RollupIcon } from "~/components/RollupIcon";
import { Skeleton } from "~/components/Skeleton";
import { StorageIcon } from "~/components/StorageIcon";
import { TimestampToggle } from "~/components/TimestampToggle";
import type { TimestampFormat } from "~/components/TimestampToggle";
import { api } from "~/api-client";
import { useQueryParams } from "~/hooks/useQueryParams";
import {
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  formatNumber,
  formatTimestamp,
  shortenAddress,
} from "~/utils";

const Blobs: NextPage = function () {
  const { paginationParams, filterParams } = useQueryParams();

  const {
    data: blobsData,
    error: blobsError,
    isLoading,
  } = api.blob.getAll.useQuery({
    ...paginationParams,
    ...filterParams,
  });
  const {
    data: countData,
    error: countError,
    isLoading: countIsLoading,
  } = api.blob.getCount.useQuery(filterParams, {
    refetchOnWindowFocus: false,
  });
  const error = blobsError ?? countError;
  const { blobs } = blobsData || {};
  const { totalBlobs } = countData || {};

  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");

  const BLOBS_TABLE_HEADERS = [
    {
      cells: [
        {
          item: "",
          className: "w-[40px]",
        },
        {
          item: "Versioned Hash",
          className: "2xl:w-[312px] xl:w-[276px] lg:w-[215px] w-[170px]",
        },
        {
          item: "Transaction Hash",
          className: "2xl:w-[318px] xl:w-[276px] lg:w-[218px] w-[172px]",
        },
        {
          item: "Block Number",
          className: "2xl:w-[221px] xl:w-[191px] lg:w-[152px] w-[120px]",
        },
        {
          item: (
            <TimestampToggle format={timeFormat} setFormat={setTimeFormat} />
          ),
          className: "2xl:w-[185px] xl:w-[160px] lg:w-[127px] w-[100px]",
        },
        {
          item: "Size",
          className: "2xl:w-[178px] xl:w-[145px] lg:w-[101px] w-[66px]",
        },
        {
          item: "Storage",
          className: "w-[86px]",
        },
      ],
    },
  ];

  const blobRows = useMemo(() => {
    return blobs
      ? blobs.map(
          ({
            versionedHash,
            size,
            dataStorageReferences,
            txHash,
            blockTimestamp,
            blockNumber,
            transaction,
          }) => ({
            cells: [
              {
                item:
                  transaction?.category === "rollup" && transaction.rollup ? (
                    <RollupIcon rollup={transaction.rollup} />
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
                      {shortenAddress(versionedHash, 8)}
                    </Link>
                  </Copyable>
                ),
              },
              {
                item: (
                  <Copyable value={txHash} tooltipText="Copy transaction hash">
                    <Link href={buildTransactionRoute(txHash)}>
                      {shortenAddress(txHash, 8)}
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
                item: (
                  <div className="whitespace-break-spaces">
                    {timeFormat === "relative"
                      ? formatTimestamp(blockTimestamp, true)
                      : dayjs(blockTimestamp).format("YYYY-MM-DD HH:mm:ss")}
                  </div>
                ),
              },
              {
                item: (
                  <div className="flex gap-2">
                    <span>{formatBytes(size)}</span>
                  </div>
                ),
              },
              {
                item: (
                  <div className="flex flex-row gap-1">
                    {dataStorageReferences.map(({ storage, url }) => (
                      <StorageIcon
                        key={storage}
                        storage={storage}
                        url={url}
                        size="md"
                      />
                    ))}
                  </div>
                ),
              },
            ],
          })
        )
      : undefined;
  }, [blobs, timeFormat]);

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
        headers={BLOBS_TABLE_HEADERS}
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
