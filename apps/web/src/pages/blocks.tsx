import { useCallback } from "react";
import { type NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import {
  buildRouteWithPagination,
  getPaginationParams,
} from "~/utils/pagination";
import { BlockCard } from "~/components/Cards/BlockCard";
import {
  PaginatedListSection,
  type PaginatedListSectionProps,
} from "~/components/PaginatedListSection";
import { PageSpinner } from "~/components/Spinners/PageSpinner";

const Blocks: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);

  const blocksQuery = api.block.getAll.useQuery({ p, ps });

  const handlePageSelected = useCallback<
    PaginatedListSectionProps["onPageSelected"]
  >(
    (page, pageSize) => {
      void router.push(
        buildRouteWithPagination(router.pathname, page, pageSize),
      );
    },
    [router],
  );

  if (blocksQuery?.error) {
    return (
      <NextError
        title={blocksQuery.error.message}
        statusCode={blocksQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blocksQuery.status !== "success") {
    return <PageSpinner label="Loading blocks..." />;
  }

  const { blocks, totalBlocks } = blocksQuery.data;

  return (
    <PaginatedListSection
      header={<div>Blocks ({totalBlocks})</div>}
      items={blocks.map((b) => (
        <BlockCard key={b.hash} block={b} />
      ))}
      totalItems={totalBlocks}
      page={p}
      pageSize={ps}
      onPageSelected={handlePageSelected}
    />
  );
};

export default Blocks;
