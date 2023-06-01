import { useMemo, useState } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";
import { utils } from "ethers";

import { api } from "~/utils/api";
import {
  SectionCard,
  SectionCardSkeleton,
} from "~/components/Cards/SectionCard";
import { DetailsLayout } from "~/components/DetailsLayout";
import { Dropdown } from "~/components/Dropdown";
import { ExpandableContent } from "~/components/ExpandableContent";
import { InfoGrid } from "~/components/InfoGrid";
import { Link } from "~/components/Link";
import {
  buildBlockRoute,
  buildTransactionRoute,
  formatTimestamp,
} from "~/utils";

type BlobViewMode = "Original" | "UTF-8";

const BLOB_VIEW_MODES: BlobViewMode[] = ["Original", "UTF-8"];

function formatBlob(blob: string, viewMode: BlobViewMode): string {
  switch (viewMode) {
    case "Original":
      return blob;
    case "UTF-8":
      return utils.toUtf8String(blob).replace(/\0/g, "");
    default:
      return blob;
  }
}

const Blob: NextPage = () => {
  const router = useRouter();
  const index = (router.query.index as string | undefined) ?? "0";
  const txHash = (router.query.hash as string | undefined) ?? "";
  const blobQuery = api.blob.getByIndex.useQuery(
    {
      index: parseInt(index),
      txHash,
    },
    {
      enabled: router.isReady,
    },
  );
  const [selectedBlobViewMode, setSelectedBlobViewMode] =
    useState<BlobViewMode>("Original");
  const [formattedData, formattedDataErr] = useMemo(() => {
    const blobData = blobQuery?.data?.data;
    if (!blobData) {
      return [""];
    }

    try {
      return [formatBlob(blobData, selectedBlobViewMode)];
    } catch (err) {
      return [, "Couldn't format blob data"];
    }
  }, [blobQuery?.data?.data, selectedBlobViewMode]);

  if (blobQuery.error) {
    return (
      <NextError
        title={blobQuery.error.message}
        statusCode={blobQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blobQuery.status !== "success") {
    return <SectionCardSkeleton />;
  }

  if (!blobQuery.data) {
    return <>Blob not found</>;
  }

  const { data: blob } = blobQuery;

  return (
    <>
      <DetailsLayout title="Blob Details">
        <InfoGrid
          fields={[
            { name: "Index", value: blob.index },
            { name: "Versioned Hash", value: blob.versionedHash },
            {
              name: "Block",
              value: (
                <Link href={buildBlockRoute(blob.blockNumber)}>
                  {blob.blockNumber}
                </Link>
              ),
            },
            {
              name: "Transaction",
              value: (
                <Link href={buildTransactionRoute(blob.txHash)}>
                  {blob.txHash}
                </Link>
              ),
            },
            {
              name: "Timestamp",
              value: (
                <div className="whitespace-break-spaces">
                  {formatTimestamp(blob.timestamp)}
                </div>
              ),
            },
            { name: "Commitment", value: blob.commitment },
          ]}
        />
      </DetailsLayout>

      <SectionCard
        header={
          <div className="flex items-center justify-between">
            Data
            <div className="flex items-center gap-2">
              <div className="text-sm font-normal text-contentSecondary-light dark:text-contentSecondary-dark">
                View as:
              </div>
              <Dropdown
                items={BLOB_VIEW_MODES}
                selected={selectedBlobViewMode}
                onChange={(newViewMode) =>
                  setSelectedBlobViewMode(newViewMode as BlobViewMode)
                }
              />
            </div>
          </div>
        }
      >
        <div className="break-words rounded-xl border border-border-light p-3 text-left leading-7  dark:border-border-dark">
          {formattedDataErr ? (
            <span className="text-error-400">
              Couldn&rsquo;t format blob data.
            </span>
          ) : (
            <ExpandableContent>{formattedData}</ExpandableContent>
          )}
        </div>
      </SectionCard>
    </>
  );
};

export default Blob;
