import type { FC, ReactNode } from "react";
import React from "react";
import { ArrowsRightLeftIcon, CubeIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";

import dayjs from "@blobscan/dayjs";

import BlobIcon from "~/icons/blob.svg";
import type { SearchResults as SearchResultsType } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import { capitalize } from "~/utils";
import { Badge } from "../Badges/Badge";
import { Card } from "../Cards/Card";
import { EthIdenticon } from "../EthIdenticon";
import { Icon } from "../Icon";

type AddressSearchResult = NonNullable<SearchResultsType["address"]>[number];
type BlobSearchResult = NonNullable<SearchResultsType["blob"]>[number];
type BlockSearchResult = NonNullable<SearchResultsType["block"]>[number];
type TransactionSearchResult = NonNullable<
  SearchResultsType["transaction"]
>[number];

type SearchCategory = keyof SearchResultsType;

type SearchResult = NonNullable<SearchResultsType["address"]>[number];

function getSearchIcon(type: SearchCategory) {
  let icon: RenderableIcon;
  switch (type) {
    case "transaction":
      icon = ArrowsRightLeftIcon;
      break;
    case "blob":
      icon = BlobIcon;
      break;
    case "block":
      icon = CubeIcon;
      break;
    default:
      throw new Error("Missing category info");
  }

  return <Icon src={icon} size="lg" />;
}

const Highlighted: FC<{ value: string | number; term: string | number }> =
  function ({ term, value }) {
    const isHighlighted = value.toString() === term.toString();

    return (
      <span
        className={classNames("truncate", {
          "bg-primary-300 text-content-light dark:bg-primary-700 dark:text-content-dark":
            isHighlighted,
        })}
      >
        {value}
      </span>
    );
  };

const SearchResult: FC<{
  id: string | number;
  term: string;
  timestamp?: Date;
  reorg?: boolean;
  icon: ReactNode;
  secondaryData?: {
    label: ReactNode;
    value: string | number;
  }[];
}> = function ({ icon, term, id, timestamp, reorg, secondaryData }) {
  const [date, time] = timestamp
    ? dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss").split(" ")
    : [];

  return (
    <div className="flex flex-col">
      <div className="mt-2 flex cursor-pointer items-center justify-between rounded-md py-2 pl-1 pr-3 text-sm text-contentSecondary-light transition-colors hover:bg-primary-100 dark:text-contentSecondary-dark hover:dark:bg-primary-800/20">
        <div
          className={classNames("flex w-full items-center gap-2", {
            "justify-between": timestamp,
          })}
        >
          {icon}
          <div className="flex flex-col items-start justify-start gap-1 truncate">
            <div className="flex w-full items-center justify-between gap-1 text-sm dark:text-content-dark">
              <div className="flex items-center gap-2 truncate">
                <Highlighted value={id} term={term} />
                {reorg && (
                  <Badge variant="primary" size="xs">
                    Reorg
                  </Badge>
                )}
              </div>
            </div>
            {secondaryData && (
              <div className="flex w-full items-center gap-1 text-xs dark:text-contentTertiary-dark">
                {secondaryData.map(({ label, value }) => (
                  <div
                    key={value}
                    style={{
                      maxWidth: `${Math.round(100 / secondaryData.length)}%`,
                    }}
                    className={`flex  items-center gap-1`}
                  >
                    <span className="dark:text-contentSecondary-dark">
                      {label}
                    </span>
                    <Highlighted value={value} term={term} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {date && time && (
            <div className="flex flex-col items-center gap-1 text-nowrap text-xs dark:text-contentTertiary-dark">
              <div>{date}</div>
              <div>{time}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// const SearchResultItem: React.FC<SearchResultItemProps> = function ({
//   result:
//   category,
//   onClick,
// }) {
//   const { icon } = getCategoryInfo(category) || {};

//   return (
//     // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
//     <div className="flex flex-col" onClick={() => onClick(category, id)}>
//       <div className="mt-2 flex cursor-pointer items-center justify-between rounded-md py-2 pl-1 pr-3 text-sm text-contentSecondary-light transition-colors hover:bg-primary-100 dark:text-contentSecondary-dark hover:dark:bg-primary-800/20">
//         <div className="flex w-full items-center justify-between gap-2">
//           {icon && <Icon src={icon} size="lg" />}
//           <div className="flex w-full flex-col items-start justify-start gap-1">
//             <div className="flex w-full items-center justify-between gap-1 text-sm dark:text-content-dark">
//               <div className="flex items-center gap-2 truncate text-ellipsis">
//                 {label ? label : id}
//                 {reorg && (
//                   <Badge variant="primary" size="xs">
//                     Reorg
//                   </Badge>
//                 )}
//               </div>
//             </div>
//             <div className="flex items-center justify-between gap-1 text-xs dark:text-contentTertiary-dark">
//               <div className="flex items-center gap-1">
//                 <span className="dark:text-contentSecondary-dark">Hash </span>
//                 <span className="truncate">
//                   0x24dd28228ac4ab5a3e857cdbb4cbb7d7d4bfbc01e28d337eea981d49b8504f5c
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div className="text-xs dark:text-contentTertiary-dark">
//             {timestamp && dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss")}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

export type SearchResultsProps = {
  term: string;
  searchResults: SearchResultsType;
  onResultClick(category: SearchCategory, id: string): void;
};

export const SearchResults: React.FC<SearchResultsProps> = function ({
  term,
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
              {`${capitalize(c)}s`}
            </div>
            {searchResults[c]?.map((r) => {
              switch (c) {
                case "address": {
                  const { address, rollup } = r as AddressSearchResult;

                  return (
                    <SearchResult
                      key={address}
                      id={address}
                      term={term}
                      icon={<EthIdenticon address={address} />}
                    />
                  );
                }
                case "blob": {
                  const { commitment, proof, versionedHash } =
                    r as BlobSearchResult;

                  return (
                    <SearchResult
                      key={versionedHash}
                      id={versionedHash}
                      term={term}
                      icon={getSearchIcon(c)}
                      secondaryData={[
                        { label: "Commitment", value: commitment },
                        { label: "Proof", value: proof },
                      ]}
                    />
                  );
                }
                case "block": {
                  const { hash, number, slot, timestamp, reorg } =
                    r as BlockSearchResult;

                  return (
                    <SearchResult
                      key={hash}
                      id={number}
                      term={term}
                      timestamp={timestamp}
                      reorg={reorg}
                      icon={getSearchIcon(c)}
                      secondaryData={[
                        { label: "Hash", value: hash },
                        { label: "Slot", value: slot },
                      ]}
                    />
                  );
                }
                case "transaction": {
                  const { hash, blockTimestamp } = r as TransactionSearchResult;

                  return (
                    <SearchResult
                      key={hash}
                      id={hash}
                      term={term}
                      timestamp={blockTimestamp}
                      icon={getSearchIcon(c)}
                      secondaryData={[]}
                    />
                  );
                }
              }
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};
