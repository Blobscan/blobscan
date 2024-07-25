import { useMemo } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { PaginatedTable } from "~/components/PaginatedTable/PaginatedTable";
import {
  blobsTableHeaders,
  getBlobsTableRows,
} from "~/components/PaginatedTable/helpers";
import { api } from "~/api-client";
import { formatNumber } from "~/utils";

const Blobs: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const { data, error, isLoading } = api.blob.getAll.useQuery({ p, ps });
  const { blobs, totalBlobs } = data || {};

  const blobRows = useMemo(() => getBlobsTableRows(blobs), [blobs]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <PaginatedTable
      title={`Blobs ${totalBlobs ? `(${formatNumber(totalBlobs)})` : ""}`}
      isLoading={isLoading}
      headers={blobsTableHeaders}
      rows={blobRows}
      totalItems={totalBlobs}
      paginationData={{ pageSize: ps, page: p }}
    />
  );
};

export default Blobs;
