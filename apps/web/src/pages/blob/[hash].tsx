import { Fragment, useMemo, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import Skeleton from "react-loading-skeleton";

import NextError from "~/pages/_error";
import "react-loading-skeleton/dist/skeleton.css";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Card } from "~/components/Cards/Card";
import { SurfaceCardBase } from "~/components/Cards/SurfaceCards/SurfaceCardBase";
import { Dropdown } from "~/components/Dropdown";
import { ExpandableContent } from "~/components/ExpandableContent";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import {
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  hexStringToUtf8,
} from "~/utils";

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
  } = api.blob.getByBlobId.useQuery(
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

    if (blob.dataStorageReferences.length > 0) {
      detailsFields.push({
        name: "Storages",
        value: (
          <div className="flex items-center gap-x-2">
            {blob.dataStorageReferences.map(
              ({ blobStorage, dataReference }, index) => (
                <StorageBadge
                  key={index}
                  storage={blobStorage}
                  dataRef={dataReference}
                />
              )
            )}
          </div>
        ),
      });
    }

    detailsFields.push({
      name: "Transactions and Blocks",
      value: (
        <div className="grid w-full grid-cols-3 gap-y-3 md:grid-cols-3">
          {blob.transactions.map(
            ({ hash: txHash, block: { number: blockNumber } }) => (
              <Fragment key={`${txHash}-${blockNumber}`}>
                <div className="col-span-2 flex gap-1 md:col-span-2">
                  <div className="text-contentSecondary-light dark:text-contentSecondary-dark">
                    Tx{" "}
                  </div>
                  <Link href={buildTransactionRoute(txHash)}>{txHash}</Link>
                </div>
                <div className="flex gap-1">
                  <div className="text-contentSecondary-light dark:text-contentSecondary-dark">
                    Block{" "}
                  </div>
                  <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
                </div>
              </Fragment>
            )
          )}
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
