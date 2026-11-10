import { useCallback, useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/compat/router";

import ErrorPage from "~/pages/_error";
import "react-loading-skeleton/dist/skeleton.css";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
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
import type { NavArrowProps } from "~/components/NavArrow";
import type { SelectOption } from "~/components/Selects";
import { Listbox } from "~/components/Selects";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { api } from "~/api-client";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { routes } from "~/routes";
import { versionedHashSchema } from "~/schemas/utils";
import type { GetAdjacentBlobInput } from "~/types";
import {
  formatBytes,
  formatTimestamp,
  isValidDecoder,
  TIMESTAMP_FORMAT,
} from "~/utils";

const BLOB_EXPAND = "transaction";
// The blob responses can have signed storage URLs that expire after one hour,
// so the page does not use a cached blob that is older than this time.
const BLOB_STALE_TIME = 5 * 60 * 1000;

function toAdjacentBlobInput(
  { txHash, index }: { txHash: string; index: number },
  direction: GetAdjacentBlobInput["direction"]
): GetAdjacentBlobInput {
  return { txHash, index, direction, expand: BLOB_EXPAND };
}

const Blob: NextPage = function () {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  const id = (router?.query.hash as string | undefined) ?? "0";
  const positionTxHash = router?.query.tx as string | undefined;
  const positionIndex =
    typeof router?.query.index === "string"
      ? Number(router.query.index)
      : undefined;
  const {
    data: blob,
    dataUpdatedAt: blobUpdatedAt,
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
      refetchOnMount: false,
    }
  );
  // A blob can be included in several transactions (or several times in the
  // same one), so the position used for navigation is taken from the URL when
  // provided, falling back to the first one returned.
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
  // The page gets an adjacent blob only when the user clicks an arrow. These
  // queries do not send a request. They only read the cache that the click
  // fills, so an arrow becomes disabled when its result is `null`.
  const cacheOnlyOptions = { enabled: false, staleTime: Infinity } as const;
  const { data: prevBlob } = api.blob.getAdjacentBlob.useQuery(
    position ? toAdjacentBlobInput(position, "prev") : skipToken,
    cacheOnlyOptions
  );
  const { data: nextBlob } = api.blob.getAdjacentBlob.useQuery(
    position ? toAdjacentBlobInput(position, "next") : skipToken,
    cacheOnlyOptions
  );
  const [adjacentBlobLoading, setAdjacentBlobLoading] = useState(false);

  const handleNavClick = useCallback<NavArrowProps["onClick"]>(
    async (direction) => {
      if (!blob || !position) {
        return;
      }

      setAdjacentBlobLoading(true);

      try {
        const adjacentInput = toAdjacentBlobInput(position, direction);
        const adjacent = await utils.blob.getAdjacentBlob.ensureData(
          adjacentInput,
          { staleTime: BLOB_STALE_TIME }
        );

        if (!adjacent) {
          return;
        }

        // Put the adjacent blob in the cache of its page, so that the page
        // does not send a second request. The cache entries keep the time of
        // the request, so that an old blob does not show as new.
        const adjacentUpdatedAt = queryClient.getQueryState(
          getQueryKey(api.blob.getAdjacentBlob, adjacentInput, "query")
        )?.dataUpdatedAt;

        utils.blob.getByBlobId.setData(
          { id: adjacent.blob.versionedHash, expand: BLOB_EXPAND },
          adjacent.blob,
          { updatedAt: adjacentUpdatedAt }
        );
        // The current blob is the adjacent blob of the new page in the
        // opposite direction.
        utils.blob.getAdjacentBlob.setData(
          toAdjacentBlobInput(adjacent, direction === "next" ? "prev" : "next"),
          { txHash: position.txHash, index: position.index, blob },
          { updatedAt: blobUpdatedAt }
        );

        await router?.push(
          routes.blob(adjacent.blob.versionedHash, {
            txHash: adjacent.txHash,
            index: adjacent.index,
          })
        );
      } finally {
        setAdjacentBlobLoading(false);
      }
    },
    [blob, blobUpdatedAt, position, queryClient, router, utils]
  );
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
          value: (
            <div className="flex items-center gap-2 truncate" title={txHash}>
              {<Link href={routes.tx(txHash)}>{txHash}</Link>}
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
              tooltip="Previous Blob in This Block"
              disabled={!position || prevBlob === null || adjacentBlobLoading}
            />
            Blob Details
            <NavArrow
              type="next"
              size="lg"
              onClick={() => handleNavClick("next")}
              tooltip="Next Blob in This Block"
              disabled={!position || nextBlob === null || adjacentBlobLoading}
            />
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
