import { useState, useEffect, useRef } from "react";
import type { FC } from "react";

import type { DecodedStarknetBlob } from "@blobscan/blob-decoder";

import { Table } from "~/components/Table";
import { Toggle } from "~/components/Toggle";
import { ErrorMessage } from "../ErrorMessage";
import type { BlobViewProps } from "../index";

export type StarknetBlobViewProps = BlobViewProps<DecodedStarknetBlob>;

function hexToBigInt(hex: string): string {
  return BigInt(hex).toString(10);
}
export const StarknetBlobView: FC<StarknetBlobViewProps> = function ({
  data: stateDiffsProps,
}) {
  const originalStateDiffsRef = useRef<DecodedStarknetBlob>();
  const [stateDiffs, setStateDiffs] = useState<
    DecodedStarknetBlob | undefined | null
  >(stateDiffsProps);
  const [originalDataToggle, setOriginalDataToggle] = useState<boolean>(false);

  useEffect(() => {
    if (originalDataToggle) {
      let cachedOriginalStateDiffs = originalStateDiffsRef.current;
      if (!cachedOriginalStateDiffs) {
        cachedOriginalStateDiffs = stateDiffsProps?.map(
          ({
            contractAddress,
            newClassHash,
            nonce,
            numberOfStorageUpdates,
            storageUpdates,
          }) => ({
            contractAddress: hexToBigInt(contractAddress),
            newClassHash: hexToBigInt(newClassHash),
            nonce,
            numberOfStorageUpdates,
            storageUpdates: storageUpdates.map(({ key, value }) => ({
              key: hexToBigInt(key),
              value: hexToBigInt(value),
            })),
          })
        );

        originalStateDiffsRef.current = cachedOriginalStateDiffs;
      }

      setStateDiffs(cachedOriginalStateDiffs);
    } else {
      setStateDiffs(stateDiffsProps);
    }
  }, [originalDataToggle, stateDiffsProps, originalStateDiffsRef]);

  if (!stateDiffs) {
    return <ErrorMessage error="No starknet state diffs found" />;
  }

  return (
    <Table
      expandableRowsMode
      headers={[
        {
          cells: [
            {
              item: (
                <div className="relative w-full">
                  Starknet State Diffs ({stateDiffs.length}){" "}
                  <div className="absolute right-10 top-1">
                    <div className="flex items-center justify-center gap-2">
                      <Toggle
                        onToggle={() =>
                          setOriginalDataToggle((prevToggle) => !prevToggle)
                        }
                      />{" "}
                      <div className="text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
                        Original Data
                      </div>
                    </div>
                  </div>
                </div>
              ),
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
      rows={stateDiffs.map(
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
