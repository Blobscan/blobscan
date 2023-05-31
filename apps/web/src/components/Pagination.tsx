import { useEffect, useState, type FC } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

import { Button } from "./Button";
import { Input } from "./Input";

export type PaginationProps = {
  pages: number;
  selected: number;
  onChange(page: number): void;
};

export const Pagination: FC<PaginationProps> = function ({
  pages,
  selected,
  onChange,
}) {
  const [pageInput, setPageInput] = useState(selected);
  const isFirstPage = selected === 1;
  const isLastPage = selected === pages;

  // Keep inner page input value in sync
  useEffect(() => {
    setPageInput(selected);
  }, [selected]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onChange(pageInput);
      }}
    >
      <nav className="flex h-8 gap-2 align-middle">
        <Button
          disabled={isFirstPage}
          variant="outline"
          size="sm"
          label="First"
          onClick={() => {
            onChange(1);
          }}
        />
        <Button
          disabled={isFirstPage}
          variant="outline"
          size="sm"
          icon={
            <div>
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          }
          onClick={() => onChange(Math.max(1, selected - 1))}
        />
        <div className="flex items-center gap-2 text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
          <div className="w-20 font-light">
            <Input
              type="number"
              min={1}
              max={pages}
              value={pageInput}
              onChange={(e) => setPageInput(Number(e.target.value))}
            />
          </div>
          <div className="self-center font-normal"> of {pages}</div>
        </div>
        <Button
          disabled={isLastPage}
          variant="outline"
          size="sm"
          icon={
            <div>
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          }
          onClick={() => onChange(Math.min(pages, selected + 1))}
        />
        <Button
          disabled={isLastPage}
          variant="outline"
          size="sm"
          label="Last"
          onClick={() => onChange(pages)}
        />
      </nav>
    </form>
  );
};
