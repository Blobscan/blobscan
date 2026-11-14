import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEventHandler, HTMLAttributes } from "react";
import { useRouter } from "next/compat/router";
import { Transition } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

import { api } from "~/api-client";
import { useClickOutside } from "~/hooks/useClickOutside";
import { useDebounce } from "~/hooks/useDebounce";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import type { SearchCategory } from "~/types";
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
      return routes.address(id_);
    case "blobs":
      return routes.blob(id_);
    case "blocks":
      return routes.block(id_);
    case "transactions":
      return routes.tx(id_);
  }
}

export const SearchInput: React.FC<SearchInputProps> = function ({
  className,
}: SearchInputProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [outsideClicked, setOutsideClicked] = useState(false);
  const trimmedSearchQuery = searchQuery.trim();
  const { value: debouncedSearchQuery, isDebouncing } = useDebounce(
    trimmedSearchQuery,
    200
  );
  const searchRef = useRef<HTMLFormElement>(null);

  const {
    data: searchData,
    error: searchError,
    isFetching: isSearchFetching,
  } = api.search.useQuery(
    {
      query: debouncedSearchQuery,
    },
    {
      enabled: Boolean(debouncedSearchQuery),
      staleTime: Infinity,
    }
  );

  useClickOutside(searchRef, () => {
    setOutsideClicked(true);
  });

  const isLoading = isDebouncing || isSearchFetching;
  const displayResults = Boolean(
    !outsideClicked &&
      trimmedSearchQuery &&
      (isLoading || searchData !== undefined)
  );

  useEffect(() => {
    if (!displayResults) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOutsideClicked(true);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [displayResults]);

  const handleSubmit: FormEventHandler<HTMLFormElement | HTMLButtonElement> = (
    e
  ) => {
    e.preventDefault();

    if (!trimmedSearchQuery) {
      return;
    }

    setSearchQuery("");

    let route = `/search?q=${trimmedSearchQuery}`;

    if (searchData && !isDebouncing) {
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

    void router?.push(route);
  };

  const handleResultClick = useCallback<ResultsModalProps["onResultClick"]>(
    (category, id) => {
      setSearchQuery("");

      void router?.push(buildSearchResultRoute(category, id));
    },
    [router]
  );

  if (searchError) {
    return <ErrorPage error={searchError} />;
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOutsideClicked(false);
            }}
            onFocus={() => setOutsideClicked(false)}
            onClick={() => setOutsideClicked(false)}
            className={"rounded-none rounded-l-md"}
            placeholder={`Search by Hash / KZG / Proof / Block Number / Slot / Address`}
          />
        </div>

        <Transition
          show={displayResults}
          enter="transition-[grid-template-rows,opacity] duration-[180ms] ease-out motion-reduce:transition-none"
          enterFrom="grid-rows-[0fr] opacity-0"
          enterTo="grid-rows-[1fr] opacity-100"
          leave="pointer-events-none transition-[grid-template-rows,opacity] duration-[180ms] ease-in-out motion-reduce:transition-none"
          leaveFrom="grid-rows-[1fr] opacity-100"
          leaveTo="grid-rows-[0fr] opacity-0"
          as="div"
          className="absolute inset-x-0 top-11 z-10 grid"
        >
          <div className="min-h-0 overflow-hidden">
            <ResultsModal
              open={displayResults}
              searchQuery={trimmedSearchQuery}
              results={searchData ?? null}
              isLoading={isLoading}
              onResultClick={handleResultClick}
            />
          </div>
        </Transition>

        <Button
          type="submit"
          variant="primary"
          aria-label="Search"
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
          <MagnifyingGlassIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
};
