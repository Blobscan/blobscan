import { Fragment, useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import NextError from "~/pages/_error";
import "react-loading-skeleton/dist/skeleton.css";
import { useQuery } from "@tanstack/react-query";

import type { Decoder } from "@blobscan/blob-decoder";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { BlobViewer, DEFAULT_BLOB_VIEW_MODES } from "~/components/BlobViewer";
import type { BlobViewMode } from "~/components/BlobViewer";
import { ErrorMessage } from "~/components/BlobViewer/ErrorMessage";
import { Card } from "~/components/Cards/Card";
import { CopyToClipboard } from "~/components/CopyToClipboard";
import { Copyable } from "~/components/Copyable";
import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps, Option } from "~/components/Dropdown";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { BlockStatus } from "~/components/Status";
import { api } from "~/api-client";
import type { Rollup } from "~/types";
import {
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  isValidDecoder,
} from "~/utils";

const Blob: NextPage = function () {
  const router = useRouter();
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

          const blobData = await (isBlobscanStorageRef
            ? response.json()
            : response.text());

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
  const blobViewModesOptions: DropdownProps["options"] = blobViewModes.map(
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
          <BlockStatus blockNumber={blob.transactions[0].blockNumber} />
        ),
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
      }
    );

    detailsFields.push({ name: "Size", value: formatBytes(blob.size) });

    console.log("here");
    if (blob.dataStorageReferences.length > 0) {
      detailsFields.push({
        name: "Storages",
        value: (
          <div className="flex items-center gap-x-2">
            {blob.dataStorageReferences.map(({ storage, url }, index) => (
              <StorageBadge key={index} storage={storage} url={url} />
            ))}
          </div>
        ),
      });
    }

    detailsFields.push({
      name: "Transactions and Blocks",
      value: (
        <div className="grid w-full grid-cols-3 gap-x-6 gap-y-3">
          {blob.transactions.map(({ txHash, blockNumber }) => (
            <Fragment key={`${txHash}-${blockNumber}`}>
              <div className="col-span-2 flex gap-1">
                <div className="text-contentSecondary-light dark:text-contentSecondary-dark">
                  Tx{" "}
                </div>
                <div
                  className="flex items-center gap-2 truncate"
                  title={txHash}
                >
                  {<Link href={buildTransactionRoute(txHash)}>{txHash}</Link>}
                  <CopyToClipboard value={txHash} tooltipText="Copy tx hash" />
                </div>
              </div>
              <div className="flex gap-1">
                <div className="text-contentSecondary-light dark:text-contentSecondary-dark">
                  Block{" "}
                </div>
                <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
              </div>
            </Fragment>
          ))}
        </div>
      ),
    });
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
                    onChange={(option: Option) =>
                      option
                        ? setSelectedBlobViewMode(option.value as BlobViewMode)
                        : undefined
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
