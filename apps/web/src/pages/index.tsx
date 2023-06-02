import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { Logo } from "~/components/BlobscanLogo";
import { Button } from "~/components/Button";
import {
  BlobTransactionCard,
  BlobTransactionCardSkeleton,
} from "~/components/Cards/BlobTransactionCard";
import { BlockCard, BlockCardSkeleton } from "~/components/Cards/BlockCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import { Link } from "~/components/Link";
import { SearchInput } from "~/components/SearchInput";

const TOTAL_BLOCKS = 4;
const TOTAL_TXS = 5;

const Home: NextPage = () => {
  const router = useRouter();
  const blocksQuery = api.block.getAll.useQuery({
    p: 1,
    ps: TOTAL_BLOCKS,
  });
  const txsQuery = api.tx.getAll.useQuery({ p: 1, ps: TOTAL_TXS });
  const error = blocksQuery.error || txsQuery.error;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  const { blocks } = blocksQuery.data || {};
  const { transactions: txs } = txsQuery.data || {};

  return (
    <div className="flex flex-col items-center justify-center gap-12 md:gap-24">
      <div className=" flex flex-col items-center justify-center gap-8 md:w-8/12">
        <Logo className="h-16 w-64 md:h-24 md:w-96" />
        <div className="flex flex-col items-stretch justify-center space-y-2  md:w-8/12">
          <SearchInput />
          <span className="text- text-center text-sm  text-contentSecondary-light dark:text-contentSecondary-dark">
            Blob transaction explorer for the{" "}
            <Link href="https://www.eip4844.com/" isExternal>
              EIP-4844
            </Link>
          </span>
        </div>
      </div>
      <div className="flex w-11/12 flex-col gap-8 md:gap-16">
        <SectionCard
          header={
            <div className="flex items-center justify-between">
              <div>Latest Blocks</div>{" "}
              <Button
                variant="outline"
                label="View All Blocks"
                onClick={() => void router.push("/blocks")}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-5 md:flex-row">
            {blocksQuery.isLoading
              ? Array(TOTAL_BLOCKS)
                  .fill(0)
                  .map((_, i) => (
                    <div className="flex-grow" key={i}>
                      <BlockCardSkeleton />
                    </div>
                  ))
              : blocks?.map((b) => (
                  <div className="flex-grow" key={b.hash}>
                    <BlockCard block={b} />
                  </div>
                ))}
          </div>
        </SectionCard>
        <SectionCard
          header={
            <div className="flex items-center justify-between">
              <div>Latest Blob Transactions</div>{" "}
              <Button
                variant="outline"
                label="View All Txs"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={() => router.push("/txs")}
              />
            </div>
          }
        >
          <div className=" flex flex-col gap-5">
            {txsQuery.isLoading
              ? Array(TOTAL_TXS)
                  .fill(0)
                  .map((_, i) => <BlobTransactionCardSkeleton key={i} />)
              : txs?.map((tx) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { block, blockNumber, ...filteredTx } = tx;

                  return (
                    <BlobTransactionCard
                      key={tx.hash}
                      transaction={filteredTx}
                      block={{ ...tx.block, number: blockNumber }}
                    />
                  );
                })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Home;
