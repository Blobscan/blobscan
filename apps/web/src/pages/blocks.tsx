import { type NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { BlockCard } from "~/components/Cards/SurfaceCards/BlockCard";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";

const Blocks: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const { error, data } = api.block.getAll.useQuery({ p, ps });

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  const { blocks, totalBlocks } = data ?? {};

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
