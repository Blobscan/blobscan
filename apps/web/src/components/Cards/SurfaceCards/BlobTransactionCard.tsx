import React, { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { animated, useSpring } from "@react-spring/web";

import { Button } from "~/components/Button";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { RollupIcon } from "~/components/RollupIcon";
import { Skeleton } from "~/components/Skeleton";
import {
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  shortenAddress,
} from "~/utils";
import type { DeserializedFullTransaction } from "~/utils";
import { RollupBadge } from "../../Badges/RollupBadge";
import { Link } from "../../Link";
import { SurfaceCardBase } from "./SurfaceCardBase";

const CollapseIcon: React.FC<{
  opened: boolean;
  onClick(): void;
}> = function ({ onClick, opened }) {
  const props = useSpring({
    from: { rotate: 0 },
    to: { rotate: Number(opened) * 180 },
  });

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="-p cursor-pointer" onClick={onClick}>
      <animated.div style={props} className="-mb-2">
        <Button variant="icon" icon={<ChevronDownIcon />} size="md" />
      </animated.div>
    </div>
  );
};

type BlobTransactionCardProps = Partial<{
  transaction: Partial<
    Pick<
      DeserializedFullTransaction,
      | "hash"
      | "from"
      | "to"
      | "rollup"
      | "blockNumber"
      | "blobGasBaseFee"
      | "blobGasMaxFee"
    >
  > & { blobsLength?: number };
  block: Partial<Pick<DeserializedFullTransaction["block"], "timestamp">>;
  blobs: Pick<
    DeserializedFullTransaction["blobs"][number],
    "versionedHash" | "index" | "size"
  >[];
  compact?: boolean;
}>;

const TableCol: FC<{ children: React.ReactNode }> = function ({ children }) {
  return (
    <div className="truncate text-surfaceContentSecondary-light dark:text-contentSecondary-dark">
      {children}
    </div>
  );
};

const TableHeader: FC<{ children: React.ReactNode }> = function ({ children }) {
  return <div className="truncate text-xs font-semibold">{children}</div>;
};

