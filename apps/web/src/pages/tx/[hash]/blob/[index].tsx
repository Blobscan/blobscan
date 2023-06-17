import { useMemo, useState } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";
import { utils } from "ethers";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { api } from "~/utils/api";
import { Card } from "~/components/Cards/Card";
import { SurfaceCardBase } from "~/components/Cards/SurfaceCards/SurfaceCardBase";
import { Dropdown } from "~/components/Dropdown";
import { ExpandableContent } from "~/components/ExpandableContent";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
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
  const {
    data: blobData,
    error,
    isLoading,
  } = api.blob.getByIndex.useQuery(
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
    const data = blobData?.data;
    if (!data) {
      return [""];
    }

    try {
      return [formatBlob(data, selectedBlobViewMode)];
    } catch (err) {
      return [, "Couldn't format blob data"];
    }
  }, [blobData?.data, selectedBlobViewMode]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!blobData) {
    return <>Blob not found</>;
  }

  return (
    <>
      <DetailsLayout
        header="Blob Details"
        fields={
          blobData
            ? [
                { name: "Index", value: blobData.index },
                { name: "Versioned Hash", value: blobData.versionedHash },
                {
                  name: "Block",
                  value: (
                    <Link href={buildBlockRoute(blobData.blockNumber)}>
                      {blobData.blockNumber}
                    </Link>
                  ),
                },
                {
                  name: "Transaction",
                  value: (
                    <Link href={buildTransactionRoute(blobData.txHash)}>
                      {blobData.txHash}
                    </Link>
                  ),
                },
                {
                  name: "Timestamp",
                  value: (
                    <div className="whitespace-break-spaces">
                      {formatTimestamp(blobData.timestamp)}
                    </div>
                  ),
                },
                { name: "Commitment", value: blobData.commitment },
              ]
            : undefined
        }
      />

      <Card
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
        <SurfaceCardBase truncateText={false}>
          {isLoading ? (
            <Skeleton count={10} />
          ) : (
            <div className="t break-words p-3 text-left text-sm leading-7">
              {formattedDataErr ? (
                <span className="text-error-400">
                  Couldn&rsquo;t format blob data.
                </span>
              ) : (
                <ExpandableContent>{formattedData}</ExpandableContent>
              )}
            </div>
          )}
        </SurfaceCardBase>
      </Card>
    </>
  );
};

export default Blob;
