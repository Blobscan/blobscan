import type { FC } from "react";

import type { DecodedStarknetBlob } from "@blobscan/blob-decoder";

import { Table } from "~/components/Table";
import { ErrorMessage } from "../ErrorMessage";
import type { BlobViewProps } from "../index";

export type StarknetBlobViewProps = BlobViewProps<DecodedStarknetBlob>;

export const StarknetBlobView: FC<StarknetBlobViewProps> = function ({
  data: starknetStateDiffs,
}) {
  if (!starknetStateDiffs) {
    return <ErrorMessage error="No starknet state diffs found" />;
  }

  return (
    <Table
      expandableRowsMode
      headers={[
        {
          cells: [
            {
              item: `Starknet State Diffs (${starknetStateDiffs.length})`,
              alignment: "center",
            },
          ],
          spanFullRow: true,
        },
        {
          cells: [
            {
              item: "Contract Address",
            },
            {
              item: "New Class Hash",
            },
            {
              item: "Nonce",
            },
          ],
        },
      ]}
      rows={starknetStateDiffs.map(
        ({ contractAddress, newClassHash, nonce, storageUpdates }) => ({
          cells: [
            {
              item: contractAddress,
            },
            {
              item: newClassHash,
            },
            {
              item: nonce,
            },
          ],
          expandItem: (
            <Table
              className="max-h-[420px]"
              size="xs"
              alignment="center"
              variant="simple"
              headers={[
                {
                  cells: [
                    {
                      item: `Storage Updades (${storageUpdates.length})`,
                      spanFullRow: true,
                    },
                  ],
                  className: "border-none",
                },
                {
                  cells: [
                    {
                      item: "Key",
                    },
                    {
                      item: "Value",
                    },
                  ],
                  className: "dark:border-border-dark/20",
                  sticky: true,
                },
              ]}
              rows={storageUpdates.map(({ key, value }) => ({
                cells: [
                  {
                    item: key,
                  },
                  {
                    item: value,
                  },
                ],
                className: "dark:border-border-dark/10",
              }))}
            />
          ),
        })
      )}
    />
  );
};
