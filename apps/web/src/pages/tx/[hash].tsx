import { useCallback, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { BlockStatusBadge } from "~/components/Badges/BlockStatusBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { Card } from "~/components/Cards/Card";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { EtherDisplay } from "~/components/Displays/EtherDisplay";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrow } from "~/components/NavArrow";
import type { NavArrowProps } from "~/components/NavArrow";
import { OptimismCard } from "~/components/OptimismCard";
import { Separator } from "~/components/Separator";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type {
  GetAdjacentTxByAddressInput,
  TransactionWithExpandedBlockAndBlob,
} from "~/types";
import {
  buildAddressRoute,
  buildBlockRoute,
  formatTimestamp,
  formatBytes,
  formatNumber,
  performDiv,
  pluralize,
  buildTransactionRoute,
} from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const utils = api.useUtils();
  const hash = (router.query.hash as string | undefined) ?? "";
  const {
    data: tx,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery<TransactionWithExpandedBlockAndBlob>(
    { hash, expand: "block,blob" },
    { enabled: router.isReady, staleTime: Infinity }
  );
  const { data: adjacentTxs } = api.tx.getAdjacentsByAddress.useQuery(
    {
      blockTimestamp: tx?.blockTimestamp,
      senderAddress: tx?.from,
      txIndex: tx?.index,
    } as GetAdjacentTxByAddressInput,
    {
      enabled: !!tx,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }
  );
  const [adjacentTxLoading, setAdjacentTxLoading] = useState(false);

  const handleNavClick = useCallback<NavArrowProps["onClick"]>(
    async (direction) => {
      const adjacentTx =
        direction === "next"
          ? adjacentTxs?.nextTxHash
          : adjacentTxs?.prevTxHash;

      if (!adjacentTx) {
        return;
      }

      setAdjacentTxLoading(true);

      try {
        await utils.tx.getByHash.ensureData({
          hash: adjacentTx,
          expand: "block,blob",
        });

        router.push(buildTransactionRoute(adjacentTx));
      } finally {
        setAdjacentTxLoading(false);
      }
    },
    [utils, router, adjacentTxs]
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
      blobGasUsdPrice,
      blobGasUsed,
      blobGasBaseFee,
      blobGasBaseUsdFee,
      blobGasMaxFee,
      blobGasMaxUsdFee,
      blobAsCalldataGasFee,
      ethUsdPrice,
    } = tx;

    detailsFields = [
      {
        name: "Hash",
        value: <Copyable value={hash} tooltipText="Copy Hash" />,
      },
      { name: "Status", value: <BlockStatusBadge blockNumber={blockNumber} /> },
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
          <Copyable value={from} tooltipText="Copy from address">
            <Link href={buildAddressRoute(from)}>{from}</Link>
          </Copyable>
        ),
      },
      {
        name: "To",
        value: (
          <Copyable value={to} tooltipText="Copy to address">
            <Link href={buildAddressRoute(to)}>{to}</Link>
          </Copyable>
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
    const totalBlobUsageSize = blobs.reduce((acc, b) => acc + b.usageSize, 0);

    detailsFields.push(
      {
        name: "Blob Size",
        value: (
          <span>
            {formatBytes(totalBlobSize)}{" "}
            <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
              ({blobs.length} {pluralize("blob", blobs.length)})
            </span>
          </span>
        ),
      },
      {
        name: "Blob Usage",

        value: (
          <BlobUsageDisplay
            blobSize={totalBlobSize}
            blobUsage={totalBlobUsageSize}
            variant="minimal"
          />
        ),
      },

      {
        name: "Blob Gas Price",
        value: (
          <EtherDisplay
            weiAmount={block.blobGasPrice}
            usdAmount={blobGasUsdPrice}
            opts={{
              toUnit: "Gwei",
            }}
          />
        ),
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
                <EtherDisplay
                  weiAmount={blobGasBaseFee}
                  usdAmount={blobGasBaseUsdFee}
                />
              </div>
            ) : null}
            <div className=" flex gap-1">
              <div className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Max:
              </div>
              <EtherDisplay
                weiAmount={blobGasMaxFee}
                usdAmount={blobGasMaxUsdFee}
              />
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
              (
              <strong>
                {formatNumber(
                  performDiv(blobAsCalldataGasUsed, blobGasUsed),
                  "compact",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>{" "}
              times larger)
            </span>
          </div>
        ),
      },
      {
        name: "Blob As Calldata Gas Fee",
        value: (
          <div className="display flex gap-1">
            <EtherDisplay weiAmount={blobAsCalldataGasFee} />
            <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
              <Separator />
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

    if (ethUsdPrice) {
      detailsFields.push({
        name: "ETH Price",
        value: <FiatDisplay amount={ethUsdPrice} />,
      });
    }
  }

  return (
    <>
      <DetailsLayout
        header={
          <div className="flex items-center justify-start gap-4">
            <NavArrow
              type="prev"
              size="lg"
              onClick={() => handleNavClick("prev")}
              tooltip="Previous Transaction from This Sender"
              disabled={!adjacentTxs?.prevTxHash || adjacentTxLoading}
            />
            Transaction Details
            <NavArrow
              type="next"
              size="lg"
              onClick={() => handleNavClick("next")}
              tooltip="Next Transaction from This Sender"
              disabled={!adjacentTxs?.nextTxHash || adjacentTxLoading}
            />
          </div>
        }
        resource={
          tx
            ? {
                type: "tx",
                value: tx.hash,
              }
            : undefined
        }
        fields={detailsFields}
      />

      {tx?.rollup === "optimism" && !!tx.decodedFields && (
        <OptimismCard
          data={tx.decodedFields}
          txTimestamp={tx ? tx.blockTimestamp : undefined}
        />
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
