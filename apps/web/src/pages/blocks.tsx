import { type NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { getPaginationParams } from "~/utils/pagination";
import {
  BlockCard,
  BlockCardSkeleton,
} from "~/components/Cards/SurfaceCards/BlockCard";
import {
  PaginatedListLayout,
  PaginatedListLayoutSkeleton,
} from "~/components/Layouts/PaginatedListLayout";

const Blocks: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const blocksQuery = api.block.getAll.useQuery({ p, ps });

  if (blocksQuery?.error) {
    return (
      <NextError
        title={blocksQuery.error.message}
        statusCode={blocksQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blocksQuery.status !== "success") {
    return (
      <PaginatedListLayoutSkeleton
        header="Blocks ()"
        skeletonItem={<BlockCardSkeleton />}
      />
    );
  }

  const { blocks, totalBlocks } = blocksQuery.data;

  return (
    <PaginatedListLayout
      header={`Blocks (${totalBlocks})`}
      items={blocks.map((b) => (
        <BlockCard key={b.hash} block={b} />
      ))}
      totalItems={totalBlocks}
      page={p}
      pageSize={ps}
    />
  );
};

export default Blocks;
