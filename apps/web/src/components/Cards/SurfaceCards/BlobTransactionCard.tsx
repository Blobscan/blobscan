import React, { useState } from "react";
import type { FC } from "react";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

import { formatWei } from "@blobscan/eth-format";

import { Badge } from "~/components/Badges/Badge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Collapsable } from "~/components/Collapsable";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { IconButton } from "~/components/IconButton";
import { Rotable } from "~/components/Rotable";
import { Separator } from "~/components/Separator";
import { Skeleton } from "~/components/Skeleton";
import { Table } from "~/components/Table";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { routes } from "~/routes";
import type { Blob, Transaction } from "~/types";
import type { BytesOptions, ByteUnit } from "~/utils";
import {
  calculatePercentage,
  formatBytes,
  normalizeTimestamp,
  pluralize,
  shortenHash,
  toChecksumAddress,
} from "~/utils";
import { RollupBadge } from "../../Badges/RollupBadge";
import { Link } from "../../Link";
import { CardField } from "../Card";
import { SurfaceCardBase } from "./SurfaceCardBase";

const BYTE_UNIT: ByteUnit = "KiB";

const BYTE_OPTS: BytesOptions = {
  hideUnit: true,
  unit: BYTE_UNIT,
};

type BlobTransactionCardProps = Partial<{
  transaction: Partial<
    Pick<
      Transaction,
      | "hash"
      | "from"
      | "to"
      | "rollup"
      | "blockNumber"
      | "blockTimestamp"
      | "blobGasBaseFee"
      | "blobGasMaxFee"
    >
  >;
  blobs: Pick<
    Blob,
    "versionedHash" | "size" | "usageSize" | "dataStorageReferences"
  >[];
  compact?: boolean;
  className?: string;
  /**
   * The role of the address of the page in the transaction. The card shows it
   * next to the block and timestamp.
   */
  addressRole: "sent" | "received" | "self";
}>;

const ADDRESS_ROLE_MARKS = {
  sent: {
    label: "Sent",
    className:
      "bg-primary-200 text-primary-700 dark:bg-primary-800 dark:text-primary-300",
  },
  received: {
    label: "Received",
    className:
      "bg-blues-100 text-primary-1000 dark:bg-coolGray-200 dark:text-blues-100",
  },
  self: {
    label: "Self",
    className:
      "bg-warmGray-200 text-warmGray-600 dark:bg-coolGray-300 dark:text-coolGray-700",
  },
} as const;

