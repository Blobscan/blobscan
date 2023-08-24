import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { useTransformResult } from "~/hooks/useTransformResult";
import { transformBlobsResult } from "~/query-transformers";
import { formatNumber } from "~/utils";

const Blobs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const blobsRes = api.blob.getAll.useQuery({ p, ps });
  const { blobs, totalBlobs } =
    useTransformResult(blobsRes, transformBlobsResult) ?? {};
  const error = blobsRes.error;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <PaginatedListLayout
      header={`Blobs ${totalBlobs ? `(${formatNumber(totalBlobs)})` : ""}`}
      items={blobs?.map((b) => (
        <BlobCard key={b.versionedHash} blob={b} />
      ))}
      totalItems={totalBlobs}
      page={p}
      pageSize={ps}
      itemSkeleton={<BlobCard />}
      emptyState="No blobs"
    />
  );
};

export default Blobs;
