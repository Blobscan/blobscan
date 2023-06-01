import { useEffect, useState, type FC } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

import { Button } from "./Button";
import { Input } from "./Input";

type NavigationButton = {
  disabled?: boolean;
  onChange(page: number): void;
};

export type PaginationProps = {
  pages: number;
  selected: number;
  inverseCompact?: boolean;
  onChange(page: number): void;
};

const FirstButton: FC<NavigationButton> = function ({ disabled, onChange }) {
  return (
    <Button
      disabled={disabled}
      variant="outline"
      size="sm"
      label="First"
      className="w-full"
      onClick={() => {
        onChange(1);
      }}
    />
  );
};

const LastButton: FC<NavigationButton & { lastPage: number }> = function ({
  disabled,
  onChange,
  lastPage,
}) {
  return (
    <Button
      className="w-full"
      disabled={disabled}
      variant="outline"
      size="sm"
      label="Last"
      onClick={() => onChange(lastPage)}
    />
  );
};

export const Pagination: FC<PaginationProps> = function ({
  pages,
  selected,
  onChange,
  inverseCompact = false,
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
      <nav
        className={`flex gap-2 ${
          inverseCompact ? "flex-col-reverse" : "flex-col"
        }`}
      >
        <div className="block sm:hidden">
          <div className="flex justify-between gap-2">
            <FirstButton disabled={isFirstPage} onChange={onChange} />
            <LastButton
              disabled={isLastPage}
              lastPage={pages}
              onChange={onChange}
            />
          </div>
        </div>
        <div className="flex w-full justify-between gap-2 align-middle">
          <div className="hidden sm:block">
            <FirstButton disabled={isFirstPage} onChange={onChange} />
          </div>
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
                className="text-sm"
                type="number"
                min={1}
                max={pages}
                step={1}
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
          <div className="hidden sm:block">
            <LastButton
              disabled={isLastPage}
              lastPage={pages}
              onChange={onChange}
            />
          </div>
        </div>
      </nav>
    </form>
  );
};
