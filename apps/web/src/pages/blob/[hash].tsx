import { useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/compat/router";

import ErrorPage from "~/pages/_error";
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
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrow } from "~/components/NavArrow";
import type { SelectOption } from "~/components/Selects";
import { Listbox } from "~/components/Selects";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { api } from "~/api-client";
import {
  BLOB_EXPAND,
  BLOB_STALE_TIME,
  useAdjacentBlobNavigation,
} from "~/hooks/useAdjacentBlobNavigation";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { routes } from "~/routes";
import { versionedHashSchema } from "~/schemas/utils";
import {
  formatBytes,
  formatTimestamp,
  isValidDecoder,
  TIMESTAMP_FORMAT,
} from "~/utils";

const Blob: NextPage = function () {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const id = (router?.query.hash as string | undefined) ?? "0";
  const positionTxHash = router?.query.tx as string | undefined;
  const positionIndex =
    typeof router?.query.index === "string"
      ? Number(router.query.index)
      : undefined;
  const {
    data: blob,
    dataUpdatedAt: blobUpdatedAt,
    isFetching: blobFetching,
    error,
  } = api.blob.getByBlobId.useQuery(
    {
      id: id,
      expand: BLOB_EXPAND,
    },
    {
      enabled: router?.isReady,
      staleTime: BLOB_STALE_TIME,
      retry: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  // A blob can be in more than one transaction, and more than one time in the
  // same transaction. Thus the navigation uses the position in the URL. If the
  // URL has no position, the navigation uses the first position in the list of
  // the blob. The list starts with the newest block.
  const position = useMemo(() => {
    const blobOnTx =
      blob?.transactions.find(
        ({ txHash, index }) =>
          txHash === positionTxHash && index === positionIndex
      ) ?? blob?.transactions[0];

    return typeof blobOnTx?.index === "number"
      ? { txHash: blobOnTx.txHash, index: blobOnTx.index }
      : undefined;
  }, [blob, positionTxHash, positionIndex]);
  const {
    prevBlob,
    nextBlob,
    loading: adjacentBlobLoading,
    error: adjacentBlobError,
    navigate: handleNavClick,
  } = useAdjacentBlobNavigation({ blob, blobUpdatedAt, position });
  const { data: blobData, error: blobDataError } = useQuery({
    queryKey: ["blob-data", id],
    queryFn: async () => {
      if (!blob || !blob.dataStorageReferences.length) {
        return null;
      }

      for (const { storage, url } of blob.dataStorageReferences) {
        if (!url) {
          continue;
        }

        try {
          const response = await fetch(
            `/api/blob-data?storage=${storage}&url=${encodeURIComponent(url)}`
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
            `Failed to fetch data of blob "${id}" from storage ${storage}:`,
            err
          );

          continue;
        }
      }

      throw new Error(`Failed to fetch data of blob "${id}" from any storage`);
    },
    // A cached blob can have expired signed URLs. When the page gets the blob
    // again, wait for the new URLs before the page gets the blob data.
    enabled: !!blob && !blobFetching,
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
  const blobViewModesOptions: SelectOption<BlobViewMode>[] = blobViewModes.map(
    (blobViewMode) => ({ value: blobViewMode })
  );

  useEffect(() => {
    if (!decoder) {
      setSelectedBlobViewMode((mode) => (mode === "Decoded" ? "Raw" : mode));

      return;
    }

    setSelectedBlobViewMode("Decoded");
  }, [decoder]);

  if (error) {
    const idType = versionedHashSchema.safeParse(id).success
      ? "versioned hash"
      : "KZG commitment";
    return (
      <ErrorPage
        error={error}
        overrides={{
          NOT_FOUND: {
            title: "Blob Not Found",
            description: `We couldn't find a blob matching this ${idType}.`,
          },
          BAD_REQUEST: {
            title: "Invalid Blob ID",
            description: `The blob ID you are looking for is invalid. Check is a correct versioned hash or KZG commitment.`,
          },
        }}
      />
    );
  }

  const detailsFields: DetailsLayoutProps["fields"] = [];

  if (blob) {
    const isUnique = blob.transactions.length === 1;

    detailsFields.push({
      name: "Versioned Hash",
      helpText:
        "The hash that identifies this blob commitment. The first byte identifies the commitment version.",
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
        helpText: "The finality status of the block that contains this item.",
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
          helpText: "The block that contains this item.",
          value: (
            <div className="flex items-center gap-2 truncate">
              <Link href={routes.block(blockNumber)}>{blockNumber}</Link>
              <CopyToClipboard
                value={blockNumber}
                tooltipText="Copy block number"
              />
            </div>
          ),
        },
        {
          name: "Transaction",
          helpText: "The transaction that includes this blob.",
          value: (
            <div className="flex items-center gap-2 truncate" title={txHash}>
              {<Link href={routes.tx(txHash)}>{txHash}</Link>}
              <CopyToClipboard value={txHash} tooltipText="Copy tx hash" />
            </div>
          ),
        },
        {
          name: "Timestamp",
          helpText: "The time of the block that contains this item.",
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
          helpText: "The rollup associated with the blob transaction.",
          value: <RollupBadge key={rollup} rollup={rollup} />,
        });
      }

      detailsFields.push({
        name: "Position In Transaction",
        helpText:
          "The position of this blob in the transaction, starting from zero.",
        value: index,
      });
    }

    detailsFields.push(
      {
        name: "Commitment",
        helpText: "The KZG cryptographic commitment to the blob data.",
        value: (
          <Copyable value={blob.commitment} tooltipText="Copy commitment" />
        ),
      },
      {
        name: "Proof",
        helpText:
          "The KZG proof used to verify that the blob data matches its commitment.",
        value: <Copyable value={blob.proof} tooltipText="Copy proof" />,
      },
      {
        name: "Size",
        helpText: "The full size of this blob, including padding bytes.",
        value: formatBytes(blob.size),
      },
      {
        name: "Usage",
        helpText:
          "The size of this blob after trailing zero bytes are removed. The percentage compares this size with the full blob size.",
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
        helpText: "The storage services that provide a copy of this blob data.",
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
                      <Link href={routes.block(blockNumber)}>
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
                      <Link href={routes.tx(txHash)}>{txHash}</Link>
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
      <SeoMetaTags
        title={`Blob ${blob?.versionedHash ?? "Details"}`}
        description={`Explore blob details${
          blob ? ` for ${blob.versionedHash}` : ""
        } on Blobscan.`}
      />
      <DetailsLayout
        header={
          <div className="flex items-center justify-start gap-4">
            <NavArrow
              type="prev"
              size="lg"
              onClick={() => handleNavClick("prev")}
              tooltip="Previous Blob from This Sender"
              disabled={!position || prevBlob === null || adjacentBlobLoading}
            />
            Blob Details
            <NavArrow
              type="next"
              size="lg"
              onClick={() => handleNavClick("next")}
              tooltip="Next Blob from This Sender"
              disabled={!position || nextBlob === null || adjacentBlobLoading}
            />
            {adjacentBlobError && (
              <span className="text-sm font-normal text-error-600 dark:text-error-300">
                Couldn&apos;t load the adjacent blob
              </span>
            )}
          </div>
        }
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
