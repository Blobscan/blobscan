import { Link } from "~/components/Link";
import { StorageIcon } from "~/components/StorageIcon";
import type { DeserializedBlob } from "~/utils";
import {
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  shortenAddress,
  formatTimestamp,
  buildBlobRoute,
} from "~/utils";

export const blobsTableHeaders = [
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

type BlobItem = Pick<
  DeserializedBlob,
  "versionedHash" | "commitment" | "size" | "dataStorageReferences" | "proof"
> & {
  blockHash: string;
  blockNumber: number;
  blockTimestamp: string;
  txHash: string;
};

export const getBlobsTableRows = (blobs?: BlobItem[]) =>
  blobs
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
                <div className="text-contentTertiary-light dark:text-contentTertiary-dark">
                  <Link href={buildTransactionRoute(txHash)}>
                    {shortenAddress(txHash, 8)}
                  </Link>
                </div>
              ),
            },
            {
              item: (
                <div className="text-contentTertiary-light dark:text-contentTertiary-dark">
                  <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
                </div>
              ),
            },
            {
              item: (
                <div className="min-w-60 whitespace-break-spaces">
                  {formatTimestamp(blockTimestamp)}
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