const BlobTransactionCard: FC<BlobTransactionCardProps> = function ({
  block: { timestamp } = {},
  transaction: {
    hash,
    from,
    to,
    rollup,
    blockNumber,
    blobGasBaseFee,
    blobGasMaxFee,
  } = {},
  blobs: blobsOnTx,
  compact = false,
}) {
  const [opened, setOpened] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentHeight = useRef<number>(0);
  const props = useSpring({
    from: { openProgress: 0 },
    to: { openProgress: Number(opened) },
  });

  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      contentHeight.current = contentRef.current.clientHeight;
    }
  }, []);

  const handleContentRef = useCallback(
    (element: HTMLDivElement) => {
      contentRef.current = element;
      updateHeight();
    },
    [updateHeight]
  );

  useEffect(updateHeight, [opened, updateHeight]);

  const totalBlobSize = blobsOnTx?.reduce((acc, { size }) => acc + size, 0);

  return (
    <div>
      <SurfaceCardBase
        className={compact ? "rounded" : "rounded-none rounded-t-md"}
      >
        <div className="flex flex-col text-sm">
          <div className="flex gap-2 md:flex-row">
            {hash ? (
              <div className="flex w-full flex-col justify-between gap-1 md:flex-row md:items-center md:gap-0">
                <div>
                  <div>
                    <span className="text-surfaceContentSecondary-light dark:text-surfaceContentSecondary-dark">
                      Tx{" "}
                    </span>
                    <Link href={buildTransactionRoute(hash)}>
                      {compact ? shortenAddress(hash, 16) : hash}
                    </Link>
                  </div>
                </div>
                {rollup &&
                  (compact ? (
                    <RollupIcon rollup={rollup} />
                  ) : (
                    <RollupBadge rollup={rollup} size="xs" />
                  ))}
              </div>
            ) : (
              <Skeleton width={300} className="mb-1" />
            )}
          </div>
          <div className="flex w-full flex-col items-center justify-between text-xs md:flex-row">
            <div
              className={`w-full ${timestamp && blockNumber ? "w-2/3" : ""}`}
            >
              <div className="flex flex-col gap-1 truncate">
                <div className="flex flex-row items-center gap-1 text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
                  {from && to ? (
                    <>
                      <div className="flex justify-start gap-0.5">
                        <Link href={buildAddressRoute(from)}>
                          {compact ? shortenAddress(from, 8) : from}
                        </Link>
                      </div>
                      <ArrowRightIcon className="h-3 w-3" />
                      <div>
                        <div className="text-contentTertiary-light dark:text-contentTertiary-dark">
                          <Link href={buildAddressRoute(to)}>
                            {compact ? shortenAddress(to, 8) : to}
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Skeleton width={270} size="sm" />
                  )}
                </div>
                <div className="flex flex-row gap-1">
                  {blobGasBaseFee && blobGasMaxFee ? (
                    <>
                      <div className="flex flex-row gap-1">
                        <div
                          title="Blob Base Fee"
                          className="text-contentTertiary-light dark:text-contentTertiary-dark"
                        >
                          Base Fee
                        </div>
                        <div>
                          <EtherUnitDisplay
                            amount={blobGasBaseFee}
                            toUnit="Gwei"
                          />
                        </div>
                      </div>
                      <div className="flex flex-row gap-1">
                        <div
                          title="Blob Max Fee"
                          className="text-contentTertiary-light dark:text-contentTertiary-dark"
                        >
                          Max Fee
                        </div>
                        <div>
                          <EtherUnitDisplay
                            amount={blobGasMaxFee}
                            toUnit="Gwei"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <Skeleton width={300} size="xs" />
                  )}
                </div>
                <div className="flex gap-2 text-xs">
                  {blobsOnTx ? (
                    <>
                      <div>
                        {blobsOnTx.length} Blob{blobsOnTx.length > 1 ? "s" : ""}
                      </div>
                      ·
                      <div>
                        {totalBlobSize !== undefined
                          ? formatBytes(totalBlobSize)
                          : undefined}
                      </div>
                    </>
                  ) : (
                    <Skeleton width={140} size="xs" />
                  )}
                </div>
              </div>
            </div>
            {!!blockNumber && !!timestamp && (
              <div className="t mt-1 flex items-center gap-2 self-start md:flex-col md:justify-center md:gap-0">
                <div className="flex gap-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                  Block
                  <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
                </div>
                <div className="text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
                  {timestamp.fromNow()}
                </div>
              </div>
            )}
          </div>
          {!compact && blobsOnTx && (
            <div className="-mb-2 flex items-center justify-center md:-mt-5">
              <CollapseIcon
                opened={opened}
                onClick={() => {
                  setOpened((op) => !op);
                }}
              />
            </div>
          )}
        </div>
      </SurfaceCardBase>
      {!compact && blobsOnTx && (
        <div className="overflow-hidden bg-primary-200 pr-4 dark:bg-primary-900">
          <animated.div
            style={{
              height: props.openProgress.to(
                (value) => `${value * contentHeight.current}px`
              ),
            }}
          >
            <div
              ref={handleContentRef}
              className="ml-10 grid grid-cols-[1fr_6fr_2fr] gap-2 p-2 text-sm"
            >
              <TableHeader>Index</TableHeader>
              <TableHeader>Versioned Hash</TableHeader>
              <TableHeader>Size</TableHeader>
              {blobsOnTx.map(({ versionedHash, index, size }) => (
                <React.Fragment key={`${versionedHash}-${index}`}>
                  <TableCol>{index}</TableCol>
                  <TableCol>
                    <Link href={buildBlobRoute(versionedHash)}>
                      {versionedHash}
                    </Link>
                  </TableCol>
                  <TableCol>{formatBytes(size)}</TableCol>
                </React.Fragment>
              ))}
            </div>
          </animated.div>
        </div>
      )}
    </div>
  );
};

export { BlobTransactionCard };
