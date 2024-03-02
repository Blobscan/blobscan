import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlockCard } from "~/components/Cards/SurfaceCards/BlockCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { formatNumber } from "~/utils";

const Blocks: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const { data, error } = api.block.getAllFull.useQuery({ p, ps });
  const { blocks, totalBlocks } = data || {};

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
      header={`Blocks ${totalBlocks ? `(${formatNumber(totalBlocks)})` : ""}`}
      items={blocks?.map((b) => (
        <BlockCard key={b.hash} block={b} />
      ))}
      totalItems={totalBlocks}
      page={p}
      pageSize={ps}
      itemSkeleton={<BlockCard />}
      emptyState="No blocks"
    />
  );
};

export default Blocks;
