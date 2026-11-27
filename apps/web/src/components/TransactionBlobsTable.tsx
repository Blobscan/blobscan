import type { FC } from "react";

import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
import { Link } from "~/components/Link";
import { Table } from "~/components/Table";
import { BLOB_POSITION_LINK_REL, routes } from "~/routes";
import type { Blob } from "~/types";
import { calculatePercentage, formatBytes } from "~/utils";

type TransactionBlobsTableProps = {
  blobs?: Pick<
    Blob,
    "versionedHash" | "size" | "usageSize" | "dataStorageReferences"
  >[];
  txHash?: string;
  variant?: "expanded" | "card";
};

export const TransactionBlobsTable: FC<TransactionBlobsTableProps> = function ({
  blobs,
  txHash,
  variant = "expanded",
}) {
  const isCard = variant === "card";

  return (
    <Table
      className={`mb-4 mt-2 min-w-[640px] bg-primary-50 px-8 dark:bg-primary-800 xl:min-w-0 ${
        isCard ? "rounded-b-lg" : "rounded-lg"
      }`}
      fixedColumnsWidth
      size="xs"
      alignment="left"
      headers={[
        {
          cells: [
            {
              item: "Position",
              className: "w-[8%]",
            },
            {
              item: isCard ? "Versioned Hash" : "Blob Versioned Hash",
              className: "w-[42%]",
            },
            {
              item: "Size (KiB)",
              className: "w-[14%]",
            },
            {
              item: isCard ? "Usage Size (KiB)" : "Usage (KiB)",
              className: "w-[20%]",
            },
            {
              item: "Storages",
              className: "w-[16%]",
            },
          ],
          className: "dark:border-border-dark/20",
          sticky: !isCard,
        },
      ]}
      rows={
        blobs
          ? blobs.map(
              (
                { versionedHash, size, dataStorageReferences, usageSize },
                i
              ) => ({
                cells: [
                  { item: i },
                  {
                    item: (
                      <Copyable
                        value={versionedHash}
                        tooltipText={
                          isCard
                            ? "Copy versioned hash"
                            : "Copy blob versioned hash"
                        }
                      >
                        <Link
                          href={routes.blob(
                            versionedHash,
                            txHash ? { txHash, index: i } : undefined
                          )}
                          rel={txHash ? BLOB_POSITION_LINK_REL : undefined}
                        >
                          {versionedHash}
                        </Link>
                      </Copyable>
                    ),
                  },
                  {
                    item: formatBytes(size, {
                      unit: "KiB",
                      hideUnit: true,
                    }),
                  },
                  {
                    item: (
                      <span>
                        {formatBytes(usageSize, {
                          unit: "KiB",
                          hideUnit: true,
                        })}{" "}
                        <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
                          ({calculatePercentage(usageSize, size)}
                          %)
                        </span>
                      </span>
                    ),
                  },
                  {
                    item:
                      isCard && !dataStorageReferences?.length ? (
                        <span className="text-x">Propagating…</span>
                      ) : (
                        dataStorageReferences && (
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
                        )
                      ),
                  },
                ],
                className: isCard ? undefined : "dark:border-border-dark/10",
              })
            )
          : undefined
      }
    />
  );
};
