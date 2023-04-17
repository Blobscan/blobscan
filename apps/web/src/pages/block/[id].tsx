import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { SectionCard } from "~/components/Cards/SectionCard";
import { TransactionCard } from "~/components/Cards/TransactionCard";
import { InfoGrid } from "~/components/InfoGrid";
import { Link } from "~/components/Link";
import { Spinner } from "~/components/Spinner";
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
    return (
      <div className="mt-52 flex h-48 items-center justify-center">
        <Spinner label="Loading block" />
      </div>
    );
  }

  if (!blockQuery.data) {
    return <div>Block not found</div>;
  }

  const block = blockQuery.data;
  const unixHandler = dayjs.unix(block.timestamp);

  return (
    <div className="mx-auto w-9/12 space-y-12">
      <SectionCard
        header={
          <div className="flex flex-col justify-between gap-1 md:flex-row">
            <div>Block Details</div>
            <div className="text-base">
              <Link href={buildBlockExternalUrl(block.number)} isExternal>
                View in Etherscan
              </Link>
            </div>
          </div>
        }
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
      </SectionCard>
      <SectionCard
        header={<div>Blob Transactions ({block.transactions.length})</div>}
      >
        {block.transactions.map((t) => (
          <TransactionCard key={t.hash} transaction={t} />
        ))}
      </SectionCard>
    </div>
  );
};

export default Block;
