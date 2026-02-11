import React, { Fragment } from "react";
import { ArrowsRightLeftIcon, CubeIcon } from "@heroicons/react/24/outline";

import BlobIcon from "~/icons/blob.svg";
import type { Rollup, SearchCategory, SearchOutput } from "~/types";
import { capitalize } from "~/utils";
import { Card } from "../Cards/Card";
import { EmptyState } from "../EmptyState";
import { EthIdenticon } from "../EthIdenticon";
import { Icon } from "../Icon";
import { Scrollable } from "../Scrollable";
import { Result } from "./Result";
import type { ResultProps } from "./Result";

export type ResultsModalProps = {
  searchQuery: string;
  results: SearchOutput | null;
  onResultClick(category: SearchCategory, id: string | number): void;
};

export const ResultsModal: React.FC<ResultsModalProps> = function ({
  searchQuery,
  results,
  onResultClick,
}) {
  const categoryResults: {
    category: SearchCategory;
    results: (ResultProps & { id: string | number })[];
  }[] = [];

  const { addresses, blobs, blocks, transactions } = results ?? {};

  if (addresses) {
    categoryResults.push({
      category: "addresses",
      results: addresses.map(({ address, rollup }) => ({
        icon: <EthIdenticon address={address} size="sm" />,
        id: address,
        label: address,
        searchQuery,
        rollup: rollup?.toLowerCase() as Rollup | undefined,
      })),
    });
  }

  if (blobs) {
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

  if (blocks) {
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

  if (transactions) {
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
    <div className="absolute inset-x-0 top-11 z-10 rounded-md border border-border-light dark:border-border-dark">
      <Card className="px-3 py-4">
        {categoryResults.length ? (
          <Scrollable>
            <div className="flex max-h-[350px] flex-col md:max-h-[550px]">
              {categoryResults.map(({ category, results }) => (
                <Fragment key={category}>
                  <div className="rounded-md bg-primary-200 p-2 font-semibold dark:bg-primary-900">
                    {`${capitalize(category)} ${
                      results.length > 1 ? `(${results.length})` : ""
                    }`}
                  </div>
                  {results.map(({ id, ...props }) => (
                    <button
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
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2 p-6 text-base dark:text-contentTertiary-dark">
            <EmptyState size="sm" description="No Results Found" />
          </div>
        )}
      </Card>
    </div>
  );
};
