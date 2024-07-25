import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { PaginatedTable } from "~/components/PaginatedTable/PaginatedTable";
import {
  getBlocksTableRows,
  blocksTableHeaders,
} from "~/components/PaginatedTable/helpers";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { deserializeBlock, formatNumber } from "~/utils";

const Blocks: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const {
    data: rawBlocksData,
    isLoading,
    error,
  } = api.block.getAll.useQuery({ p, ps });
  const blocksData = useMemo(() => {
    if (!rawBlocksData) {
      return {};
    }

    return {
      totalBlocks: rawBlocksData.totalBlocks,
      blocks: rawBlocksData.blocks.map(deserializeBlock),
    };
  }, [rawBlocksData]);
  const { blocks, totalBlocks } = blocksData;

  const blobRows = useMemo(() => getBlocksTableRows(blocks), [blocks]);

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
      title={`Blocks ${totalBlocks ? `(${formatNumber(totalBlocks)})` : ""}`}
      isLoading={isLoading}
      headers={blocksTableHeaders}
      rows={blobRows}
      totalItems={totalBlocks || 0}
      paginationData={{ pageSize: ps, page: p }}
    />
  );
};

export default Blocks;
