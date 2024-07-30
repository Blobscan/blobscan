import { useMemo } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable/PaginatedTable";
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
      },
      {
        item: "Transaction Hash",
      },
      {
        item: "Block Number",
      },
      {
        item: "Timestamp",
      },
      {
        item: "Size",
      },
      {
        item: "Storage",
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

  const { data, error, isLoading } = api.blob.getAll.useQuery({ p, ps });
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
                  <div className="flex gap-2 text-xs">
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
