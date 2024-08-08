import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable/PaginatedTable";
import { Table } from "~/components/Table";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { DeserializedBlock } from "~/utils";
import {
  buildBlobRoute,
  buildBlockRoute,
  buildSlotExternalUrl,
  buildTransactionRoute,
  deserializeBlock,
  formatNumber,
} from "~/utils";

export const BLOCKS_TABLE_HEADERS = [
  {
    cells: [
      {
        item: "Block number",
        className: "2xl:w-[187px] lg:w-[158px] w-[118px]",
      },
      {
        item: "Timestamp",
        className: "2xl:w-[237px] lg:w-[200px] w-[158px]",
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

const Blocks: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const {
    data: rawBlocksData,
    isLoading,
    error,
  } = api.block.getAll.useQuery({ p, ps });
  const blocksData = useMemo(() => {
    if (!rawBlocksData) {
      return {};
    }

    return {
      totalBlocks: rawBlocksData.totalBlocks,
      blocks: rawBlocksData.blocks.map(deserializeBlock),
    };
  }, [rawBlocksData]);
  const { blocks, totalBlocks } = blocksData;

  const blocksRows = useMemo(() => {
    return blocks
      ? blocks.map((block: DeserializedBlock) => {
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

            const transactionsCombinedWithInnerBlobs = transactions.flatMap(
              (transaction) =>
                transaction.blobs.map((blob) => ({
                  transactionHash: transaction.hash,
                  blobVersionedHash: blob.versionedHash,
                }))
            );

            const rows = transactionsCombinedWithInnerBlobs.map(
              ({ transactionHash, blobVersionedHash }) => ({
                cells: [
                  {
                    item: (
                      <Link href={buildTransactionRoute(transactionHash)}>
                        {transactionHash}
                      </Link>
                    ),
                  },
                  {
                    item: (
                      <Link href={buildBlobRoute(blobVersionedHash)}>
                        {blobVersionedHash}
                      </Link>
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
                variant="transparent"
                headers={headers}
                rows={rows}
              />
            );
          };

          return {
            cells: [
              {
                item: <Link href={buildBlockRoute(number)}>{number}</Link>,
              },
              {
                item: timestamp.fromNow(),
              },
              {
                item: (
                  <Link href={buildSlotExternalUrl(slot)} isExternal>
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
                item: <BlobGasUsageDisplay blobGasUsed={blobGasUsed} compact />,
              },
            ],
            expandItem: getBlocksTableRowExpandItem(block),
          };
        })
      : undefined;
  }, [blocks]);

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
      title={`Blocks ${totalBlocks ? `(${formatNumber(totalBlocks)})` : ""}`}
      isLoading={isLoading}
      headers={BLOCKS_TABLE_HEADERS}
      rows={blocksRows}
      totalItems={totalBlocks}
      paginationData={{ pageSize: ps, page: p }}
      isExpandable
      rowSkeletonHeight={44}
    />
  );
};

export default Blocks;
