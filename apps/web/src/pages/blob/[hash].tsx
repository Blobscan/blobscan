import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import NextError from "~/pages/_error";
import "react-loading-skeleton/dist/skeleton.css";
import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";

import type { Decoder } from "@blobscan/blob-decoder";
import dayjs from "@blobscan/dayjs";

import { BlockStatusBadge } from "~/components/Badges/BlockStatusBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { BlobViewer, DEFAULT_BLOB_VIEW_MODES } from "~/components/BlobViewer";
import type { BlobViewMode } from "~/components/BlobViewer";
import { ErrorMessage } from "~/components/BlobViewer/ErrorMessage";
import { Card } from "~/components/Cards/Card";
import { CopyToClipboard } from "~/components/CopyToClipboard";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import type { Option } from "~/components/Dropdown";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { Listbox } from "~/components/Selects";
import { api } from "~/api-client";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import {
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  formatTimestamp,
  isValidDecoder,
  TIMESTAMP_FORMAT,
} from "~/utils";

const Blob: NextPage = function () {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const versionedHash = (router.query.hash as string | undefined) ?? "0";
  const {
    data: blob,
    error,
    isLoading,
  } = api.blob.getByBlobId.useQuery(
    {
      id: versionedHash,
      expand: "transaction",
    },
    {
      enabled: router.isReady,
    }
  );
  const { data: blobData, error: blobDataError } = useQuery({
    queryKey: ["blob-data", versionedHash],
    queryFn: async () => {
      if (!blob || !blob.dataStorageReferences.length) {
        return null;
      }

      for (const { storage, url } of blob.dataStorageReferences) {
        try {
          const response = await fetch(
            `/api/blob-data?storage=${storage}&url=${url}`
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              error.message ?? "Couldn't retrieve blob data: unknown reason"
            );
          }

          const blobBytes = await response.arrayBuffer();

          return `0x${Buffer.from(blobBytes).toString("hex")}`;
        } catch (err) {
          console.warn(
            `Failed to fetch data of blob "${versionedHash}" from storage ${storage}:`,
            err
          );

          continue;
        }
      }

      throw new Error(
        `Failed to fetch data of blob "${versionedHash}" from any storage`
      );
    },
    enabled: !!blob,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [selectedBlobViewMode, setSelectedBlobViewMode] =
    useState<BlobViewMode>("Raw");
  const decoder = blob?.transactions.find(
    ({ rollup }) => rollup && isValidDecoder(rollup)
  )?.rollup as Decoder | undefined;
  const blobViewModes: BlobViewMode[] = [
    ...(blob && decoder ? ["Decoded" as BlobViewMode] : []),
    ...DEFAULT_BLOB_VIEW_MODES,
  ];
  const blobViewModesOptions: Option<BlobViewMode>[] = blobViewModes.map(
    (blobViewMode) => ({ value: blobViewMode })
  );

  useEffect(() => {
    if (!decoder) {
      return;
    }

    setSelectedBlobViewMode("Decoded");
  }, [decoder]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!blob && !isLoading) {
    return <>Blob not found</>;
  }

  const detailsFields: DetailsLayoutProps["fields"] = [];

  if (blob) {
    const isUnique = blob.transactions.length === 1;

    detailsFields.push({
      name: "Versioned Hash",
      value: (
        <Copyable
          value={blob.versionedHash}
          tooltipText="Copy versioned hash"
        />
      ),
    });

    if (blob.transactions[0]) {
      detailsFields.push({
        name: "Status",
        value: blob.transactions[0] && (
          <BlockStatusBadge blockNumber={blob.transactions[0].blockNumber} />
        ),
      });
    }

    if (isUnique && blob.transactions[0]) {
      const { blockNumber, blockTimestamp, txHash, index, rollup } =
        blob.transactions[0];

      detailsFields.push(
        {
          name: "Block",
          value: (
            <div className="flex items-center gap-2 truncate">
              <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
              <CopyToClipboard
                value={blockNumber}
                tooltipText="Copy block number"
              />
            </div>
          ),
        },
        {
          name: "Transaction",
          value: (
            <div className="flex items-center gap-2 truncate" title={txHash}>
              {<Link href={buildTransactionRoute(txHash)}>{txHash}</Link>}
              <CopyToClipboard value={txHash} tooltipText="Copy tx hash" />
            </div>
          ),
        },
        {
          name: "Timestamp",
          value: (
            <div className="whitespace-break-spaces">
              {formatTimestamp(blockTimestamp)}
            </div>
          ),
        }
      );

      if (rollup) {
        detailsFields.push({
          name: "Rollup",
          value: <RollupBadge key={rollup} rollup={rollup} />,
        });
      }

      detailsFields.push({
        name: "Position In Transaction",
        value: index,
      });
    }

    detailsFields.push(
      {
        name: "Commitment",
        value: (
          <Copyable value={blob.commitment} tooltipText="Copy commitment" />
        ),
      },
      {
        name: "Proof",
        value: <Copyable value={blob.proof} tooltipText="Copy proof" />,
      },
      { name: "Size", value: formatBytes(blob.size) },
      {
        name: "Usage",
        value: (
          <BlobUsageDisplay
            blobSize={blob.size}
            blobUsage={blob.usageSize}
            variant="minimal"
          />
        ),
      }
    );

    if (blob.dataStorageReferences.length > 0) {
      detailsFields.push({
        name: "Storages",
        value: (
          <div className="flex flex-wrap items-center gap-2">
            {blob.dataStorageReferences.map(({ storage, url }) => (
              <StorageBadge key={storage} storage={storage} url={url} />
            ))}
          </div>
        ),
      });
    }

    if (!isUnique) {
      const rollupTxsExist = blob.transactions.find((tx) => !!tx.rollup);

      detailsFields.push({
        name: `Blocks And Transactions (${blob.transactions.length})`,
        value: (
          <div className="flex flex-col gap-6 md:gap-3">
            {blob.transactions.map(
              ({ txHash, blockNumber, blockTimestamp, rollup }) => (
                <div
                  key={`${txHash}-${blockNumber}`}
                  className="flex-start flex max-w-full flex-col gap-1 2xl:flex-row 2xl:items-center"
                >
                  <div className="flex w-[100px]">
                    <div className="flex items-center gap-1">
                      <Link href={buildBlockRoute(blockNumber)}>
                        {blockNumber}
                      </Link>
                      <CopyToClipboard
                        value={blockNumber}
                        tooltipText="Copy block number"
                      />
                    </div>
                  </div>
                  <div
                    className={classNames("flex w-full items-center gap-2 ", {
                      "lg:w-[580px]": !rollupTxsExist,
                      "lg:w-[600px]": rollupTxsExist,
                    })}
                  >
                    {rollup ? (
                      <RollupBadge rollup={rollup} compact />
                    ) : rollupTxsExist ? (
                      <div className="hidden size-4 md:block" />
                    ) : null}
                    <div
                      className="flex items-center gap-1 truncate"
                      title={txHash}
                    >
                      <Link href={buildTransactionRoute(txHash)}>{txHash}</Link>
                      <CopyToClipboard
                        value={txHash}
                        tooltipText="Copy tx hash"
                      />
                    </div>
                  </div>
                  {dayjs(blockTimestamp).format(
                    breakpoint === "sm" ? "YY/MM/DD hh:mm:ss" : TIMESTAMP_FORMAT
                  )}
                </div>
              )
            )}
          </div>
        ),
      });
    }
  }

  return (
    <>
      <DetailsLayout
        header="Blob Details"
        fields={blob ? detailsFields : undefined}
        resource={
          blob
            ? {
                type: "blob",
                value: blob.versionedHash,
              }
            : undefined
        }
      />
      <Card
        header={
          <div className="flex items-center justify-between">
            <div>Blob Data</div>
            {blob && blobData && (
              <div className="flex items-center gap-4">
                <CopyToClipboard
                  tooltipText="Copy blob data"
                  value={blobData}
                />
                <div className="flex items-center gap-2">
                  <div className="text-sm font-normal text-contentSecondary-light dark:text-contentSecondary-dark">
                    View as:
                  </div>
                  <Listbox
                    options={blobViewModesOptions}
                    selected={{
                      value: selectedBlobViewMode,
                      label: selectedBlobViewMode,
                    }}
                    onChange={(option) =>
                      option ? setSelectedBlobViewMode(option.value) : undefined
                    }
                  />
                </div>
              </div>
            )}
          </div>
        }
      >
        {blobDataError || blobData === null ? (
          <div className="text-md flex h-44 w-full items-center justify-center">
            {blobData === null ? (
              <div className="text-contentSecondary-light dark:text-contentTertiary-dark">
                Data not available yet
              </div>
            ) : (
              <ErrorMessage error={"Failed to retrieve blob data"} />
            )}
          </div>
        ) : (
          <BlobViewer
            data={blobData}
            selectedView={selectedBlobViewMode}
            decoder={decoder}
          />
        )}
      </Card>
    </>
  );
};

export default Blob;
