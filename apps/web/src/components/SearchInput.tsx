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
import { utils } from "ethers";

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
  const [submittedTerm, setSubmittedTerm] = useState<string | null>(null);

  const searchByHash = api.search.searchByHash.useQuery(
    {
      hash: submittedTerm as string,
    },
    {
      enabled: false,
    },
  );
  const searchByNumber = api.search.searchByNumber.useQuery(
    {
      number: Number(submittedTerm),
    },
    {
      enabled: false,
    },
  );
  const error = searchByNumber.error || searchByHash.error;

  useEffect(() => {
    if (submittedTerm === null) {
      return;
    }

    async function handleSearch() {
      if (utils.isAddress(submittedTerm as string)) {
        await Router.push(`/address/${submittedTerm}`);
      }

      if (submittedTerm?.startsWith("0x") && submittedTerm?.length === 66) {
        await searchByHash.refetch();

        const { data } = searchByHash;

        if (data?.type === "transaction") {
          await Router.push(`/tx/${data.id}`);
        }

        if (data?.type === "blob") {
          await Router.push(`/tx/${data.id?.replace("-", "/blob/")}`);
        }

        if (data?.type === "block") {
          await Router.push(`/block/${data.id}`);
        }

        console.log(data);

        return;
      }

      if (typeof Number(submittedTerm) === "number") {
        await searchByNumber.refetch();

        const { data } = searchByNumber;

        console.log(data);

        return;
      }

      await Router.push(`/empty`);
    }

    void handleSearch().then(() => {
      setSubmittedTerm(null);
    });
  }, [searchByHash, searchByNumber, submittedTerm]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setTerm(e.target.value);

  const handleSubmit: FormEventHandler<HTMLFormElement | HTMLButtonElement> = (
    e,
  ) => {
    e.preventDefault();
    setSubmittedTerm(term);
  };

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
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
            placeholder="Search by Blob Hash / Txn Hash / Block /Address"
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
