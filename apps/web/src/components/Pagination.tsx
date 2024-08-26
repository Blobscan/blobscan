import { useEffect, useState } from "react";
import type { FC } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { Button } from "./Button";
import { Input } from "./Input";

type NavigationButton = {
  disabled?: boolean;
  onChange(page: number): void;
};

export type PaginationProps = {
  pages?: number;
  selected: number;
  inverseCompact?: boolean;
  onChange(page: number): void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

const FirstButton: FC<NavigationButton> = function ({ disabled, onChange }) {
  return (
    <Button
      disabled={disabled}
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => {
        onChange(1);
      }}
    >
      First
    </Button>
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
      onClick={() => onChange(lastPage)}
    >
      Last
    </Button>
  );
};

export const Pagination: FC<PaginationProps> = function ({
  pages,
  selected,
  onChange,
  inverseCompact = false,
}) {
  const [pageInput, setPageInput] = useState(selected);
  const isUndefined = pages === undefined;
  const disableFirst = selected === 1 || isUndefined;
  const disableLast = selected === pages || isUndefined;

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
            <FirstButton disabled={disableFirst} onChange={onChange} />
            <LastButton
              disabled={disableLast}
              lastPage={pages ?? 0}
              onChange={onChange}
            />
          </div>
        </div>
        <div className="flex w-full justify-between gap-2 align-middle">
          <div className="hidden sm:block">
            <FirstButton disabled={disableFirst} onChange={onChange} />
          </div>
          <Button
            disabled={disableFirst}
            variant="outline"
            size="sm"
            onClick={() => onChange(Math.max(1, selected - 1))}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
            <div className="w-20 font-light">
              <Input
                disabled={isUndefined}
                className="text-sm"
                type="number"
                min={1}
                max={pages}
                step={1}
                value={pageInput}
                onChange={(e) => setPageInput(Number(e.target.value))}
              />
            </div>
            <div className="self-center font-normal">
              {" "}
              of{" "}
              {isUndefined ? (
                <span>
                  <Skeleton width={33} />
                </span>
              ) : (
                pages
              )}
            </div>
          </div>
          <Button
            disabled={disableLast}
            variant="outline"
            size="sm"
            onClick={
              pages ? () => onChange(Math.min(pages, selected + 1)) : NOOP
            }
          >
            <span className="sr-only">Next</span>
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="hidden sm:block">
            <LastButton
              disabled={disableLast}
              lastPage={pages ?? 0}
              onChange={onChange}
            />
          </div>
        </div>
      </nav>
    </form>
  );
};
