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
import { Copyable, CopyToClipboard } from "~/components/CopyToClipboard";
import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps } from "~/components/Dropdown";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrows } from "~/components/NavArrows";
import { BlockStatus } from "~/components/Status";
import { api } from "~/api-client";
import Loading from "~/icons/loading.svg";
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
  const blobViewModesOptions: DropdownProps["options"] = blobViewModes.map(
    (blobViewMode) => ({ value: blobViewMode })
  );

  const { data: neighbors } = api.blob.getBlobNeighbours.useQuery(
    blob &&
      blob.transactions[0] &&
      blob.transactions[0].from &&
      blob.transactions[0].index !== undefined
      ? {
          txHash: blob.transactions[0].hash,
          commitment: blob.commitment,
          transactionIndex: blob.transactions[0].index,
          senderAddress: blob.transactions[0].from,
          blockNumber: blob.transactions[0].blockNumber,
        }
      : {
          txHash: "",
          commitment: "",
          transactionIndex: 0,
          senderAddress: "",
          blockNumber: 0,
        },
    {
      enabled: Boolean(router.isReady && blob && blob.transactions[0]),
    }
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
      value: <Copyable value={blob.versionedHash} />,
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
        value: <Copyable value={blob.commitment} label="Copy commitment" />,
      },
      {
        name: "Proof",
        value: <Copyable value={blob.proof} label="Copy proof" />,
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
        <div className="grid w-full grid-cols-3 gap-x-6 gap-y-3">
          {blob.transactions.map(({ hash: txHash, blockNumber }) => (
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
                  <CopyToClipboard value={txHash} label="Copy tx hash" />
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
        header={
          <div className="flex items-center justify-start gap-4">
            Blob Details
            {neighbors ? (
              <NavArrows
                prev={{
                  href: neighbors?.prev ? `/blob/${neighbors.prev}` : undefined,
                  tooltip: "Previous blob from this sender",
                }}
                next={{
                  href: neighbors?.next ? `/blob/${neighbors.next}` : undefined,
                  tooltip: "Next blob from this sender",
                }}
              />
            ) : (
              <Loading className="h-5 w-5 animate-spin" />
            )}
          </div>
        }
        fields={blob ? detailsFields : undefined}
      />
      <Card
        header={
          <div className="flex items-center justify-between">
            <div>Blob Data</div>
            {blob && (
              <div className="flex items-center gap-4">
                <CopyToClipboard label="Copy blob data" value={blob.data} />
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
