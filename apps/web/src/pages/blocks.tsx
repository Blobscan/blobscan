import { type NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlockCard } from "~/components/Cards/SurfaceCards/BlockCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import { useTransformResult } from "~/hooks/useTransformResult";
import { transformBlocksResult } from "~/query-transformers";

const Blocks: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const blocksRes = api.block.getAll.useQuery({ p, ps });
  const { blocks, totalBlocks } =
    useTransformResult(blocksRes, transformBlocksResult) ?? {};
  const error = blocksRes.error;

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
      header={`Blocks ${totalBlocks ? `(${totalBlocks})` : ""}`}
      items={blocks?.map((b) => (
        <BlockCard key={b.hash} block={b} />
      ))}
      totalItems={totalBlocks}
      page={p}
      pageSize={ps}
      itemSkeleton={<BlockCard />}
    />
  );
};

export default Blocks;
