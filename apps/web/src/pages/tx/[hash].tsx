import type { NextPage } from "next";
import { useRouter } from "next/router";

import { BlockStatusBadge } from "~/components/Badges/BlockStatusBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { Card } from "~/components/Cards/Card";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { Copyable } from "~/components/Copyable";
import { EtherDisplay } from "~/components/Displays/EtherDisplay";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { NavArrows } from "~/components/NavArrows";
import { OptimismCard } from "~/components/OptimismCard";
import { PercentageBar } from "~/components/PercentageBar";
import { Separator } from "~/components/Separator";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import {
  buildAddressRoute,
  buildBlockRoute,
  formatTimestamp,
  formatBytes,
  formatNumber,
  performDiv,
  pluralize,
} from "~/utils";

const Tx: NextPage = () => {
  const router = useRouter();
  const hash = (router.query.hash as string | undefined) ?? "";

  const {
    data: tx,
    error,
    isLoading,
  } = api.tx.getByHash.useQuery<TransactionWithExpandedBlockAndBlob>(
    { hash, expand: "block,blob" },
    { enabled: router.isReady }
  );

  const { data: neighbors } = api.tx.getTxNeighbors.useQuery(
    tx
      ? {
          senderAddress: tx.from,
          blockNumber: tx.blockNumber,
          index: tx.index as number,
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
    const totalBlobEffectiveSize = blobs.reduce(
      (acc, b) => acc + b.effectiveSize,
      0
    );

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
          <div className="flex flex-col">
            <span className="text-sm">
              {formatBytes(totalBlobEffectiveSize)}{" "}
            </span>
            <PercentageBar
              value={totalBlobEffectiveSize}
              total={totalBlobSize}
            />
          </div>
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
            {<EtherDisplay weiAmount={blobAsCalldataGasFee} />}
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
