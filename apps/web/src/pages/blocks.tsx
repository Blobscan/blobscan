import { useMemo, useState } from "react";
import type { NextPage } from "next";

import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";

import { Copyable } from "~/components/Copyable";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
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
import { useEnv } from "~/providers/Env";
import type { BlockWithExpandedTransactions } from "~/types";
import type { DeserializedBlock } from "~/utils";
import {
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  deserializeBlock,
  formatNumber,
} from "~/utils";

const Blocks: NextPage = function () {
  const { env } = useEnv();
  const { filterParams, paginationParams } = useQueryParams();
  const {
    data: serializedBlocksData,
    isLoading: blocksIsLoading,
    error: blocksError,
  } = api.block.getAll.useQuery<{ blocks: BlockWithExpandedTransactions[] }>({
    ...paginationParams,
    ...filterParams,
    expand: "transaction",
  });
  const {
    data: countData,
    error: countError,
    isLoading: countIsLoading,
  } = api.block.getCount.useQuery(filterParams, {
    refetchOnWindowFocus: false,
  });
  const blocksData = useMemo(() => {
    if (!serializedBlocksData) {
      return {};
    }

    return {
      blocks: serializedBlocksData.blocks.map(deserializeBlock),
    };
  }, [serializedBlocksData]);
  const { blocks } = blocksData;
  const { totalBlocks } = countData || {};
  const error = blocksError || countError;

  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");

  const BLOCKS_TABLE_HEADERS = [
    {
      cells: [
        {
          item: "",
          className: "w-[100px]",
        },
        {
          item: "Block number",
          className: "2xl:w-[187px] lg:w-[158px] w-[118px]",
        },
        {
          item: (
            <TimestampToggle format={timeFormat} onChange={setTimeFormat} />
          ),
          className: "2xl:w-[237px] lg:w-[200px] w-[170px]",
        },
        {
          item: "Slot",
          className: "2xl:w-[136px] lg:w-[115px] w-[96px]",
        },
        {
          item: "Txs",
          className: "2xl:w-[77px] w-[66px]",
        },
        {
          item: "Blobs",
          className: "2xl:w-[98px] w-[83px]",
        },
        {
          item: "Blob Gas Price",
          className: "2xl:w-[195px] w-[165px]",
        },
        {
          item: "Blob Gas Used",
          className: "2xl:w-full w-[240px]",
        },
      ],
    },
  ];

  const blocksRows = useMemo(() => {
    if (!blocks || !env) {
      return;
    }

    return blocks.map((block: DeserializedBlock) => {
      const {
        blobGasPrice,
        blobGasUsed,
        number,
        slot,
        timestamp,
        transactions,
      } = block;
      const blobCount = transactions?.reduce(
        (acc, tx) => acc + tx.blobs.length,
        0
      );

      const getBlocksTableRowExpandItem = ({
        transactions,
      }: DeserializedBlock) => {
        const headers = [
          {
            cells: [
              { item: "" },
              {
                item: "Tx Hash",
              },
              {
                item: "Blob Versioned Hash",
              },
            ],
            className: "dark:border-border-dark/20",
            sticky: true,
          },
        ];

        const transactionsCombinedWithInnerBlobs = transactions.flatMap((tx) =>
          tx.blobs.map((blob) => ({
            transactionHash: tx.hash,
            blobVersionedHash: blob.versionedHash,
            category: tx.category,
            rollup: tx.rollup,
          }))
        );

        const rows = transactionsCombinedWithInnerBlobs.map(
          ({ transactionHash, blobVersionedHash, rollup, category }) => ({
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
                  <Copyable
                    value={transactionHash}
                    tooltipText="Copy transaction hash"
                  >
                    <Link href={buildTransactionRoute(transactionHash)}>
                      {transactionHash}
                    </Link>
                  </Copyable>
                ),
              },
              {
                item: (
                  <Copyable
                    value={blobVersionedHash}
                    tooltipText="Copy blob versioned hash"
                  >
                    <Link href={buildBlobRoute(blobVersionedHash)}>
                      {blobVersionedHash}
                    </Link>
                  </Copyable>
                ),
              },
            ],
          })
        );

        return (
          <Table
            className="mb-4 mt-2 max-h-[420px] rounded-lg bg-primary-50 px-8 dark:bg-primary-800"
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
            item: (
              <div className="relative flex">
                {[...new Set(transactions.map((tx) => tx.rollup))].map(
                  (rollup, i) => {
                    return rollup ? (
                      <div key={i} className="-ml-1 first-of-type:ml-0">
                        <RollupIcon rollup={rollup} />
                      </div>
                    ) : (
                      <></>
                    );
                  }
                )}
              </div>
            ),
          },
          {
            item: (
              <Copyable
                value={number.toString()}
                tooltipText="Copy block number"
              >
                <Link href={buildBlockRoute(number)}>{number}</Link>
              </Copyable>
            ),
          },
          {
            item:
              timeFormat === "relative"
                ? timestamp.fromNow()
                : timestamp.format("YYYY-MM-DD HH:mm:ss"),
          },
          {
            item: (
              <Link
                href={`${env?.PUBLIC_BEACON_BASE_URL}/slot/${slot}`}
                isExternal
              >
                {slot}
              </Link>
            ),
          },
          {
            item: (
              <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
                {transactions.length}
              </span>
            ),
          },
          {
            item: (
              <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
                {blobCount}
              </span>
            ),
          },
          {
            item: <EtherUnitDisplay amount={blobGasPrice} toUnit="Gwei" />,
          },
          {
            item: (
              <BlobGasUsageDisplay
                networkBlobConfig={getNetworkBlobConfigBySlot(
                  env.PUBLIC_NETWORK_NAME,
                  slot
                )}
                blobGasUsed={blobGasUsed}
                compact
              />
            ),
          },
        ],
        expandItem: getBlocksTableRowExpandItem(block),
      };
    });
  }, [blocks, timeFormat, env]);

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
          <div>Blocks</div>
          <div>
            {!countIsLoading && totalBlocks !== undefined ? (
              `(${formatNumber(totalBlocks)})`
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
        isLoading={blocksIsLoading}
        headers={BLOCKS_TABLE_HEADERS}
        rows={blocksRows}
        totalItems={totalBlocks}
        paginationData={{
          pageSize: paginationParams.ps,
          page: paginationParams.p,
        }}
        isExpandable
        rowSkeletonHeight={44}
      />
    </>
  );
};

export default Blocks;
