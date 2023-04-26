import {
  useState,
  type ChangeEventHandler,
  type FormEventHandler,
  type HTMLAttributes,
} from "react";
import Router from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

import { Button } from "./Button";

type SearchInputProps = {
  className?: HTMLAttributes<HTMLInputElement>["className"];
  noIconButton?: boolean;
};

export const SearchInput: React.FC<SearchInputProps> = function ({
  className,
}: SearchInputProps) {
  const [term, setTerm] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setTerm(e.target.value);

  const handleSubmit: FormEventHandler<
    HTMLFormElement | HTMLDivElement
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
  > = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/search?term=${term}`);
    if (res.status == 200) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const url = (await res.json()).url;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument
      Router.push(url);
    }
  };

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
