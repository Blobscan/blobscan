import {
  useCallback,
  useRef,
  useState,
  type ChangeEventHandler,
  type FormEventHandler,
  type HTMLAttributes,
} from "react";
import NextError from "next/error";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

import { api, type RouterOutputs } from "~/utils/api";
import { useClickOutside } from "~/hooks/useClickOutside";
import { useDebounce } from "~/hooks/useDebounce";
import {
  NO_RESULTS_ROUTE,
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
} from "~/utils";
import { Button } from "../Button";
import { SearchResults, type SearchResultsProps } from "./SearchResults";

type SearchOutput = RouterOutputs["search"]["byTerm"];

type SearchInputProps = {
  className?: HTMLAttributes<HTMLInputElement>["className"];
  noIconButton?: boolean;
};

function getRouteBySearchCategory(
  category: keyof SearchOutput,
  id: string,
): string {
  switch (category) {
    case "address":
      return buildAddressRoute(id);
    case "blob": {
      const [txHash, txIndex] = id.split("-");

      if (!txHash || !txIndex) {
        return NO_RESULTS_ROUTE;
      }

      return buildBlobRoute(txHash, txIndex);
    }
    case "block":
    case "slot":
      return buildBlockRoute(id);
    case "transaction":
      return buildTransactionRoute(id);
    default:
      return NO_RESULTS_ROUTE;
  }
}

export const SearchInput: React.FC<SearchInputProps> = function ({
  className,
}: SearchInputProps) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebounce(term, 600);
  const searchRef = useRef<HTMLFormElement>(null);
  const clickOutside = useClickOutside(searchRef);

  const searchQuery = api.search.byTerm.useQuery(
    {
      term: debouncedTerm,
    },
    {
      queryKey: ["search.byTerm", { term: debouncedTerm }],
      enabled: !!debouncedTerm.length,
      staleTime: Infinity,
    },
  );

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => setTerm(e.target.value),
    [],
  );

  const handleSubmit = useCallback<
    FormEventHandler<HTMLFormElement | HTMLButtonElement>
  >(
    (e) => {
      e.preventDefault();

      const searchResults = searchQuery.data;

      if (!searchResults) {
        return;
      }

      setTerm("");
      const searchedCategories = Object.keys(searchResults);

      if (!searchedCategories.length) {
        void router.push(NO_RESULTS_ROUTE);
        return;
      }
      const firstCategory = searchedCategories[0] as keyof typeof searchResults;

      const results = searchResults[firstCategory];

      if (!results || !results[0]?.id) {
        void router.push(NO_RESULTS_ROUTE);
        return;
      }

      void router.push(getRouteBySearchCategory(firstCategory, results[0].id));
    },
    [searchQuery.data, router],
  );

  const handleResultClick = useCallback<SearchResultsProps["onResultClick"]>(
    (category, id) => {
      setTerm("");
      void router.push(getRouteBySearchCategory(category, id));
    },
    [router],
  );

  if (searchQuery.error) {
    return (
      <NextError
        title={searchQuery.error.message}
        statusCode={searchQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  const searchResults = searchQuery.data;
  const displayResults =
    !!searchResults &&
    !!Object.keys(searchResults).length &&
    !clickOutside &&
    term;

  return (
    <form ref={searchRef} onSubmit={handleSubmit}>
      <div
        className={`relative flex rounded-md border-border-light shadow-sm dark:border-border-dark ${className}`}
      >
        <div className="relative flex flex-grow items-stretch focus-within:z-10">
          <input
            type="text"
            name="search"
            id="search"
            value={term}
            onChange={handleChange}
            className={`
            block
            w-full
            rounded-none
            rounded-l-md
            border-border-light
            bg-controlBackground-light
            py-1.5
            text-sm
            transition-colors
            placeholder:text-hint-light
            hover:border-controlBorderHighlight-light
            focus:border-accentHighlight-light
            focus:ring-0
            dark:border-border-dark
            dark:bg-background-dark
            dark:placeholder:text-hint-dark
            dark:hover:border-controlBorderHighlight-dark
            dark:focus:border-accentHighlight-dark
            sm:leading-6
            lg:text-base
            `}
            placeholder={`Search by Blob / KZG / Txn / Block / Slot / Address`}
          />
        </div>
        {displayResults && searchResults && (
          <div className="absolute inset-x-0 top-11 z-10 rounded-md border border-border-light dark:border-border-dark">
            <SearchResults
              searchResults={searchResults}
              onResultClick={handleResultClick}
            />
          </div>
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
          icon={
            <MagnifyingGlassIcon
              className="-ml-0.5 h-5 w-5"
              aria-hidden="true"
            />
          }
        />
      </div>
    </form>
  );
};
