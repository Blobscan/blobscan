import { useState } from "react";
import type { FC } from "react";

import dayjs from "@blobscan/dayjs";

import { Badge } from "~/components/Badges/Badge";
import { CountBadge } from "~/components/Badges/CountBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import type { TableRow } from "~/components/Table";
import { TableAmount } from "~/components/Table/Amount";
import type { TimestampFormat } from "~/components/Toggles";
import { TimestampToggle } from "~/components/Toggles";
import { TransactionBlobsTable } from "~/components/TransactionBlobsTable";
import { api } from "~/api-client";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import {
  normalizePaginationParams,
  paginationParamsSchema,
} from "~/schemas/pagination";
import type { Pagination, TransactionWithExpandedBlockAndBlob } from "~/types";
import { formatTimestamp, shortenHash, toChecksumAddress } from "~/utils";

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

const AddressCell: FC<{ address: string }> = function ({ address }) {
  return (
    <Copyable value={address} tooltipText="Copy address">
      <Link href={routes.address(address)}>
        {shortenHash(toChecksumAddress(address), 4)}
      </Link>
    </Copyable>
  );
};

function getTransactionRow(
  tx: TransactionWithExpandedBlockAndBlob,
  address: string,
  timeFormat: TimestampFormat
): TableRow {
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
            <Link href={routes.tx(tx.hash)}>{shortenHash(tx.hash)}</Link>
          </Copyable>
        ),
      },
      {
        item: <Link href={routes.block(tx.blockNumber)}>{tx.blockNumber}</Link>,
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
            blobSize={tx.blobs.reduce((sum, blob) => sum + blob.size, 0)}
            blobUsage={tx.blobs.reduce((sum, blob) => sum + blob.usageSize, 0)}
            byteUnit="KiB"
            hideUnit
          />
        ),
      },
      {
        item: <AddressCell address={tx.from} />,
      },
      {
        className: "px-1",
        item: (
          <Badge size="xs" variant="primary" className="h-5 px-1.5 text-[10px]">
            {role === "self" ? "SELF" : role === "sent" ? "OUT" : "IN"}
          </Badge>
        ),
      },
      {
        item: <AddressCell address={tx.to} />,
      },
      ...[tx.blobGasBaseFee, tx.blobGasMaxFee, tx.block.blobGasPrice].map(
        (fee) => ({
          item: <TableAmount weiAmount={fee} />,
        })
      ),
    ],
    expandItem: <TransactionBlobsTable blobs={blobs} txHash={hash} />,
  };
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
    const { state: urlState, isReady } = useUrlState(paginationParamsSchema);
    const { cursor, ps } = normalizePaginationParams(urlState);
    const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");
    const { data, isLoading, error } = api.tx.getAllByCursor.useQuery<{
      transactions: TransactionWithExpandedBlockAndBlob[];
      pagination: Pagination;
    }>(
      { cursor, ps, address, expand: "block,blob" },
      {
        enabled: enabled && isReady,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
      }
    );

    if (error) {
      return (
        <ErrorPage
          error={error}
          overrides={
            cursor
              ? undefined
              : {
                  BAD_REQUEST: {
                    title: "Invalid Address",
                    description: "Please provide a valid Ethereum address.",
                  },
                }
          }
        />
      );
    }

    return (
      <PaginatedTable
        tableClassName="w-full min-w-[1320px]"
        title={
          <div className="flex items-center gap-2">
            <span>Blob Transactions</span>
            <CountBadge count={totalTransactions} />
          </div>
        }
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
                className: "w-[120px] text-right",
              },
              {
                item: (
                  <>
                    Blob Max Fee
                    <br />
                    (Gwei)
                  </>
                ),
                className: "w-[120px] text-right",
              },
              {
                item: (
                  <>
                    Blob Gas Price
                    <br />
                    (Gwei)
                  </>
                ),
                className: "w-auto text-right",
              },
            ],
            className: "whitespace-nowrap px-2",
          },
        ]}
        rows={data?.transactions.map((tx) =>
          getTransactionRow(tx, address, timeFormat)
        )}
        pagination={data?.pagination}
        totalItems={totalTransactions}
        paginationData={{ cursor, ps }}
        isExpandable
      />
    );
  };
