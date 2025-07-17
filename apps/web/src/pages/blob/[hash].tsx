import { Fragment, useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import NextError from "~/pages/_error";
import "react-loading-skeleton/dist/skeleton.css";
import { useQuery } from "@tanstack/react-query";

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
import { Dropdown } from "~/components/Dropdown";
import type { Option } from "~/components/Dropdown";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { Separator } from "~/components/Separator";
import { api } from "~/api-client";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { Rollup } from "~/types";
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
          const isBlobscanStorageRef =
            storage === "postgres" || storage === "file_system";
          const blobDataUrl = isBlobscanStorageRef
            ? `/api/blob-data?url=${url}`
            : url;
          const response = await fetch(blobDataUrl);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message ?? "Couldn't retrieve blob data");
          }

          const contentType = response.headers.get("content-type");
          let blobData: string;

          const isBinaryFile =
            blobDataUrl.endsWith(".bin") ||
            contentType === "application/octet-stream";
          const isTextPlainFile =
            blobDataUrl.endsWith(".txt") || contentType === "text/plain";

          if (isBlobscanStorageRef) {
            blobData = await response.json();
          } else if (isTextPlainFile) {
            blobData = await response.text();
          } else if (isBinaryFile) {
            const blobBytes = await response.arrayBuffer();

            blobData = `0x${Buffer.from(blobBytes).toString("hex")}`;
          } else {
            throw new Error(
              `Unexpected content type "${contentType}" for URL "${blobDataUrl}"`
            );
          }

          return blobData;
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

    const rollups = blob.transactions
      .filter(({ rollup }) => !!rollup)
      .map(({ rollup }) => rollup as Rollup);

    if (rollups.length > 0) {
      detailsFields.push({
        name: "Rollup",
        value: rollups.map((rollup) => (
          <RollupBadge key={rollup} rollup={rollup} />
        )),
      });
    }

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
      const { blockNumber, blockTimestamp, txHash, index } =
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
        },
        {
          name: "Position In Transaction",
          value: index,
        }
      );
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
      }
    );

    detailsFields.push({ name: "Size", value: formatBytes(blob.size) });

    if (blob.dataStorageReferences.length > 0) {
      detailsFields.push({
        name: "Storages",
        value: (
          <div className="flex items-center gap-2">
            {blob.dataStorageReferences.map(({ storage, url }) => (
              <StorageBadge key={storage} storage={storage} url={url} />
            ))}
          </div>
        ),
      });
    }

    if (!isUnique) {
      detailsFields.push({
        name: `Blocks And Transactions (${blob.transactions.length})`,
        value: (
          <div className="flex flex-col gap-3">
            {blob.transactions.map(
              ({ txHash, blockNumber, blockTimestamp }) => (
                <div
                  key={`${txHash}-${blockNumber}`}
                  className="flex max-w-full items-center gap-1 truncate"
                >
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 truncate">
                      <Link href={buildBlockRoute(blockNumber)}>
                        {blockNumber}
                      </Link>
                      <CopyToClipboard
                        value={blockNumber}
                        tooltipText="Copy block number"
                      />
                    </div>
                  </div>
                  <div className="flex w-4/12 gap-2 md:w-4/12 md:max-w-full lg:w-auto">
                    <Separator />
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
                  <div className="flex items-center gap-1 truncate">
                    <Separator />
                    <div>
                      {dayjs(blockTimestamp).format(
                        breakpoint === "sm"
                          ? "YY/MM/DD hh:mm:ss"
                          : TIMESTAMP_FORMAT
                      )}
                    </div>
                  </div>
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
                  <Dropdown
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
