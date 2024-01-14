import { useCallback, useRef, useState } from "react";
import type { FormEventHandler, HTMLAttributes } from "react";
import NextError from "next/error";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

import { api } from "~/api-client";
import type { RouterOutputs } from "~/api-client";
import { useClickOutside } from "~/hooks/useClickOutside";
import { useDebounce } from "~/hooks/useDebounce";
import { getRouteBySearchCategory } from "~/utils";
import { Button } from "../Button";
import { Input } from "../Input";
import { SearchResults } from "./SearchResults";
import type { SearchResultsProps } from "./SearchResults";

type SearchOutput = RouterOutputs["search"]["byTerm"];
type SearchCategory = keyof SearchOutput;
type SearchInputProps = {
  className?: HTMLAttributes<HTMLInputElement>["className"];
  noIconButton?: boolean;
};

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
    }
  );

  const handleSubmit: FormEventHandler<HTMLFormElement | HTMLButtonElement> = (
    e
  ) => {
    e.preventDefault();

    const searchResults = searchQuery.data;

    setTerm("");

    if (!searchResults || !Object.keys(searchResults).length) {
      void router.push(`/search?q=${term}`);
      return;
    }

    const categories = Object.keys(searchResults) as SearchCategory[];

    if (categories.length > 1) {
      void router.push(`/search?q=${term}`);
      return;
    }

    const category = categories[0] as SearchCategory;
    const results = searchResults[category];

    if (!results || !results.length || results.length > 1 || !results[0]?.id) {
      void router.push(`/search?q=${term}`);
      return;
    }

    void router.push(getRouteBySearchCategory(category, results[0].id));
  };

  const handleResultClick = useCallback<SearchResultsProps["onResultClick"]>(
    (category, id) => {
      setTerm("");
      void router.push(getRouteBySearchCategory(category, id));
    },
    [router]
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
          <Input
            type="text"
            name="search"
            id="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className={"rounded-none rounded-l-md"}
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
          icon={<MagnifyingGlassIcon className="-ml-0.5" aria-hidden="true" />}
          size="md"
        />
      </div>
    </form>
  );
};
