import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CpuChipIcon, CubeIcon, DocumentIcon } from "@heroicons/react/24/solid";

import type { RouterOutputs } from "~/api-client";
import { capitalize } from "~/utils";
import { Badge } from "../Badges/Badge";
import { Card } from "../Cards/Card";

type SearchOutput = RouterOutputs["search"]["byTerm"];
type SearchCategory = keyof SearchOutput;

type SearchResult = NonNullable<SearchOutput["address"]>[number];

type SearchResultItemProps = {
  category: SearchCategory;
  result: SearchResult;
  onClick(category: SearchCategory, id: string): void;
};

type CategoryInfo = {
  icon?: React.ReactNode;
  label?: string;
};

function getCategoryInfo(type: SearchCategory): CategoryInfo | undefined {
  const categoryIconClassName = "h-4 w-4  text-icon-light dark:text-icon-dark";

  switch (type) {
    case "transaction":
      return {
        icon: <DocumentIcon className={categoryIconClassName} />,
      };
    case "blob":
      return {
        icon: <CpuChipIcon className={categoryIconClassName} />,
      };
    case "block":
    case "slot":
      return {
        icon: <CubeIcon className={categoryIconClassName} />,
        label: "Block",
      };
    default:
      return;
  }
}

const SearchResultItem: React.FC<SearchResultItemProps> = function ({
  result: { id, label, reorg },
  category,
  onClick,
}) {
  const { icon, label: categoryLabel } = getCategoryInfo(category) || {};

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div className="flex flex-col" onClick={() => onClick(category, id)}>
      <div className="mt-2 flex cursor-pointer items-center justify-between rounded-md py-2 pl-1 pr-3 text-sm text-contentSecondary-light transition-colors hover:bg-primary-100 dark:text-contentSecondary-dark hover:dark:bg-primary-800/20">
        <div className="flex w-11/12 items-center gap-2">
          {icon}
          <span className="flex truncate">
            {categoryLabel && (
              <div className="mr-1 text-content-light dark:text-content-dark">
                {categoryLabel}
              </div>
            )}
            {label}
          </span>
          {reorg && (
            <Badge variant="primary" className="text-xs">
              reorg
            </Badge>
          )}
        </div>
        <ChevronRightIcon className="inline-block h-4 w-4 text-icon-light dark:text-icon-dark" />
      </div>
    </div>
  );
};

export type SearchResultsProps = {
  searchResults: SearchOutput;
  onResultClick(category: SearchCategory, id: string): void;
};

export const SearchResults: React.FC<SearchResultsProps> = function ({
  searchResults,
  onResultClick,
}) {
  const categories = Object.keys(
    searchResults
  ) as (keyof typeof searchResults)[];

  if (!categories.length) return null;

  return (
    <Card className="px-3 py-4">
      <div className="flex flex-col">
        {categories.map((c) => (
          <React.Fragment key={c}>
            <div className="rounded-md p-2 font-semibold dark:bg-primary-900">
              {capitalize(c)}
            </div>
            {searchResults[c]?.map((r) => (
              <SearchResultItem
                key={r.id}
                category={c}
                result={r}
                onClick={onResultClick}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};
