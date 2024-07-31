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
      },
      {
        item: "Timestamp",
      },
      {
        item: "Slot",
      },
      {
        item: "Txs",
      },
      {
        item: "Blobs",
      },
      {
        item: "Blob Gas Price",
      },
      {
        item: "Blob Gas Used",
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
                item: <EtherUnitDisplay amount={blobGasPrice} />,
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
      totalItems={totalBlocks || 0}
      paginationData={{ pageSize: ps, page: p }}
      isExpandable
    />
  );
};

export default Blocks;
