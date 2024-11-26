import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { Card } from "~/components/Cards/Card";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { CopyToClipboard } from "~/components/CopyToClipboard";
import { Copyable } from "~/components/Copyable";
import { StandardEtherUnitDisplay } from "~/components/Displays/StandardEtherUnitDisplay";
import { InfoGrid } from "~/components/InfoGrid";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrows } from "~/components/NavArrows";
import { BlockStatus } from "~/components/Status";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionExternalUrl,
  formatTimestamp,
  formatBytes,
  formatNumber,
  performDiv,
  deserializeFullTransaction,
} from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const hash = (router.query.hash as string | undefined) ?? "";

  const {
    data: rawTxData,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery<TransactionWithExpandedBlockAndBlob>(
    { hash, expand: "block,blob" },
    { enabled: router.isReady }
  );
  const tx = useMemo(() => {
    if (!rawTxData) {
      return;
    }

    return deserializeFullTransaction(rawTxData);
  }, [rawTxData]);

  const { data: neighbors } = api.tx.getTxNeighbors.useQuery(
    tx
      ? {
          senderAddress: tx.from,
          blockNumber: tx.blockNumber,
          index: tx.index,
        }
      : {
          senderAddress: "",
          blockNumber: 0,
          index: 0,
        },
    {
      enabled: Boolean(tx),
    }
  );

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  if (!isLoading && !tx) {
    return <div>Transaction not found</div>;
  }

  let detailsFields: DetailsLayoutProps["fields"] | undefined;

  if (tx) {
    detailsFields = [];

    const {
      blobAsCalldataGasUsed,
      blobs,
      block,
      hash,
      blockNumber,
      blockTimestamp,
      from,
      to,
      rollup,
      blobGasUsed,
      blobGasBaseFee,
      blobGasMaxFee,
      blobAsCalldataGasFee,
    } = tx;

    detailsFields = [
      {
        name: "Hash",
        value: <Copyable value={hash} tooltipText="Copy Hash" />,
      },
      { name: "Status", value: <BlockStatus blockNumber={blockNumber} /> },
      {
        name: "Block",
        value: <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>,
      },
      {
        name: "Timestamp",
        value: (
          <div className="whitespace-break-spaces">
            {formatTimestamp(blockTimestamp)}
          </div>
        ),
      },
      {
        name: "Position In Block",
        value: tx.index,
      },
      {
        name: "From",
        value: (
          <Link href={buildAddressRoute(from)}>
            <Copyable value={from} tooltipText="Copy from address" />
          </Link>
        ),
      },
      {
        name: "To",
        value: (
          <Link href={buildAddressRoute(to)}>
            <Copyable value={to} tooltipText="Copy to address" />
          </Link>
        ),
      },
    ];

    if (rollup) {
      detailsFields.push({
        name: "Rollup",
        value: <RollupBadge rollup={rollup} />,
      });
    }

    const totalBlobSize = blobs.reduce((acc, b) => acc + b.size, 0);

    detailsFields.push(
      {
        name: "Total Blob Size",
        value: formatBytes(totalBlobSize),
      },
      {
        name: "Blob Gas Price",
        value: <StandardEtherUnitDisplay amount={block.blobGasPrice} />,
      },
      {
        name: "Blob Fee",
        value: (
          <div className="flex flex-col gap-4">
            {blobGasBaseFee ? (
              <div className="flex gap-1">
                <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                  Base:
                </div>
                <StandardEtherUnitDisplay amount={blobGasBaseFee} />
              </div>
            ) : null}
            <div className=" flex gap-1">
              <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Max:
              </div>
              <StandardEtherUnitDisplay amount={blobGasMaxFee} />
            </div>
          </div>
        ),
      },
      {
        name: "Blob Gas Used",
        value: formatNumber(blobGasUsed),
      },
      {
        name: "Blob As Calldata Gas Used",
        value: (
          <div>
            {formatNumber(blobAsCalldataGasUsed)}{" "}
            <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
              |{" "}
              <strong>
                {formatNumber(
                  performDiv(blobAsCalldataGasUsed, blobGasUsed),
                  "compact",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>{" "}
              times larger
            </span>
          </div>
        ),
      },
      {
        name: "Blob As Calldata Gas Fee",
        value: (
          <div className="display flex gap-1">
            {<StandardEtherUnitDisplay amount={blobAsCalldataGasFee} />}
            <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
              |{" "}
              <strong>
                {formatNumber(
                  performDiv(blobAsCalldataGasFee, blobGasBaseFee),
                  "compact",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>{" "}
              times more expensive
            </span>
          </div>
        ),
      }
    );
  }

  const decodedData =
    rawTxData?.decodedFields?.type === "optimism"
      ? rawTxData.decodedFields.payload
      : undefined;

  return (
    <>
      <DetailsLayout
        header={
          <div className="flex items-center justify-start gap-4">
            Transaction Details
            <NavArrows
              prev={{
                href: neighbors?.prev ? `/tx/${neighbors.prev}` : undefined,
                tooltip: "Previous transaction from this sender",
              }}
              next={{
                href: neighbors?.next ? `/tx/${neighbors.next}` : undefined,
                tooltip: "Next transaction from this sender",
              }}
            />
          </div>
        }
        externalLink={tx ? buildTransactionExternalUrl(tx.hash) : undefined}
        fields={detailsFields}
      />

      {decodedData && (
        <Card header="Decoded Fields">
          <div>
            <InfoGrid
              fields={[
                {
                  name: "Timestamp since L2 genesis",
                  value: (
                    <div className="whitespace-break-spaces">
                      {tx
                        ? formatTimestamp(
                            tx.blockTimestamp.subtract(
                              decodedData.timestampSinceL2Genesis,
                              "ms"
                            )
                          )
                        : ""}
                    </div>
                  ),
                },
                {
                  name: "Last L1 origin number",
                  value: decodedData.lastL1OriginNumber,
                },
                {
                  name: "Parent L2 block hash",
                  value: (
                    <div className="flex items-center gap-2">
                      {"0x" + decodedData.parentL2BlockHash + "..."}
                    </div>
                  ),
                },
                {
                  name: "L1 origin block hash",
                  value: (
                    <div className="flex items-center gap-2">
                      <Link
                        href={
                          "https://etherscan.io/block/" +
                          "0x" +
                          decodedData.l1OriginBlockHash
                        }
                      >
                        {"0x" + decodedData.l1OriginBlockHash}
                      </Link>
                      <CopyToClipboard
                        value={"0x" + decodedData.l1OriginBlockHash}
                        label="Copy L1 origin block hash"
                      />
                    </div>
                  ),
                },
                {
                  name: "Number of L2 blocks",
                  value: decodedData.numberOfL2Blocks,
                },
                {
                  name: "Changed by L1 origin",
                  value: decodedData.changedByL1Origin,
                },
                {
                  name: "Total transactions",
                  value: decodedData.totalTxs,
                },
                {
                  name: "Contract creation transactions",
                  value: decodedData.contractCreationTxsNumber,
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Card header={`Blobs ${tx ? `(${tx.blobs.length})` : ""}`}>
        <div className="space-y-6">
          {isLoading || !tx || !tx.blobs
            ? Array.from({ length: 2 }).map((_, i) => <BlobCard key={i} />)
            : tx.blobs.map((b) => <BlobCard key={b.versionedHash} blob={b} />)}
        </div>
      </Card>
    </>
  );
};

export default Tx;
