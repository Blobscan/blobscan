import { useMemo, useState } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";
import Skeleton from "react-loading-skeleton";

import "react-loading-skeleton/dist/skeleton.css";
import { Card } from "~/components/Cards/Card";
import { SurfaceCardBase } from "~/components/Cards/SurfaceCards/SurfaceCardBase";
import { Dropdown } from "~/components/Dropdown";
import { ExpandableContent } from "~/components/ExpandableContent";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import { buildTransactionRoute, formatBytes, hexStringToUtf8 } from "~/utils";

type BlobViewMode = "Original" | "UTF-8";

const BLOB_VIEW_MODES: BlobViewMode[] = ["Original", "UTF-8"];

function formatBlob(blob: string, viewMode: BlobViewMode): string {
  switch (viewMode) {
    case "Original":
      return blob;
    case "UTF-8":
      return hexStringToUtf8(blob);
    default:
      return blob;
  }
}

const Blob: NextPage = function () {
  const router = useRouter();
  const versionedHash = (router.query.hash as string | undefined) ?? "0";
  const {
    data: blob,
    error,
    isLoading,
  } = api.blob.getByBlobIdFull.useQuery(
    {
      id: versionedHash,
    },
    {
      enabled: router.isReady,
    }
  );
  const [selectedBlobViewMode, setSelectedBlobViewMode] =
    useState<BlobViewMode>("Original");
  const [formattedData, formattedDataErr] = useMemo(() => {
    const data = blob?.data;
    if (!data) {
      return [""];
    }

    try {
      return [formatBlob(data, selectedBlobViewMode)];
    } catch (err) {
      // eslint-disable-next-line no-sparse-arrays
      return [, "Couldn't format blob data"];
    }
  }, [blob?.data, selectedBlobViewMode]);

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

  const swarmHash = blob?.dataStorageReferences.find(
    (ref) => ref.blobStorage === "SWARM"
  )?.dataReference;

  const detailsFields: DetailsLayoutProps["fields"] = [];

  if (blob) {
    detailsFields.push(
      { name: "Versioned Hash", value: blob.versionedHash },
      { name: "Commitment", value: blob.commitment }
    );

    if (blob.proof) {
      detailsFields.push({
        name: "Proof",
        value: blob.proof,
      });
    }

    detailsFields.push({ name: "Size", value: formatBytes(blob.size) });

    if (swarmHash) {
      detailsFields.push({
        name: "Swarm Hash",
        value: swarmHash,
      });
    }

    detailsFields.push({
      name: "Transactions",
      value: (
        <div className="flex items-center gap-2">
          {blob.transactions.map(({ txHash }) => (
            <Link key={txHash} href={buildTransactionRoute(txHash)}>
              {txHash.slice(0, 20)}...
            </Link>
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
