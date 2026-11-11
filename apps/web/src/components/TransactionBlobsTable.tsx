import type { FC } from "react";

import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
import { Link } from "~/components/Link";
import { Table } from "~/components/Table";
import { routes } from "~/routes";
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
      className={`mb-4 mt-2 bg-primary-50 px-8 dark:bg-primary-800 ${
        isCard ? "rounded-b-lg" : "rounded-lg"
      }`}
      fixedColumnsWidth={isCard}
      size="xs"
      alignment="left"
      headers={[
        {
          cells: [
            {
              item: "Position",
              className: isCard ? "w-[40px]" : "w-[20px]",
            },
            {
              item: isCard ? "Versioned Hash" : "Blob Versioned Hash",
              className: isCard ? "w-[300px]" : "w-[400px]",
            },
            {
              item: "Size (KiB)",
              className: isCard ? "w-[100px]" : "w-[80px] border",
            },
            {
              item: isCard ? "Usage Size (KiB)" : "Usage (KiB)",
              className: isCard ? "w-[100px]" : "w-[140px]",
            },
            {
              item: "Storages",
              className: isCard ? "w-[120px]" : "w-[60px]",
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