const BlobTransactionCard: FC<BlobTransactionCardProps> = function ({
  transaction: {
    hash,
    from,
    to,
    rollup,
    blockNumber,
    blockTimestamp,
    blobGasBaseFee,
    blobGasMaxFee,
  } = {},
  blobs: blobsOnTx,
  compact,
  className,
  addressRole,
}) {
  const [opened, setOpened] = useState(false);
  const checksumFrom = toChecksumAddress(from ?? "");
  const checksumTo = toChecksumAddress(to ?? "");
  const breakpoint = useBreakpoint();
  const isCompact =
    compact ||
    breakpoint === "sm" ||
    breakpoint === "md" ||
    breakpoint === "default";
  const displayBlobs = !compact && !!blobsOnTx?.length;
  const totalBlobSize = blobsOnTx?.reduce((acc, { size }) => acc + size, 0);
  const totalBlobUsage = blobsOnTx?.reduce(
    (acc, { usageSize }) => acc + usageSize,
    0
  );

  return (
    <div>
      <SurfaceCardBase
        className={`${className} ${
          compact ? "rounded" : "rounded-none rounded-t-md"
        }`}
      >
        <div
          className={`relative flex flex-col text-sm ${
            rollup ? "md:min-h-24" : ""
          }`}
        >
          {hash ? (
            <div className="flex w-full items-center justify-between gap-2 md:gap-0">
              <div
                className={`${
                  isCompact ? "max-w-[86%]" : "max-w-[70%] sm:w-full"
                }`}
              >
                <span className="text-surfaceContentSecondary-light dark:text-surfaceContentSecondary-dark">
                  Tx{" "}
                </span>
                <Link href={routes.tx(hash)}>{hash}</Link>
              </div>
              <div className="flex items-center gap-2">
                {rollup && <RollupBadge rollup={rollup} compact={isCompact} />}
              </div>
            </div>
          ) : (
            <Skeleton width={isCompact ? undefined : 500} className="mb-1" />
          )}
          <div className="flex w-full flex-col items-center justify-between text-xs md:flex-row">
            <div
              className={`w-full ${
                blockTimestamp && blockNumber ? "w-2/3" : ""
              }`}
            >
              <div className="flex flex-col gap-1 truncate">
                {from && to ? (
                  <div className="flex flex-row items-center gap-1 text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
                    <div className="flex justify-start gap-0.5">
                      <Link href={routes.address(from)}>
                        {isCompact
                          ? shortenHash(checksumFrom, 8)
                          : checksumFrom}
                      </Link>
                    </div>
                    <ArrowRightIcon className="h-3 w-3" />
                    <div>
                      <div className="text-contentTertiary-light dark:text-contentTertiary-dark">
                        <Link href={routes.address(to)}>
                          {isCompact ? shortenHash(checksumTo, 8) : checksumTo}
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Skeleton width={isCompact ? "80%" : 590} size="xs" />
                )}
                {blobGasBaseFee && blobGasMaxFee ? (
                  <div className="flex w-full flex-row gap-1">
                    <CardField
                      name={<div title="Blob Base Fee">B. Base Fee</div>}
                      value={
                        <div className="truncate">
                          {formatWei(blobGasBaseFee)}
                        </div>
                      }
                    />
                    <CardField
                      name={<div title="Blob Max Fee">B.Max Fee</div>}
                      value={
                        <div className="truncate">
                          {formatWei(blobGasMaxFee)}
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <Skeleton width={isCompact ? "90%" : 320} size="xs" />
                )}
                <div className="flex gap-2 text-xs">
                  {blobsOnTx ? (
                    <>
                      <div>
                        {blobsOnTx.length} {pluralize("Blob", blobsOnTx.length)}
                      </div>
                      {typeof totalBlobSize !== "undefined" &&
                        typeof totalBlobUsage !== "undefined" && (
                          <>
                            <Separator />
                            <BlobUsageDisplay
                              blobSize={totalBlobSize}
                              blobUsage={totalBlobUsage}
                            />
                          </>
                        )}
                    </>
                  ) : (
                    <Skeleton width={140} size="xs" />
                  )}
                </div>
              </div>
            </div>
            {!!blockNumber && !!blockTimestamp && (
              <div className="mt-1 flex shrink-0 items-center gap-3 self-start md:absolute md:right-0 md:top-1/2 md:mt-0 md:-translate-y-1/2 md:self-center">
                {addressRole && (
                  <Badge
                    size="xs"
                    className={ADDRESS_ROLE_MARKS[addressRole].className}
                  >
                    {ADDRESS_ROLE_MARKS[addressRole].label}
                  </Badge>
                )}
                <div className="flex items-center gap-2 md:flex-col md:gap-0">
                  <div className="flex gap-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                    Block
                    <Link href={routes.block(blockNumber)}>{blockNumber}</Link>
                  </div>
                  <div className="text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
                    {normalizeTimestamp(blockTimestamp).fromNow()}
                  </div>
                </div>
              </div>
            )}
          </div>
          {displayBlobs && (
            <div className="-mb-2 flex items-center justify-center md:-mt-5">
              <Rotable
                angle={180}
                rotated={opened}
                onClick={() => setOpened((prevOpened) => !prevOpened)}
              >
                <IconButton>
                  <ChevronDownIcon />
                </IconButton>
              </Rotable>
            </div>
          )}
        </div>
      </SurfaceCardBase>
      {blobsOnTx && (
        <Collapsable opened={opened}>
          <Table
            className="mb-4 mt-2 rounded-b-lg bg-primary-50 px-8 dark:bg-primary-800"
            size="xs"
            fixedColumnsWidth
            alignment="left"
            headers={[
              {
                cells: [
                  {
                    item: "Position",
                    className: "w-[40px]",
                  },
                  {
                    item: "Versioned Hash",
                    className: "w-[300px]",
                  },
                  {
                    item: `Size (${BYTE_UNIT})`,
                    className: "w-[100px]",
                  },
                  {
                    item: `Usage Size (${BYTE_UNIT})`,
                    className: "w-[100px]",
                  },
                  {
                    item: "Storages",
                    className: "w-[120px]",
                  },
                ],
                className: "dark:border-border-dark/20",
              },
            ]}
            rows={blobsOnTx.map(
              (
                { dataStorageReferences, versionedHash, size, usageSize },
                i
              ) => ({
                cells: [
                  {
                    item: i,
                  },
                  {
                    item: (
                      <Copyable
                        value={versionedHash}
                        tooltipText="Copy versioned hash"
                      >
                        <Link
                          href={routes.blob(
                            versionedHash,
                            hash ? { txHash: hash, index: i } : undefined
                          )}
                        >
                          {versionedHash}
                        </Link>
                      </Copyable>
                    ),
                  },
                  {
                    item: formatBytes(size, BYTE_OPTS),
                  },
                  {
                    item: (
                      <span>
                        {formatBytes(usageSize, BYTE_OPTS)}{" "}
                        <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
                          ({calculatePercentage(usageSize, size)}%)
                        </span>
                      </span>
                    ),
                  },
                  {
                    item: dataStorageReferences?.length ? (
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
                    ) : (
                      <span className="text-x">Propagating…</span>
                    ),
                  },
                ],
              })
            )}
          />
        </Collapsable>
      )}
    </div>
  );
};

export { BlobTransactionCard };
