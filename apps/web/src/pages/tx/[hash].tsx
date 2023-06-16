import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { CardBase, SectionCardSkeleton } from "~/components/Cards/CardBase";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionExternalUrl,
  formatTimestamp,
} from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const hash = (router.query.hash as string | undefined) ?? "";

  const txQuery = api.tx.getByHash.useQuery(
    { hash },
    { enabled: router.isReady },
  );

  if (txQuery.error) {
    return (
      <NextError
        title={txQuery.error.message}
        statusCode={txQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (txQuery.status !== "success") {
    return <SectionCardSkeleton header="Transaction Details" />;
  }

  const { data: tx } = txQuery;
  const sortedBlobs = tx.blobs.sort((a, b) => a.index - b.index);

  return (
    <>
      <DetailsLayout
        header="Transaction Details"
        externalLink={buildTransactionExternalUrl(tx.hash)}
        fields={[
          { name: "Hash", value: tx.hash },
          {
            name: "Block",
            value: (
              <Link href={buildBlockRoute(tx.blockNumber)}>
                {tx.blockNumber}
              </Link>
            ),
          },
          {
            name: "Timestamp",
            value: (
              <div className="whitespace-break-spaces">
                {formatTimestamp(tx.timestamp)}
              </div>
            ),
          },
          {
            name: "From",
            value: <Link href={buildAddressRoute(tx.from)}>{tx.from}</Link>,
          },
          ...(tx.to
            ? [
                {
                  name: "To",
                  value: <Link href={buildAddressRoute(tx.to)}>{tx.to}</Link>,
                },
              ]
            : []),
        ]}
      />

      <CardBase header={<div>Blobs ({tx.blobs.length})</div>}>
        <div className="space-y-6">
          {sortedBlobs.map((b) => (
            <BlobCard key={b.versionedHash} blob={b} txHash={tx.hash} />
          ))}
        </div>
      </CardBase>
    </>
  );
};

export default Tx;
