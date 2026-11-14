import { useMemo, useState } from "react";
import type { NextPage } from "next";

import dayjs from "@blobscan/dayjs";

import { CountBadge } from "~/components/Badges/CountBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { ListControlBar } from "~/components/ControlBars/ListControlBar";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { TableAmount } from "~/components/Table/Amount";
import type { TimestampFormat } from "~/components/Toggles";
import { TimestampToggle } from "~/components/Toggles";
import { TransactionBlobsTable } from "~/components/TransactionBlobsTable";
import { api } from "~/api-client";
import { useListPageParams } from "~/hooks/useListPageParams";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import type { Pagination, TransactionWithExpandedBlockAndBlob } from "~/types";
import type { ByteUnit } from "~/utils";
import { formatTimestamp, shortenHash, toChecksumAddress } from "~/utils";

const BYTES_UNIT: ByteUnit = "KiB";

const Txs: NextPage = function () {
  const { pagination, filterParams, sort, isReady } = useListPageParams();
  const {
    data: txsData,
    isLoading: txsIsLoading,
    error: txsError,
  } = api.tx.getAllByCursor.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
    pagination: Pagination;
  }>(
    {
      ...pagination,
      ...filterParams,
      sort,
      expand: "block,blob",
    },
    { enabled: isReady }
  );
  const { data: countData, error: countError } = api.tx.getCount.useQuery(
    filterParams,
    {
      enabled: isReady,
    }
  );
  const { transactions } = txsData || {};
  const error = txsError ?? countError;
  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");
  const transactionHeaders = [
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
          className: timeFormat === "relative" ? "w-[130px]" : "w-[175px]",
        },
        { item: "Blobs", className: "w-[62px]" },
        {
          item: `Blob Usage (${BYTES_UNIT})`,
          className: "w-[148px]",
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
          item: "Blob Base Fee (Gwei)",
          className: "text-right w-[120px]",
        },
        {
          item: "Blob Max Fee (Gwei)",
          className: "text-right w-[120px]",
        },
        {
          item: "Blob Gas Price (Gwei)",
          className: "w-[140px] text-right",
        },
      ],
    },
  ];
  const transactionRows = useMemo(() => {
    return transactions
      ? transactions.map(
          ({
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
          }) => {
            const checksumFrom = toChecksumAddress(from);
            const checksumTo = toChecksumAddress(to);
            const totalBlobSize = blobs.reduce(
              (acc, { size }) => acc + size,
              0
            );
            const totalBlobUsage = blobs.reduce(
              (acc, { usageSize }) => acc + usageSize,
              0
            );
            return {
              cells: [
                {
                  className: "px-2",
                  item:
                    category === "rollup" && rollup ? (
                      <RollupBadge rollup={rollup} compact />
                    ) : (
                      <></>
                    ),
                },
                {
                  item: (
                    <Copyable value={hash} tooltipText="Copy hash">
                      <Link href={routes.tx(hash)}>{shortenHash(hash)}</Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <Link href={routes.block(blockNumber)}>{blockNumber}</Link>
                  ),
                },
                {
                  item:
                    timeFormat === "relative"
                      ? formatTimestamp(blockTimestamp, true)
                      : dayjs(blockTimestamp).format("YYYY-MM-DD HH:mm:ss"),
                },
                { item: blobs.length },
                {
                  item: (
                    <BlobUsageDisplay
                      blobSize={totalBlobSize}
                      blobUsage={totalBlobUsage}
                      byteUnit={BYTES_UNIT}
                      hideUnit
                    />
                  ),
                },
                {
                  item: (
                    <Copyable
                      value={checksumFrom}
                      tooltipText="Copy the origin address"
                    >
                      <Link href={routes.address(from)}>
                        {shortenHash(checksumFrom)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <Copyable
                      value={checksumTo}
                      tooltipText="Copy the destination address"
                    >
                      <Link href={routes.address(to)}>
                        {shortenHash(checksumTo)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: <TableAmount weiAmount={blobGasBaseFee} />,
                },
                {
                  item: <TableAmount weiAmount={blobGasMaxFee} />,
                },
                {
                  item: <TableAmount weiAmount={block.blobGasPrice} />,
                },
              ],
              expandItem: <TransactionBlobsTable blobs={blobs} txHash={hash} />,
            };
          }
        )
      : undefined;
  }, [transactions, timeFormat]);

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <>
      <SeoMetaTags
        title="Blob Transactions"
        description="Browse and explore all blob transactions."
      />
      <Header>
        <div className="flex items-center gap-2">
          <span>Blob Transactions</span>
          <CountBadge count={countData?.totalTransactions} />
        </div>
      </Header>
      <ListControlBar />
      <PaginatedTable
        emptyStateDescription="No Blob Transactions"
        isLoading={!isReady || txsIsLoading}
        headers={transactionHeaders}
        rows={transactionRows}
        pagination={txsData?.pagination}
        totalItems={countData?.totalTransactions}
        paginationData={pagination}
        isExpandable
      />
    </>
  );
};

export default Txs;
