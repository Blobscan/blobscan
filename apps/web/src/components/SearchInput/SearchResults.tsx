import React from "react";
import {
  ArrowsRightLeftIcon,
  ChevronRightIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

import BlobIcon from "~/icons/blob.svg";
import type { SearchResults as SearchResultsType } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import { capitalize } from "~/utils";
import { Badge } from "../Badges/Badge";
import { Card } from "../Cards/Card";
import { Icon } from "../Icon";

type SearchCategory = keyof SearchResultsType;

type SearchResult = NonNullable<SearchResultsType["address"]>[number];

type SearchResultItemProps = {
  category: SearchCategory;
  result: SearchResult;
  onClick(category: SearchCategory, id: string): void;
};

type CategoryInfo = {
  icon?: RenderableIcon;
  label?: string;
};

function getCategoryInfo(type: SearchCategory): CategoryInfo | undefined {
  switch (type) {
    case "transaction":
      return {
        icon: ArrowsRightLeftIcon,
      };
    case "blob":
      return {
        icon: BlobIcon,
      };
    case "block":
    case "slot":
      return {
        icon: CubeIcon,
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
          {icon && <Icon src={icon} />}
          <span className="flex truncate">
            {categoryLabel && (
              <div className="mr-1 text-content-light dark:text-content-dark">
                {categoryLabel}
              </div>
            )}
            {label ? label : id}
          </span>
          {reorg && (
            <Badge variant="primary" className="text-xs">
              Reorg
            </Badge>
          )}
        </div>
        <ChevronRightIcon className="inline-block h-4 w-4 text-icon-light dark:text-icon-dark" />
      </div>
    </div>
  );
};

export type SearchResultsProps = {
  searchResults: SearchResultsType;
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
