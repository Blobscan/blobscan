import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { Link } from "~/components/Link";
import { Table } from "~/components/Table";
import { buildBlockRoute } from "~/utils";
import type { DeserializedBlock } from "~/utils";

export const blocksTableHeaders = [
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

export const getBlocksTableRowExpandItem = ({
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
          item: transactionHash,
        },
        {
          item: blobVersionedHash,
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

export const getBlocksTableRows = (blocks?: DeserializedBlock[]) =>
  blocks
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

        return {
          cells: [
            {
              item: (
                <div className="text-contentTertiary-light dark:text-contentTertiary-dark">
                  <Link href={buildBlockRoute(number)}>{number}</Link>
                </div>
              ),
            },
            {
              item: timestamp.fromNow(),
            },
            {
              item: (
                <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
                  {slot}
                </span>
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
              item: <BlobGasUsageDisplay blobGasUsed={blobGasUsed} />,
            },
          ],
          expandItem: getBlocksTableRowExpandItem(block),
        };
      })
    : undefined;
