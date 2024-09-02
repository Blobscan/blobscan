import { useMemo } from "react";
import type { NextPage } from "next";

import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { RollupIcon } from "~/components/RollupIcon";
import { Table } from "~/components/Table";
import { api } from "~/api-client";
import { useQueryParams } from "~/hooks/useQueryParams";
import NextError from "~/pages/_error";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import type { DeserializedBlob, DeserializedFullTransaction } from "~/utils";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  formatNumber,
  formatTimestamp,
  shortenAddress,
  deserializeFullTransaction,
  buildBlobRoute,
} from "~/utils";

type Transaction = Pick<
  DeserializedFullTransaction,
  | "hash"
  | "from"
  | "to"
  | "blobs"
  | "rollup"
  | "blockNumber"
  | "blobGasBaseFee"
  | "blobGasMaxFee"
  | "block"
  | "blockTimestamp"
> & { blobsLength?: number };

export const TRANSACTIONS_TABLE_HEADERS = [
  {
    cells: [
      {
        item: "Hash",
        className: "w-[150px]",
      },
      {
        item: "Block number",
        className: "w-[127px]",
      },
      {
        item: "Timestamp",
        className: "w-[160px]",
      },
      {
        item: "From",
        className: "w-[150px]",
      },
      {
        item: "To",
        className: "w-[148px]",
      },
      {
        item: "Rollup",
        className: "w-[72px]",
      },
      {
        item: "Blob Base Fee",
        className: "w-[172px]",
      },
      {
        item: "Blob Max Fee",
        className: "w-[162px]",
      },
      {
        item: "Blob Gas Price",
        className: "2xl:w-full w-[180px]",
      },
    ],
  },
];

const Txs: NextPage = function () {
  const { from, p, ps, rollup, startDate, endDate } = useQueryParams();

  const {
    data: rawTxsData,
    isLoading,
    error,
  } = api.tx.getAll.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
    totalTransactions: number;
  }>({
    from,
    p,
    ps,
    rollup,
    startDate,
    endDate,
    expand: "block,blob",
  });
  const txsData = useMemo(() => {
    if (!rawTxsData) {
      return;
    }

    return {
      totalTransactions: rawTxsData.totalTransactions,
      transactions: rawTxsData.transactions.map(deserializeFullTransaction),
    };
  }, [rawTxsData]);
  const { transactions, totalTransactions } = txsData || {};

  const transactionRows = useMemo(() => {
    return transactions
      ? transactions.map((t: Transaction) => {
          const {
            hash,
            from,
            to,
            blobs,
            rollup,
            blockNumber,
            blobGasBaseFee,
            blobGasMaxFee,
            block,
            blockTimestamp,
          } = t;

          const getTransactionsTableRowExpandItem = (
            blobs?: Pick<
              DeserializedBlob,
              | "versionedHash"
              | "commitment"
              | "size"
              | "dataStorageReferences"
              | "proof"
            >[]
          ) => {
            const headers = [
              {
                cells: [
                  {
                    item: "Blob Versioned Hash",
                  },
                  {
                    item: "Size",
                  },
                ],
                className: "dark:border-border-dark/20",
                sticky: true,
              },
            ];

            const rows = blobs
              ? blobs.map((b) => ({
                  cells: [
                    {
                      item: (
                        <Link href={buildBlobRoute(b.versionedHash)}>
                          {b.versionedHash}
                        </Link>
                      ),
                    },
                    {
                      item: (
                        <div className="flex gap-2">
                          <span>{formatBytes(b.size)}</span>
                        </div>
                      ),
                    },
                  ],
                  className: "dark:border-border-dark/10",
                }))
              : undefined;

            return (
              <Table
                className="mb-4 mt-2 max-h-[420px] rounded-lg bg-primary-50 px-8 dark:bg-primary-800"
                size="xs"
                alignment="left"
                variant="transparent"
                headers={headers}
                rows={rows}
              />
            );
          };

          return {
            cells: [
              {
                item: (
                  <Link href={buildTransactionRoute(hash)}>
                    {shortenAddress(hash, 6)}
                  </Link>
                ),
              },
              {
                item: (
                  <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
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
                  <Link href={buildAddressRoute(from)}>
                    {shortenAddress(from, 6)}
                  </Link>
                ),
              },
              {
                item: (
                  <Link href={buildAddressRoute(to)}>
                    {shortenAddress(to, 6)}
                  </Link>
                ),
              },
              {
                item: rollup ? <RollupIcon rollup={rollup} /> : <></>,
              },
              {
                item: (
                  <div className="truncate">
                    <EtherUnitDisplay amount={blobGasBaseFee} toUnit="Gwei" />
                  </div>
                ),
              },
              {
                item: (
                  <div className="truncate">
                    <EtherUnitDisplay amount={blobGasMaxFee} toUnit="Gwei" />
                  </div>
                ),
              },
              {
                item: (
                  <div className="truncate">
                    <EtherUnitDisplay
                      amount={block.blobGasPrice}
                      toUnit="Gwei"
                    />
                  </div>
                ),
              },
            ],
            expandItem: getTransactionsTableRowExpandItem(blobs),
          };
        })
      : undefined;
  }, [transactions]);

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
      title={`Blob Transactions ${
        totalTransactions ? `(${formatNumber(totalTransactions)})` : ""
      }`}
      isLoading={isLoading}
      headers={TRANSACTIONS_TABLE_HEADERS}
      rows={transactionRows}
      totalItems={totalTransactions}
      paginationData={{ pageSize: ps, page: p }}
      isExpandable
    />
  );
};

export default Txs;
