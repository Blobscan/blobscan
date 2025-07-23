import { useCallback, useRef, useState } from "react";
import type { FormEventHandler, HTMLAttributes } from "react";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

import { api } from "~/api-client";
import { useClickOutside } from "~/hooks/useClickOutside";
import { useDebounce } from "~/hooks/useDebounce";
import Loading from "~/icons/loading.svg";
import NextError from "~/pages/_error";
import type { SearchCategory } from "~/types";
import {
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
} from "~/utils";
import { Button } from "../Button";
import { Input } from "../Inputs/Input";
import { ResultsModal } from "./ResultsModal";
import type { ResultsModalProps } from "./ResultsModal";

type SearchInputProps = {
  className?: HTMLAttributes<HTMLInputElement>["className"];
  noIconButton?: boolean;
};

function buildSearchResultRoute(category: SearchCategory, id: string | number) {
  const id_ = id.toString();

  switch (category) {
    case "addresses":
      return buildAddressRoute(id_);
    case "blobs":
      return buildBlobRoute(id_);
    case "blocks":
      return buildBlockRoute(id_);
    case "transactions":
      return buildTransactionRoute(id_);
  }
}

export const SearchInput: React.FC<SearchInputProps> = function ({
  className,
}: SearchInputProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const debouncedSearchQuery = useDebounce(trimmedSearchQuery, 200);
  const searchRef = useRef<HTMLFormElement>(null);
  const clickOutside = useClickOutside(searchRef);
  const {
    data: searchData,
    error: searchError,
    isFetching: isSearchFetching,
  } = api.search.useQuery(
    {
      query: debouncedSearchQuery,
    },
    {
      queryKey: ["search", { query: debouncedSearchQuery }],
      enabled: Boolean(debouncedSearchQuery),
      staleTime: Infinity,
    }
  );
  const isDebouncing = trimmedSearchQuery !== debouncedSearchQuery;

  const displayResults =
    !isDebouncing &&
    !clickOutside &&
    trimmedSearchQuery &&
    searchData !== undefined;

  const handleSubmit: FormEventHandler<HTMLFormElement | HTMLButtonElement> = (
    e
  ) => {
    e.preventDefault();

    if (!trimmedSearchQuery) {
      return;
    }

    setSearchQuery("");

    let route = `/search?q=${trimmedSearchQuery}`;

    if (searchData) {
      const { addresses, blobs, blocks, transactions } = searchData;
      let category: SearchCategory | undefined;
      let id: string | number | undefined;

      if (addresses?.length && addresses[0]) {
        category = "addresses";
        id = addresses[0].address;
      } else if (blobs?.length && blobs[0]) {
        category = "blobs";
        id = blobs[0].versionedHash;
      } else if (blocks?.length && blocks[0]) {
        category = "blocks";
        id = blocks[0].hash;
      } else if (transactions?.length && transactions[0]) {
        category = "transactions";
        id = transactions[0].hash;
      }

      if (category && id) {
        route = buildSearchResultRoute(category, id);
      }
    }

    void router.push(route);
  };

  const handleResultClick = useCallback<ResultsModalProps["onResultClick"]>(
    (category, id) => {
      setSearchQuery("");

      void router.push(buildSearchResultRoute(category, id));
    },
    [router]
  );

  if (searchError) {
    return (
      <NextError
        title={searchError.message}
        statusCode={searchError.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <form ref={searchRef} onSubmit={handleSubmit}>
      <div
        className={`relative flex rounded-md border-border-light shadow-sm dark:border-border-dark ${className}`}
      >
        <div className="relative flex flex-grow items-stretch focus-within:z-10">
          <Input
            variant="outline"
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={"rounded-none rounded-l-md"}
            placeholder={`Search by Hash / KZG / Proof / Block Number / Slot / Address`}
          />
        </div>

        {displayResults && (
          <ResultsModal
            searchQuery={trimmedSearchQuery}
            results={searchData}
            onResultClick={handleResultClick}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          onClick={handleSubmit}
          className={`
          relative
          -ml-px
          inline-flex
          items-center
          gap-x-1.5
          rounded-l-none
          rounded-r-md
          font-semibold
          ring-1
          ring-inset
          `}
        >
          {(isSearchFetching || isDebouncing) && trimmedSearchQuery ? (
            <Loading className="-ml-0.5 h-5 w-5 animate-spin" />
          ) : (
            <MagnifyingGlassIcon
              className="-ml-0.5 h-5 w-5"
              aria-hidden="true"
            />
          )}
        </Button>
      </div>
    </form>
  );
};
