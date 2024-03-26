import React, { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { animated, useSpring } from "@react-spring/web";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { Button } from "~/components/Button";
import {
  BLOB_SIZE,
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
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
  transaction: Pick<
    DeserializedFullTransaction,
    "hash" | "from" | "to" | "rollup" | "blockNumber"
  >;
  block: Pick<DeserializedFullTransaction["block"], "timestamp">;
  blobs: Pick<
    DeserializedFullTransaction["blobs"][number],
    "versionedHash" | "index"
  >[];
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
  transaction: { hash, from, to, rollup, blockNumber } = {},
  blobs: blobsOnTx,
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

  const totalBlobSize = (blobsOnTx?.length ?? 0) * BLOB_SIZE;

  return (
    <div>
      <SurfaceCardBase className="rounded-none rounded-t-md">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex gap-2 md:flex-row">
            {hash ? (
              <div className="flex w-full flex-col justify-between gap-1 md:flex-row md:items-center md:gap-0">
                <div className="w-2/3">
                  <span className="font-semibold text-surfaceContentSecondary-light dark:text-surfaceContentSecondary-dark">
                    Transaction{" "}
                  </span>
                  <Link href={buildTransactionRoute(hash)}>{hash}</Link>
                </div>
                {rollup && <RollupBadge rollup={rollup} size="xs" />}
              </div>
            ) : (
              <Skeleton width={400} />
            )}
          </div>
          <div className="flex w-full flex-col items-center justify-between md:flex-row">
            <div className="w-full md:w-2/3">
              <div className="flex flex-col space-y-2 truncate">
                <div className="flex flex-col gap-1 md:flex-row md:items-center">
                  {from && to ? (
                    <>
                      <div className="mt-1 md:hidden">From</div>
                      <Link href={buildAddressRoute(from)}>
                        <span className="text-xs">{from}</span>
                      </Link>
                      {to && (
                        <>
                          <ArrowRightIcon className="hidden h-4 w-4 md:block" />
                          <div className="mt-1 md:hidden">To</div>
                          <Link href={buildAddressRoute(to)}>
                            <span className="text-xs">{to}</span>
                          </Link>
                        </>
                      )}
                    </>
                  ) : (
                    <Skeleton width={320} />
                  )}
                </div>
                <div className="flex gap-2 text-xs">
                  {blobsOnTx ? (
                    <div className="mb-2">
                      {blobsOnTx.length} Blob{blobsOnTx.length > 1 ? "s" : ""}
                    </div>
                  ) : (
                    <Skeleton width={120} />
                  )}
                  ·
                  <div>
                    {blobsOnTx ? (
                      formatBytes(totalBlobSize)
                    ) : (
                      <Skeleton width={80} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {!!blockNumber && !!timestamp && (
              <div className="t flex items-center gap-2 self-start md:flex-col md:justify-center md:gap-0">
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
          {hash && (
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
      {blobsOnTx && (
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
              {blobsOnTx.map(({ versionedHash, index }) => (
                <React.Fragment key={`${versionedHash}-${index}`}>
                  <TableCol>{index}</TableCol>
                  <TableCol>
                    <Link href={buildBlobRoute(versionedHash)}>
                      {versionedHash}
                    </Link>
                  </TableCol>
                  <TableCol>{formatBytes(BLOB_SIZE)}</TableCol>
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
