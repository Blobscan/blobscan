import { Fragment, useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import NextError from "~/pages/_error";
import "react-loading-skeleton/dist/skeleton.css";
import type { Decoder } from "@blobscan/blob-decoder";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { BlobViewer, DEFAULT_BLOB_VIEW_MODES } from "~/components/BlobViewer";
import type { BlobViewMode } from "~/components/BlobViewer";
import { Card } from "~/components/Cards/Card";
import { CopyToClipboard } from "~/components/CopyToClipboard";
import { Dropdown } from "~/components/Dropdown";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
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
    },
    {
      enabled: router.isReady,
    }
  );

  const [selectedBlobViewMode, setSelectedBlobViewMode] =
    useState<BlobViewMode>("Raw");
  const decoder = blob?.transactions.find(
    ({ rollup }) => rollup && isValidDecoder(rollup)
  )?.rollup as Decoder | undefined;
  const blobViewModes: BlobViewMode[] = [
    ...(blob && decoder ? ["Decoded" as BlobViewMode] : []),
    ...DEFAULT_BLOB_VIEW_MODES,
  ];

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
    detailsFields.push(
      {
        name: "Versioned Hash",
        value: (
          <div className="flex items-center gap-2">
            {blob.versionedHash}
            <CopyToClipboard
              value={blob.versionedHash}
              label="Copy versioned hash"
            />
          </div>
        ),
      },
      {
        name: "Commitment",
        value: (
          <div className="flex items-center gap-2">
            {blob.commitment}
            <CopyToClipboard value={blob.commitment} label="Copy commitment" />
          </div>
        ),
      },
      {
        name: "Proof",
        value: (
          <div className="flex items-center gap-2">
            {blob.proof}
            <CopyToClipboard value={blob.proof} label="Copy proof" />
          </div>
        ),
      }
    );

    detailsFields.push({ name: "Size", value: formatBytes(blob.size) });

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
        <div className="grid w-full grid-cols-3 gap-y-3 md:grid-cols-3">
          {blob.transactions.map(({ hash: txHash, blockNumber }) => (
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
            {blob && (
              <div className="flex items-center gap-2">
                <div className="text-sm font-normal text-contentSecondary-light dark:text-contentSecondary-dark">
                  View as:
                </div>
                <Dropdown
                  items={blobViewModes}
                  selected={selectedBlobViewMode}
                  onChange={(newViewMode) =>
                    setSelectedBlobViewMode(newViewMode as BlobViewMode)
                  }
                />
              </div>
            )}
          </div>
        }
      >
        <BlobViewer
          data={blob?.data}
          selectedView={selectedBlobViewMode}
          decoder={decoder}
        />
      </Card>
    </>
  );
};

export default Blob;
