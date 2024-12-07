import { useMemo, useState } from "react";
import type { NextPage } from "next";

import dayjs from "@blobscan/dayjs";

import { Copyable } from "~/components/Copyable";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { Filters } from "~/components/Filters";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { RollupIcon } from "~/components/RollupIcon";
import { Skeleton } from "~/components/Skeleton";
import { Table } from "~/components/Table";
import type { TimestampFormat } from "~/components/TimestampToggle";
import { TimestampToggle } from "~/components/TimestampToggle";
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
  | "category"
> & { blobsLength?: number };

const Txs: NextPage = function () {
  const { filterParams, paginationParams } = useQueryParams();
  const {
    data: serializedTxs,
    isLoading: txsIsLoading,
    error: txsError,
  } = api.tx.getAll.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
    totalTransactions?: number;
  }>({
    ...paginationParams,
    ...filterParams,
    expand: "block,blob",
  });
  const {
    data: countData,
    error: countError,
    isLoading: countIsLoading,
  } = api.tx.getCount.useQuery(filterParams, {
    refetchOnWindowFocus: false,
  });
  const txsData = useMemo(() => {
    if (!serializedTxs) {
      return;
    }

    return {
      totalTransactions: serializedTxs.totalTransactions,
      transactions: serializedTxs.transactions.map(deserializeFullTransaction),
    };
  }, [serializedTxs]);
  const { transactions } = txsData || {};
  const { totalTransactions } = countData || {};
  const error = txsError ?? countError;
  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");

  const TRANSACTIONS_TABLE_HEADERS = [
    {
      cells: [
        { item: "", className: "w-[40px]" },
        {
          item: "Hash",
          className: "w-[150px]",
        },
        {
          item: "Block number",
          className: "w-[127px]",
        },
        {
          item: (
            <TimestampToggle format={timeFormat} onChange={setTimeFormat} />
          ),
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

  const transactionRows = useMemo(() => {
    return transactions
      ? transactions.map((t: Transaction) => {
          const {
            hash,
            from,
            to,
            blobs,
            rollup,
            category,
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
                    className: "bg-primary-50 dark:bg-primary-900",
                  },
                  {
                    item: "Size",
                    className: "bg-primary-50 dark:bg-primary-900",
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
                        <Copyable
                          value={b.versionedHash}
                          tooltipText="Copy blob versioned hash"
                        >
                          <Link href={buildBlobRoute(b.versionedHash)}>
                            {b.versionedHash}
                          </Link>
                        </Copyable>
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
                className="mb-4 mt-2 max-h-[420px] rounded-lg bg-primary-50 px-8 dark:bg-primary-900"
                size="xs"
                alignment="left"
                headers={headers}
                rows={rows}
              />
            );
          };

          return {
            cells: [
              {
                item:
                  category === "rollup" && rollup ? (
                    <RollupIcon rollup={rollup} />
                  ) : (
                    <></>
                  ),
              },
              {
                item: (
                  <Copyable value={hash} tooltipText="Copy hash">
                    <Link href={buildTransactionRoute(hash)}>
                      {shortenAddress(hash, 6)}
                    </Link>
                  </Copyable>
                ),
              },
              {
                item: (
                  <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
                ),
              },
              {
                item:
                  timeFormat === "relative"
                    ? formatTimestamp(blockTimestamp, true)
                    : dayjs(blockTimestamp).format("YYYY-MM-DD HH:mm:ss"),
              },
              {
                item: (
                  <Copyable value={from} tooltipText="Copy the origin address">
                    <Link href={buildAddressRoute(from)}>
                      {shortenAddress(from, 6)}
                    </Link>
                  </Copyable>
                ),
              },
              {
                item: (
                  <Copyable
                    value={to}
                    tooltipText="Copy the destination address"
                  >
                    <Link href={buildAddressRoute(to)}>
                      {shortenAddress(to, 6)}
                    </Link>
                  </Copyable>
                ),
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
  }, [transactions, timeFormat]);

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
          <div>Blob Transactions</div>
          <div>
            {!countIsLoading && totalTransactions !== undefined ? (
              `(${formatNumber(totalTransactions)})`
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
        isLoading={txsIsLoading}
        headers={TRANSACTIONS_TABLE_HEADERS}
        rows={transactionRows}
        totalItems={totalTransactions}
        paginationData={{
          pageSize: paginationParams.ps,
          page: paginationParams.p,
        }}
        isExpandable
      />
    </>
  );
};

export default Txs;
