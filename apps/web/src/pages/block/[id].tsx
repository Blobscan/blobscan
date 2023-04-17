import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { SectionCard } from "~/components/Cards/SectionCard";
import { TransactionCard } from "~/components/Cards/TransactionCard";
import {
  DetailsLayout,
  PageLayout,
} from "~/components/DetailsUtilityComponents";
import { InfoGrid } from "~/components/InfoGrid";
import { PageSpinner } from "~/components/Spinners/PageSpinner";
import { api } from "~/api";
import dayjs from "~/dayjs";
import { buildBlockExternalUrl } from "~/utils";

function fetchBlock(blockNumberOrHash: string) {
  const blockNumber = Number(blockNumberOrHash);

  if (!Number.isNaN(blockNumber)) {
    return api.block.getByBlockNumber.useQuery({ number: blockNumber });
  }

  return api.block.getByHash.useQuery({ hash: blockNumberOrHash });
}

const Block: NextPage = function () {
  const router = useRouter();
  const id = router.query.id as string;
  const blockQuery = fetchBlock(id);

  if (blockQuery?.error) {
    return (
      <NextError
        title={blockQuery.error.message}
        statusCode={blockQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blockQuery.status !== "success") {
    return <PageSpinner label="Loading block" />;
  }

  if (!blockQuery.data) {
    return <div>Block not found</div>;
  }

  const block = blockQuery.data;
  const unixHandler = dayjs.unix(block.timestamp);

  return (
    <PageLayout>
      <DetailsLayout
        title="Block Details"
        externalLink={buildBlockExternalUrl(block.number)}
      >
        <InfoGrid
          fields={[
            { name: "Block Height", value: block.number },
            { name: "Hash", value: block.hash },
            {
              name: "Timestamp",
              value: `${unixHandler.fromNow()} (${unixHandler.format(
                "MMM D, YYYY h:mm AZ",
              )})`,
            },
            { name: "Slot", value: block.slot },
          ]}
        />
      </DetailsLayout>
      <SectionCard
        header={<div>Blob Transactions ({block.transactions.length})</div>}
      >
        <div className="space-y-6">
          {block.transactions.map((t) => (
            <TransactionCard key={t.hash} transaction={t} />
          ))}
        </div>
      </SectionCard>
    </PageLayout>
  );
};

export default Block;
