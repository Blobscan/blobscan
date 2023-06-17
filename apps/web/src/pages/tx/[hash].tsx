import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { Card } from "~/components/Cards/Card";
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

  const {
    data: txData,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery({ hash }, { enabled: router.isReady });

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!isLoading && !txData) {
    return <div>Transaction not found</div>;
  }

  const sortedBlobs = txData?.blobs.sort((a, b) => a.index - b.index);

  return (
    <>
      <DetailsLayout
        header="Transaction Details"
        externalLink={
          txData ? buildTransactionExternalUrl(txData.hash) : undefined
        }
        fields={
          txData
            ? [
                { name: "Hash", value: txData.hash },
                {
                  name: "Block",
                  value: (
                    <Link href={buildBlockRoute(txData.blockNumber)}>
                      {txData.blockNumber}
                    </Link>
                  ),
                },
                {
                  name: "Timestamp",
                  value: (
                    <div className="whitespace-break-spaces">
                      {formatTimestamp(txData.timestamp)}
                    </div>
                  ),
                },
                {
                  name: "From",
                  value: (
                    <Link href={buildAddressRoute(txData.from)}>
                      {txData.from}
                    </Link>
                  ),
                },
                ...(txData.to
                  ? [
                      {
                        name: "To",
                        value: (
                          <Link href={buildAddressRoute(txData.to)}>
                            {txData.to}
                          </Link>
                        ),
                      },
                    ]
                  : []),
              ]
            : undefined
        }
      />

      <Card header={`Blobs ${txData ? `(${txData.blobs.length})` : ""}`}>
        <div className="space-y-6">
          {isLoading || !txData || !sortedBlobs
            ? Array.from({ length: 2 }).map((_, i) => <BlobCard key={i} />)
            : sortedBlobs.map((b) => (
                <BlobCard key={b.versionedHash} blob={b} txHash={txData.hash} />
              ))}
        </div>
      </Card>
    </>
  );
};

export default Tx;
