import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
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

export const getBlocksTableRows = (blocks?: DeserializedBlock[]) =>
  blocks
    ? blocks.map(
        ({
          blobGasPrice,
          blobGasUsed,
          number,
          slot,
          timestamp,
          transactions,
        }) => {
          const blobCount = transactions?.reduce(
            (acc, tx) => acc + tx.blobs.length,
            0
          );

          return {
            cells: [
              {
                item: <></>,
              },
              {
                item: number,
              },
              {
                item: timestamp.fromNow(),
              },
              {
                item: slot,
              },
              {
                item: <span>{transactions.length}</span>,
              },
              {
                item: <span>{blobCount}</span>,
              },
              {
                item: <EtherUnitDisplay amount={blobGasPrice} />,
              },
              {
                item: <BlobGasUsageDisplay blobGasUsed={blobGasUsed} />,
              },
            ],
          };
        }
      )
    : undefined;
