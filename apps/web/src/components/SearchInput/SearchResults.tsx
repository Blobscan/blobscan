import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CpuChipIcon, CubeIcon } from "@heroicons/react/24/solid";

import { type RouterOutputs } from "~/utils/api";
import { capitalize } from "~/utils";
import { Card } from "../Cards/Card";

type SearchOutput = RouterOutputs["search"]["byTerm"];
type SearchCategory = keyof SearchOutput;

type SearchResult = NonNullable<SearchOutput["address"]>[number];

type SearchResultItemProps = {
  category: SearchCategory;
  result: SearchResult;
  onClick(category: SearchCategory, id: string): void;
};

function typeToIcon(type: SearchCategory) {
  const className = "h-4 w-4  text-icon-light dark:text-icon-dark";
  switch (type) {
    case "blob":
      return <CpuChipIcon className={className} />;
    case "block":
    case "slot":
      return <CubeIcon className={className} />;
    default:
      return null;
  }
}

const SearchResultItem: React.FC<SearchResultItemProps> = function ({
  result: { id },
  category,
  onClick,
}) {
  return (
    <div className="flex flex-col" onClick={() => onClick(category, id)}>
      <div className="mt-2 flex cursor-pointer items-center justify-between rounded-md py-2 pl-1 pr-3 text-sm text-contentSecondary-light transition-colors hover:bg-primary-100 dark:text-contentSecondary-dark hover:dark:bg-primary-800/20">
        <div className="flex w-11/12 items-center gap-2">
          {typeToIcon(category)}
          {category === "blob" ? (
            <div className="flex truncate">
              <div className="whitespace-nowrap">Blob {id.split("-")[1]}</div>
              <span className="mx-1 inline-block">･</span>
              <span className="truncate">Tx: {id.split("-")[0]}</span>
            </div>
          ) : (
            <span className="flex truncate">
              {category === "slot" && <div className="mr-1">Block</div>}
              {id}
            </span>
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
    searchResults,
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
