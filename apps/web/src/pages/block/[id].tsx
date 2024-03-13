import { useMemo } from "react";
import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";
import type { NextRouter } from "next/router";

import { Card } from "~/components/Cards/Card";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import {
  BLOB_GAS_LIMIT_PER_BLOCK,
  buildBlockExternalUrl,
  buildSlotExternalUrl,
  formatBytes,
  formatNumber,
  formatTimestamp,
  GAS_PER_BLOB,
  MAX_BLOBS_PER_BLOCK,
  performDiv,
  pluralize,
} from "~/utils";

function performBlockQuery(router: NextRouter) {
  const isReady = router.isReady;
  const blockNumberOrHash = router.query.id as string | undefined;

  return api.block.getByBlockIdFull.useQuery(
    { id: blockNumberOrHash ?? "" },
    { enabled: isReady }
  );
}

const Block: NextPage = function () {
  const router = useRouter();
  const { data: blockData_, error, isLoading } = performBlockQuery(router);
  const blockData = useMemo(
    () =>
      blockData_
        ? {
            ...blockData_,
            blobGasAsCalldataUsed: BigInt(blockData_.blobGasAsCalldataUsed),
            blobGasUsed: BigInt(blockData_.blobGasUsed),
            blobGasPrice: BigInt(blockData_.blobGasPrice),
            excessBlobGas: BigInt(blockData_.excessBlobGas),
          }
        : undefined,
    [blockData_]
  );

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!isLoading && !blockData) {
    return <div>Block not found</div>;
  }

  return (
    <>
      <DetailsLayout
        header="Block Details"
        externalLink={
          blockData ? buildBlockExternalUrl(blockData.number) : undefined
        }
        fields={
          blockData
            ? [
                { name: "Block Height", value: blockData.number },
                { name: "Hash", value: blockData.hash },
                {
                  name: "Timestamp",
                  value: (
                    <div className="whitespace-break-spaces">
                      {formatTimestamp(blockData.timestamp)}
                    </div>
                  ),
                },
                {
                  name: "Slot",
                  value: (
                    <Link
                      href={buildSlotExternalUrl(blockData.slot)}
                      isExternal
                    >
                      {blockData.slot}
                    </Link>
                  ),
                },
                {
                  name: "Blob Size",
                  value: (
                    <div>
                      {formatBytes(blockData.totalBlobSize)}
                      <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
                        ({formatNumber(blockData.totalBlobSize / GAS_PER_BLOB)}{" "}
                        {pluralize(
                          "blob",
                          blockData.totalBlobSize / GAS_PER_BLOB
                        )}
                        )
                      </span>
                    </div>
                  ),
                },
                {
                  name: "Blob Gas Price",
                  value: <EtherUnitDisplay amount={blockData.blobGasPrice} />,
                },
                {
                  name: "Blob Gas Used",
                  value: (
                    <BlobGasUsageDisplay blobGasUsed={blockData.blobGasUsed} />
                  ),
                },
                {
                  name: "Blob Gas Limit",
                  value: (
                    <div>
                      {formatNumber(BLOB_GAS_LIMIT_PER_BLOCK)}
                      <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
                        ({formatNumber(MAX_BLOBS_PER_BLOCK)}{" "}
                        {pluralize("blob", MAX_BLOBS_PER_BLOCK)} per block)
                      </span>
                    </div>
                  ),
                },
                {
                  name: "Blob As Calldata Gas",
                  value: (
                    <div>
                      {formatNumber(blockData.blobGasAsCalldataUsed)}
                      <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
                        (
                        <strong>
                          {formatNumber(
                            performDiv(
                              blockData.blobGasAsCalldataUsed,
                              blockData.blobGasUsed
                            ),
                            "standard",
                            { maximumFractionDigits: 2 }
                          )}
                        </strong>{" "}
                        times more expensive)
                      </span>
                    </div>
                  ),
                },
              ]
            : undefined
        }
      />

      <Card
        header={`Blob Transactions ${
          blockData ? `(${blockData.transactions.length})` : ""
        }`}
      >
        <div className="space-y-6">
          {isLoading || !blockData
            ? Array.from({ length: 3 }).map((_, i) => (
                <BlobTransactionCard key={i} />
              ))
            : blockData.transactions.map((t) => (
                <BlobTransactionCard key={t.hash} transaction={t} />
              ))}
        </div>
      </Card>
    </>
  );
};

export default Block;
