import { useState, useEffect, useRef } from "react";
import type { FC } from "react";

import type { DecodedStarknetBlob } from "@blobscan/blob-decoder";

import { Link } from "~/components/Link";
import { Table } from "~/components/Table";
import { Toggle } from "~/components/Toggle";
import { hexToBigInt } from "~/utils";
import { ErrorMessage } from "../ErrorMessage";
import type { BlobViewProps } from "../index";

export type StarknetBlobViewProps = BlobViewProps<DecodedStarknetBlob>;

const STARKNET_BASE_URL = "https://starkscan.co";

function buildContractUrl(contractAddress: string) {
  return `${STARKNET_BASE_URL}/contract/${contractAddress}`;
}

function buildClassUrl(classHash: string) {
  return `${STARKNET_BASE_URL}/class/${classHash}`;
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
                  <span className="text-base">
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
                item: (
                  <Link
                    href={buildClassUrl(classHash)}
                    isExternal
                    hideExternalIcon
                  >
                    {classHash}
                  </Link>
                ),
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
                  <div className="relative w-full text-base">
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
                item: "Updates",
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
                item: (
                  <Link
                    href={buildContractUrl(contractAddress)}
                    isExternal
                    hideExternalIcon
                  >
                    {contractAddress}
                  </Link>
                ),
              },
              {
                item: storageUpdates.length,
              },
              {
                item: nonce,
              },
              {
                item: newClassHash ? (
                  <Link
                    href={buildClassUrl(newClassHash)}
                    isExternal
                    hideExternalIcon
                  >
                    {newClassHash}
                  </Link>
                ) : null,
              },
            ],
            expandItem: storageUpdates.length ? (
              <div className="mb-4 w-full bg-primary-50 px-3 dark:bg-primary-800">
                <Table
                  className="mb-4 mt-2 max-h-[420px] w-full"
                  size="xs"
                  alignment="center"
                  headers={[
                    {
                      cells: [
                        {
                          item: `Storage Updades`,
                          spanFullRow: true,
                        },
                      ],
                    },
                    {
                      cells: [
                        {
                          item: "Key",
                          alignment: "left",
                        },
                        {
                          item: "Value",
                          alignment: "left",
                        },
                      ],
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
            ) : undefined,
          })
        )}
      />
    </div>
  );
};
