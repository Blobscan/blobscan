import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter, type NextRouter } from "next/router";

import { api } from "~/utils/api";
import { BlobTransactionCard } from "~/components/Cards/BlobTransactionCard";
import {
  SectionCard,
  SectionCardSkeleton,
} from "~/components/Cards/SectionCard";
import { DetailsLayout } from "~/components/DetailsLayout";
import { InfoGrid } from "~/components/InfoGrid";
import { Link } from "~/components/Link";
import {
  buildBlockExternalUrl,
  buildSlotExternalUrl,
  formatTimestamp,
} from "~/utils";

function performBlockQuery(router: NextRouter) {
  const isReady = router.isReady;
  const blockNumberOrHash = router.query.id as string | undefined;
  const blockNumber = Number(blockNumberOrHash);

  if (!Number.isNaN(blockNumber)) {
    return api.block.getByBlockNumber.useQuery({ number: blockNumber });
  }

  return api.block.getByHash.useQuery(
    { hash: blockNumberOrHash ?? "" },
    { enabled: isReady },
  );
}

const Block: NextPage = function () {
  const router = useRouter();
  const blockQuery = performBlockQuery(router);

  if (blockQuery?.error) {
    return (
      <NextError
        title={blockQuery.error.message}
        statusCode={blockQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blockQuery.status !== "success") {
    return <SectionCardSkeleton header="Block Details" />;
  }

  if (!blockQuery.data) {
    return <div>Block not found</div>;
  }

  const block = blockQuery.data;

  return (
    <>
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
              value: (
                <div className="whitespace-break-spaces">
                  {formatTimestamp(block.timestamp)}
                </div>
              ),
            },
            {
              name: "Slot",
              value: (
                <Link href={buildSlotExternalUrl(block.slot)} isExternal>
                  {block.slot}
                </Link>
              ),
            },
          ]}
        />
      </DetailsLayout>
      <SectionCard
        header={<div>Blob Transactions ({block.transactions.length})</div>}
      >
        <div className="space-y-6">
          {block.transactions.map((t) => (
            <BlobTransactionCard key={t.hash} transaction={t} />
          ))}
        </div>
      </SectionCard>
    </>
  );
};

export default Block;
