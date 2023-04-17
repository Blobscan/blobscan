import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { BlobCard } from "~/components/Cards/BlobCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import {
  DetailsLayout,
  PageLayout,
} from "~/components/DetailsUtilityComponents";
import { InfoGrid } from "~/components/InfoGrid";
import { Link } from "~/components/Link";
import { PageSpinner } from "~/components/Spinners/PageSpinner";
import { api } from "~/api";
import { buildRoute, buildTransactionExternalUrl } from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const hash = router.query.hash as string;

  const txQuery = api.tx.getByHash.useQuery({ hash });

  if (txQuery.error) {
    return (
      <NextError
        title={txQuery.error.message}
        statusCode={txQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (txQuery.status !== "success") {
    return <PageSpinner label="Loading transaction" />;
  }

  const { data: tx } = txQuery;

  return (
    <PageLayout>
      <DetailsLayout
        title="Transaction Details"
        externalLink={buildTransactionExternalUrl(tx.hash)}
      >
        <InfoGrid
          fields={[
            { name: "Hash", value: tx.hash },
            {
              name: "Block",
              value: (
                <Link href={buildRoute("block", tx.blockNumber)}>
                  {tx.blockNumber}
                </Link>
              ),
            },
            {
              name: "Timestamp",
              value: tx.block.timestamp,
            },
            { name: "From", value: tx.from },
            { name: "To", value: tx.to },
          ]}
        />
      </DetailsLayout>
      <SectionCard header={<div>Blobs ({tx.blobs.length})</div>}>
        <div className="space-y-6">
          {tx.blobs.map((b, i) => (
            <BlobCard key={b.hash} blob={b} index={i + 1} />
          ))}
        </div>
      </SectionCard>
    </PageLayout>
  );
};

export default Tx;
