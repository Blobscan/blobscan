import { useMemo } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getFilterParams } from "~/utils/filter";
import { getPaginationParams } from "~/utils/pagination";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { StorageIcon } from "~/components/StorageIcon";
import { api } from "~/api-client";
import {
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  formatNumber,
  formatTimestamp,
  shortenAddress,
} from "~/utils";

const BLOBS_TABLE_DEFAULT_PAGE_SIZE = 50;
const BLOBS_TABLE_HEADERS = [
  {
    cells: [
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
        item: "Timestamp",
        className: "2xl:w-[185px] xl:w-[160px] lg:w-[127px] w-[100px]",
      },
      {
        item: "Size",
        className: "2xl:w-[178px] xl:w-[145px] lg:w-[101px] w-[66px]",
      },
      {
        item: "Storage",
        className: "w-auto",
      },
    ],
  },
];

const Blobs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(
    router.query,
    BLOBS_TABLE_DEFAULT_PAGE_SIZE
  );
  const { rollup } = getFilterParams(router.query);

  const { data, error, isLoading } = api.blob.getAll.useQuery({
    p,
    ps,
    rollup,
  });
  const { blobs, totalBlobs } = data || {};

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
          }) => ({
            cells: [
              {
                item: (
                  <Link href={buildBlobRoute(versionedHash)}>
                    {shortenAddress(versionedHash, 8)}
                  </Link>
                ),
              },
              {
                item: (
                  <Link href={buildTransactionRoute(txHash)}>
                    {shortenAddress(txHash, 8)}
                  </Link>
                ),
              },
              {
                item: (
                  <div className="text-contentTertiary-light dark:text-contentTertiary-dark">
                    <Link href={buildBlockRoute(blockNumber)}>
                      {blockNumber}
                    </Link>
                  </div>
                ),
              },
              {
                item: (
                  <div className="whitespace-break-spaces">
                    {formatTimestamp(blockTimestamp, true)}
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
  }, [blobs]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <PaginatedTable
      title={`Blobs ${totalBlobs ? `(${formatNumber(totalBlobs)})` : ""}`}
      isLoading={isLoading}
      headers={BLOBS_TABLE_HEADERS}
      rows={blobRows}
      totalItems={totalBlobs}
      paginationData={{ pageSize: ps, page: p }}
    />
  );
};

export default Blobs;
