import { useState } from "react";
import type { FC } from "react";

import dayjs from "@blobscan/dayjs";
import { formatWei } from "@blobscan/eth-format";

import { Badge } from "~/components/Badges/Badge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { Table } from "~/components/Table";
import type { TimestampFormat } from "~/components/Toggles";
import { TimestampToggle } from "~/components/Toggles";
import { api } from "~/api-client";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import { paginationParamsSchema } from "~/schemas/pagination";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import {
  calculatePercentage,
  formatBytes,
  formatNumber,
  formatTimestamp,
  shortenHash,
  toChecksumAddress,
} from "~/utils";

function getAddressRole(
  address: string,
  { from, to }: { from: string; to: string }
): "sent" | "received" | "self" {
  const isSender = from.toLowerCase() === address;
  const isReceiver = to.toLowerCase() === address;

  if (isSender && isReceiver) {
    return "self";
  }

  return isSender ? "sent" : "received";
}

export type AddressTransactionsTabProps = {
  /** The address in lower case. */
  address: string;
  /** The number of blob txs of all the time, for the title and the pages. */
  totalTransactions?: number;
  enabled: boolean;
};

/** The table of transactions sent or received by the address. */
export const AddressTransactionsTab: FC<AddressTransactionsTabProps> =
  function ({ address, totalTransactions, enabled }) {
    const { state: urlState } = useUrlState(paginationParamsSchema);
    const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");
    const { data, isLoading, error } = api.tx.getAll.useQuery<{
      transactions: TransactionWithExpandedBlockAndBlob[];
    }>(
      { p: urlState?.p, ps: urlState?.ps, address, expand: "block,blob" },
      {
        enabled,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
      }
    );

    if (error) {
      return (
        <ErrorPage
          error={error}
          overrides={{
            BAD_REQUEST: {
              title: "Invalid Address",
              description: "Please provide a valid Ethereum address.",
            },
          }}
        />
      );
    }

    return (
      <PaginatedTable
        tableClassName="w-full min-w-[1320px]"
        title={`Blob Transactions${
          totalTransactions !== undefined
            ? ` (${formatNumber(totalTransactions)})`
            : ""
        }`}
        isLoading={isLoading}
        emptyStateDescription="No Blob Transactions"
        headers={[
          {
            cells: [
              { item: "", className: "w-[40px]" },
              { item: "Hash", className: "w-[120px]" },
              { item: "Block", className: "w-[88px]" },
              {
                item: (
                  <TimestampToggle
                    format={timeFormat}
                    onChange={setTimeFormat}
                  />
                ),
                className: "w-[110px]",
              },
              { item: "Blobs", className: "w-[56px]" },
              {
                item: (
                  <>
                    Blob Usage
                    <br />
                    (KiB)
                  </>
                ),
                className: "w-[160px]",
              },
              { item: "From", className: "w-[136px]" },
              {
                item: <span className="sr-only">Direction</span>,
                className: "w-[48px] px-1",
              },
              { item: "To", className: "w-[136px]" },
              {
                item: (
                  <>
                    Blob Base Fee
                    <br />
                    (Gwei)
                  </>
                ),
                className: "w-[120px]",
              },
              {
                item: (
                  <>
                    Blob Max Fee
                    <br />
                    (Gwei)
                  </>
                ),
                className: "w-[120px]",
              },
              {
                item: (
                  <>
                    Blob Gas Price
                    <br />
                    (Gwei)
                  </>
                ),
                className: "w-auto",
              },
            ],
            className: "whitespace-nowrap px-2",
          },
        ]}
        rows={data?.transactions.map((tx) => {
          const { blobs, hash } = tx;
          const role = getAddressRole(address, tx);

          return {
            className: "px-2",
            cells: [
              {
                item:
                  tx.category === "rollup" && tx.rollup ? (
                    <RollupBadge rollup={tx.rollup} compact />
                  ) : null,
              },
              {
                item: (
                  <Copyable value={tx.hash} tooltipText="Copy hash">
                    <Link href={routes.tx(tx.hash)}>
                      {shortenHash(tx.hash)}
                    </Link>
                  </Copyable>
                ),
              },
              {
                item: (
                  <Link href={routes.block(tx.blockNumber)}>
                    {tx.blockNumber}
                  </Link>
                ),
              },
              {
                item:
                  timeFormat === "relative" ? (
                    formatTimestamp(tx.blockTimestamp, true)
                  ) : (
                    <span className="whitespace-normal">
                      {dayjs(tx.blockTimestamp).format("YYYY-MM-DD HH:mm:ss")}
                    </span>
                  ),
              },
              { item: tx.blobs.length },
              {
                item: (
                  <BlobUsageDisplay
                    blobSize={tx.blobs.reduce(
                      (sum, blob) => sum + blob.size,
                      0
                    )}
                    blobUsage={tx.blobs.reduce(
                      (sum, blob) => sum + blob.usageSize,
                      0
                    )}
                    byteUnit="KiB"
                    hideUnit
                  />
                ),
              },
              {
                item: (
                  <Copyable value={tx.from} tooltipText="Copy address">
                    <Link href={routes.address(tx.from)}>
                      {shortenHash(toChecksumAddress(tx.from), 4)}
                    </Link>
                  </Copyable>
                ),
              },
              {
                className: "px-1",
                item: (
                  <Badge
                    size="xs"
                    variant="primary"
                    className="h-5 px-1.5 text-[10px]"
                  >
                    {role === "self" ? "SELF" : role === "sent" ? "OUT" : "IN"}
                  </Badge>
                ),
              },
              {
                item: (
                  <Copyable value={tx.to} tooltipText="Copy address">
                    <Link href={routes.address(tx.to)}>
                      {shortenHash(toChecksumAddress(tx.to), 4)}
                    </Link>
                  </Copyable>
                ),
              },
              ...[
                tx.blobGasBaseFee,
                tx.blobGasMaxFee,
                tx.block.blobGasPrice,
              ].map((fee) => ({
                item: formatWei(fee, { toUnit: "Gwei", hideUnit: true }),
              })),
            ],
            expandItem: (
              <Table
                className="mb-4 mt-2 rounded-lg bg-primary-50 px-8 dark:bg-primary-800"
                size="xs"
                alignment="left"
                headers={[
                  {
                    cells: [
                      {
                        item: "Position",
                        className: "w-[20px]",
                      },
                      {
                        item: "Blob Versioned Hash",
                        className: "w-[400px]",
                      },
                      {
                        item: "Size (KiB)",
                        className: "w-[80px] border",
                      },
                      {
                        item: "Usage (KiB)",
                        className: "w-[140px]",
                      },
                      {
                        item: "Storages",
                        className: "w-[60px]",
                      },
                    ],
                    className: "dark:border-border-dark/20",
                    sticky: true,
                  },
                ]}
                rows={
                  blobs
                    ? blobs.map(
                        (
                          {
                            versionedHash,
                            size,
                            dataStorageReferences,
                            usageSize,
                          },
                          i
                        ) => ({
                          cells: [
                            { item: i },
                            {
                              item: (
                                <Copyable
                                  value={versionedHash}
                                  tooltipText="Copy blob versioned hash"
                                >
                                  <Link
                                    href={routes.blob(versionedHash, {
                                      txHash: hash,
                                      index: i,
                                    })}
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
                              item: dataStorageReferences && (
                                <div className="flex items-center gap-2">
                                  {dataStorageReferences.map(
                                    ({ storage, url }) => (
                                      <StorageBadge
                                        key={storage}
                                        storage={storage}
                                        url={url}
                                        compact
                                      />
                                    )
                                  )}
                                </div>
                              ),
                            },
                          ],
                          className: "dark:border-border-dark/10",
                        })
                      )
                    : undefined
                }
              />
            ),
          };
        })}
        totalItems={totalTransactions}
        paginationData={urlState ?? undefined}
        isExpandable
      />
    );
  };
