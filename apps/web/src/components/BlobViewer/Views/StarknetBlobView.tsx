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
  data: decodedBlobProps,
}) {
  const originalDecodedBlobRef = useRef<DecodedStarknetBlob>();
  const [decodedBlob, setDecodedBlob] = useState<
    DecodedStarknetBlob | undefined | null
  >(decodedBlobProps);
  const [originalDataToggle, setOriginalDataToggle] = useState<boolean>(false);

  useEffect(() => {
    if (!originalDataToggle) {
      setDecodedBlob(decodedBlobProps);

      return;
    }

    let cachedDecodedBlob = originalDecodedBlobRef.current;

    if (!cachedDecodedBlob && decodedBlobProps) {
      cachedDecodedBlob = {
        classDeclarations: decodedBlobProps.classDeclarations.map(
          ({ classHash, compiledClassHash }) => ({
            classHash: hexToBigInt(classHash),
            compiledClassHash: hexToBigInt(compiledClassHash),
          })
        ),
        classDeclarationsSize: decodedBlobProps.classDeclarationsSize,
        stateUpdates: decodedBlobProps?.stateUpdates.map(
          ({
            contractAddress,
            newClassHash,
            nonce,
            numberOfStorageUpdates,
            storageUpdates,
          }) => ({
            contractAddress: hexToBigInt(contractAddress),
            newClassHash: newClassHash ? hexToBigInt(newClassHash) : null,
            nonce,
            numberOfStorageUpdates,
            storageUpdates: storageUpdates.map(({ key, value }) => ({
              key: hexToBigInt(key),
              value: hexToBigInt(value),
            })),
          })
        ),
        stateUpdatesSize: decodedBlobProps.stateUpdatesSize,
      };

      originalDecodedBlobRef.current = cachedDecodedBlob;
    }

    setDecodedBlob(cachedDecodedBlob);
  }, [originalDataToggle, decodedBlobProps, originalDecodedBlobRef]);

  if (!decodedBlob) {
    return <ErrorMessage error="No starknet state diffs found" />;
  }

  return (
    <div className="flex flex-col gap-10">
      <Table
        headers={[
          {
            cells: [
              {
                item: (
                  <span>
                    Class Declarations ({decodedBlob.classDeclarations.length})
                  </span>
                ),
                alignment: "center",
              },
            ],
            spanFullRow: true,
          },
          {
            cells: [
              {
                item: "Class Hash",
              },
              {
                item: "Compiled Class Hash",
              },
            ],
          },
        ]}
        rows={decodedBlob.classDeclarations.map(
          ({ classHash, compiledClassHash }) => ({
            cells: [
              {
                item: classHash,
              },
              {
                item: compiledClassHash,
              },
            ],
          })
        )}
      />
      <Table
        expandableRowsMode
        headers={[
          {
            cells: [
              {
                item: (
                  <div className="relative w-full">
                    State Updates ({decodedBlob.stateUpdatesSize}){" "}
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
                item: "S. Updates",
              },
              {
                item: "Nonce",
              },
              {
                item: "New Class Hash",
              },
            ],
          },
        ]}
        rows={decodedBlob.stateUpdates.map(
          ({ contractAddress, newClassHash, nonce, storageUpdates }) => ({
            cells: [
              {
                item: contractAddress,
              },
              {
                item: storageUpdates.length,
              },
              {
                item: nonce,
              },
              {
                item: newClassHash,
              },
            ],
            expandItem: storageUpdates.length ? (
              <div className="mb-4  w-full rounded-lg bg-primary-50 px-8 dark:bg-primary-800">
                <Table
                  className="mb-4 mt-2 max-h-[420px]"
                  size="xs"
                  alignment="center"
                  variant="simple"
                  headers={[
                    {
                      cells: [
                        {
                          item: `Storage Updades (${storageUpdates.length})`,
                          className:
                            "dark:border-border-dark/20 bg-primary-50 px-8 dark:bg-primary-800",
                          spanFullRow: true,
                        },
                      ],
                      className:
                        "border-none bg-primary-50 px-8 dark:bg-primary-800",
                    },
                    {
                      cells: [
                        {
                          item: "Key",
                          alignment: "left",
                          className:
                            "dark:border-border-dark/20 bg-primary-50 px-8 dark:bg-primary-800",
                        },
                        {
                          item: "Value",
                          alignment: "left",
                          className:
                            "dark:border-border-dark/20 bg-primary-50 px-8 dark:bg-primary-800",
                        },
                      ],
                      className:
                        "dark:border-border-dark/20 bg-primary-50 px-8 dark:bg-primary-800",
                    },
                  ]}
                  rows={storageUpdates.map(({ key, value }) => ({
                    cells: [
                      {
                        item: key,
                        alignment: "left",
                      },
                      {
                        item: value,
                        alignment: "left",
                      },
                    ],
                  }))}
                />
              </div>
            ) : (
              <div />
            ),
          })
        )}
      />
    </div>
  );
};
