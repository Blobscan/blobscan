import React, { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowsRightLeftIcon, CubeIcon } from "@heroicons/react/24/outline";
import { useReducedMotion } from "@react-spring/web";

import BlobIcon from "~/icons/blob.svg";
import type { Rollup, SearchCategory, SearchOutput } from "~/types";
import { capitalize, toChecksumAddress } from "~/utils";
import { CountBadge } from "../Badges/CountBadge";
import { Card } from "../Cards/Card";
import { EthIdenticon } from "../EthIdenticon";
import { Icon } from "../Icon";
import { Scrollable } from "../Scrollable";
import { BlobLoader } from "./BlobLoader";
import { Result } from "./Result";
import type { ResultProps } from "./Result";
import styles from "./SearchInput.module.css";

function FadingContent({
  stateKey,
  children,
}: {
  stateKey: string;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const [displayedKey, setDisplayedKey] = useState(stateKey);
  const previousContent = useRef(children);
  const changing = displayedKey !== stateKey;

  useEffect(() => {
    if (!changing) previousContent.current = children;
  }, [changing, children]);

  useEffect(() => {
    if (!changing) return;
    const timer = setTimeout(
      () => setDisplayedKey(stateKey),
      reducedMotion ? 0 : 150
    );
    return () => clearTimeout(timer);
  }, [changing, stateKey, reducedMotion]);

  return (
    <div
      className="transition-opacity duration-150 motion-reduce:transition-none"
      style={{ opacity: changing ? 0 : 1 }}
      ref={(node) => {
        if (node) node.inert = changing;
      }}
      aria-hidden={changing || undefined}
    >
      {changing ? previousContent.current : children}
    </div>
  );
}

export type ResultsModalProps = {
  searchQuery: string;
  results: SearchOutput | null;
  isLoading?: boolean;
  open?: boolean;
  onResultClick(category: SearchCategory, id: string | number): void;
};

export function ResultsModal({ open = true, ...props }: ResultsModalProps) {
  const lastVisibleProps = useRef(props);

  useEffect(() => {
    if (open) lastVisibleProps.current = props;
  }, [open, props]);

  return <ResultsModalContent {...(open ? props : lastVisibleProps.current)} />;
}

const ResultsModalContent: React.FC<ResultsModalProps> = function ({
  searchQuery,
  results,
  isLoading = false,
  onResultClick,
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const measure = () => {
      const nextHeight = content.getBoundingClientRect().height;
      // Keep the panel height between the outgoing and incoming content.
      if (nextHeight <= 32) return;
      setHeight(nextHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const categoryResults: {
    category: SearchCategory;
    results: (ResultProps & { id: string | number })[];
  }[] = [];

  const { addresses, blobs, blocks, transactions } = results ?? {};

  if (addresses?.length) {
    categoryResults.push({
      category: "addresses",
      results: addresses.map(({ address, rollup }) => ({
        icon: <EthIdenticon address={address} size="sm" />,
        id: address,
        label: toChecksumAddress(address),
        searchQuery,
        rollup: rollup?.toLowerCase() as Rollup | undefined,
      })),
    });
  }

  if (blobs?.length) {
    categoryResults.push({
      category: "blobs",
      results: blobs.map(
        ({ commitment, proof, transactions, versionedHash }) => {
          const latestBlobOnTx = transactions ? transactions[0] : undefined;

          return {
            icon: <Icon src={BlobIcon} size="lg" />,
            id: versionedHash,
            label: versionedHash,
            searchQuery: searchQuery,
            rollup: latestBlobOnTx?.transaction.from?.rollup?.toLowerCase() as
              | Rollup
              | undefined,
            timestamp: latestBlobOnTx?.blockTimestamp,
            additionalDetails: [
              {
                label: "Commitment",
                value: commitment,
              },
              {
                label: "Proof",
                value: proof,
              },
            ],
          };
        }
      ),
    });
  }

  if (blocks?.length) {
    categoryResults.push({
      category: "blocks",
      results: blocks.map(({ hash, number, slot, timestamp, reorg }) => ({
        icon: <Icon src={CubeIcon} size="lg" />,
        id: hash,
        label: number,
        searchQuery,
        isReorg: reorg,
        additionalDetails: [
          { label: "Hash", value: hash },
          { label: "Slot", value: slot },
        ],
        timestamp,
      })),
    });
  }

  if (transactions?.length) {
    categoryResults.push({
      category: "transactions",
      results: transactions?.map(({ blockTimestamp, from, hash, reorg }) => ({
        icon: <Icon src={ArrowsRightLeftIcon} size="lg" />,
        id: hash,
        label: hash,
        searchQuery,
        isReorg: reorg,
        rollup: from.rollup?.toLowerCase() as Rollup | undefined,
        timestamp: blockTimestamp,
      })),
    });
  }

  return (
    <div
      className="overflow-hidden rounded-md border border-border-light bg-surface-light transition-[height] duration-[220ms] ease-out motion-reduce:transition-none dark:border-border-dark dark:bg-surface-dark"
      style={{ height: height === undefined ? undefined : height + 2 }}
      aria-busy={isLoading}
    >
      <Card ref={contentRef} className="px-3 py-4">
        <FadingContent
          stateKey={
            isLoading || !categoryResults.length
              ? "status"
              : `results:${searchQuery}`
          }
        >
          {isLoading || !categoryResults.length ? (
            <div
              key="status"
              className={`${styles.panelContent} flex items-center justify-center gap-3 text-sm text-contentSecondary-light dark:text-contentSecondary-dark`}
              role="status"
            >
              <BlobLoader resting={!isLoading} />
              <div className="grid">
                <span
                  className={`col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none ${
                    isLoading ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={!isLoading}
                >
                  Searching…
                </span>
                <span
                  className={`col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                  aria-hidden={isLoading}
                >
                  No Results Found
                </span>
              </div>
            </div>
          ) : (
            <div key="results" className={styles.panelContent}>
              <span className="sr-only" role="status">
                {categoryResults.reduce(
                  (count, category) => count + category.results.length,
                  0
                )}{" "}
                results found
              </span>
              <Scrollable>
                <div className="flex max-h-[350px] flex-col md:max-h-[550px]">
                  {categoryResults.map(({ category, results }) => (
                    <Fragment key={category}>
                      <div className="flex items-center gap-2 rounded-md bg-primary-200 p-2 font-semibold dark:bg-primary-900">
                        {capitalize(category)}
                        {results.length > 1 && (
                          <CountBadge count={results.length} size="sm" />
                        )}
                      </div>
                      {results.map(({ id, ...props }) => (
                        <button
                          type="button"
                          className="cursor-pointer"
                          key={id}
                          onClick={() => onResultClick(category, id)}
                        >
                          <Result {...props} />
                        </button>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </Scrollable>
            </div>
          )}
        </FadingContent>
      </Card>
    </div>
  );
};
