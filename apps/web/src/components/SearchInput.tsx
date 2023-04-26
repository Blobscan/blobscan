import {
  useEffect,
  useState,
  type ChangeEventHandler,
  type FormEventHandler,
  type HTMLAttributes,
} from "react";
import NextError from "next/error";
import Router from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

import { api } from "~/api";
import { Button } from "./Button";

type SearchInputProps = {
  className?: HTMLAttributes<HTMLInputElement>["className"];
  noIconButton?: boolean;
};

export const SearchInput: React.FC<SearchInputProps> = function ({
  className,
}: SearchInputProps) {
  const [term, setTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");

  const searchQuery = api.search.byTerm.useQuery(
    {
      term: submittedTerm,
    },
    {
      enabled: !!submittedTerm,
    },
  );

  useEffect(() => {
    if (searchQuery.status !== "success") {
      return;
    }

    async function handleSearch() {
      const { data: response } = searchQuery;

      if (response?.length === 0) {
        await Router.push(`/empty?term=${submittedTerm}`);
      }

      if (response?.length === 1 && response[0]) {
        await Router.push(response[0].path);
      }
    }

    void handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery.status, searchQuery.data, submittedTerm]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setTerm(e.target.value);

  const handleSubmit: FormEventHandler<HTMLFormElement | HTMLButtonElement> = (
    e,
  ) => {
    e.preventDefault();
    setSubmittedTerm(term);
  };

  if (searchQuery.error) {
    return (
      <NextError
        title={searchQuery.error.message}
        statusCode={searchQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`border, flex  rounded-md border-border-light shadow-sm dark:border-border-dark ${className}`}
      >
        <div className="relative flex flex-grow items-stretch focus-within:z-10">
          <input
            type="text"
            name="search"
            id="search"
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
            placeholder={"Search by Blob / KZG / Txn / Block / Slot / Address"}
          />
        </div>
        <Button
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
