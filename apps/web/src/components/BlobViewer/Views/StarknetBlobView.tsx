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
      <div className="-mb-6 self-end">
        <div className="flex items-center justify-center gap-2">
          <Toggle
            onToggle={() => setOriginalDataToggle((prevToggle) => !prevToggle)}
          />{" "}
          <div className="text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
            Raw Data
          </div>
        </div>
      </div>

      {decodedBlob.classDeclarationsSize > 0 && (
        <Table
          headers={[
            {
              cells: [
                {
                  item: (
                    <span className="text-base">
                      Class Declarations ({decodedBlob.classDeclarations.length}
                      )
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
                  item: originalDataToggle ? (
                    classHash
                  ) : (
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
      )}

      <Table
        expandableRowsMode
        headers={[
          {
            cells: [
              {
                item: (
                  <div className="text-base">
                    State Updates ({decodedBlob.stateUpdatesSize})
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
                item: originalDataToggle ? (
                  contractAddress
                ) : (
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
                item: originalDataToggle ? (
                  newClassHash
                ) : newClassHash ? (
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
              <div className="mb-4 mt-2 rounded-lg bg-primary-50 p-2 dark:bg-primary-900">
                <Table
                  className="max-h-[420px]"
                  size="xs"
                  alignment="center"
                  headers={[
                    {
                      cells: [
                        {
                          item: "Key",
                          alignment: "left",
                          className: "bg-primary-50 dark:bg-primary-900",
                        },
                        {
                          item: "Value",
                          alignment: "left",
                          className: "bg-primary-50 dark:bg-primary-900",
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
