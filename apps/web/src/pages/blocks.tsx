import { type NextPage } from "next";
import NextError from "next/error";

import { api } from "~/utils/api";
import { BlockCard } from "~/components/Cards/BlockCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import { PageSpinner } from "~/components/Spinners/PageSpinner";

const Blocks: NextPage = function () {
  const blocksQuery = api.block.getAll.useQuery({ limit: 100 });

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

  const blocks = blocksQuery.data;

  return (
    <SectionCard header={<div>Blocks</div>}>
      <div className="space-y-6">
        {blocks.map((b) => (
          <BlockCard key={b.hash} block={b} />
        ))}
      </div>
    </SectionCard>
  );
};

export default Blocks;
