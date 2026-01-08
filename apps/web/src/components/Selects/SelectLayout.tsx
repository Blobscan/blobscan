import React, { Fragment } from "react";
import { Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import cn from "classnames";

import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Scrollable } from "../Scrollable";

export type TValue = string | number | bigint;

export type TMultiple = boolean;
export type TNullable = boolean;

export interface SelectOption<T extends TValue> {
  value: T;
  label?: React.ReactNode;
  searchText?: string;
}

export type SelectedOption<
  T extends TValue,
  M extends TMultiple,
  N extends TNullable
> = M extends true
  ? N extends true
    ? SelectOption<T>[] | null
    : SelectOption<T>[]
  : N extends true
  ? SelectOption<T> | null
  : SelectOption<T>;

export interface BaseSelectProps<
  T extends TValue,
  M extends TMultiple = false,
  N extends TNullable = false
> {
  options: readonly SelectOption<T>[];
  selected: SelectedOption<T, M, N>;
  multiple?: M;
  nullable?: N;
  disabled?: boolean;
  placeholder?: string;

  onChange: OnChangeFn<T, M, N>;
}

export type OnChangeFn<
  T extends TValue,
  M extends TMultiple,
  N extends TNullable
> = (newOption: SelectedOption<T, M, N>) => void;

export interface SelectLayoutProps {
  as?: React.ElementType;
  children: React.ReactNode;
  disabled?: boolean;
  optionsPanel: React.ReactNode;
  open?: boolean;
  showClear: boolean;
  toggleAs?: React.ElementType;

  onClear?(): void;
}

export const SelectLayout = React.forwardRef<HTMLDivElement, SelectLayoutProps>(
  function SelectLayout(
    { as, disabled, toggleAs, children, optionsPanel, showClear, onClear },
    forwardedRef
  ) {
    const WrapperComponent = as ?? "div";
    const ToggleComponent = toggleAs ?? "div";

    return (
      <div className="relative">
        <WrapperComponent
          aria-label="Open select"
          className={cn(
            "flex h-9 w-full  items-center justify-between rounded-lg border border-transparent",
            "bg-controlBackground-light px-2  text-left text-sm shadow-md hover:border hover:border-controlBorderHighlight-light",
            "focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white active:border-controlBorderHighlight-dark",
            {
              "cursor-not-allowed opacity-40 hover:border-transparent dark:bg-opacity-40 dark:hover:border-transparent":
                disabled,
              "cursor-pointer": !disabled,
            },
            "ui-open:border-controlActive-light dark:bg-controlBackground-dark dark:hover:border-controlBorderHighlight-dark dark:ui-open:border-controlActive-dark"
          )}
        >
          <Scrollable ref={forwardedRef}>{children}</Scrollable>
          <div className="ml-1 flex items-center gap-1">
            {showClear && (
              <IconButton
                variant={disabled ? "disabled" : "default"}
                onClick={(e) => {
                  if (onClear && !disabled) {
                    onClear();
                  }

                  e.stopPropagation();
                }}
                aria-label="Clear all"
              >
                <XMarkIcon />
              </IconButton>
            )}
            <ToggleComponent
              className={cn({
                "hover:fill-iconHighlight-lighthover:text-iconHighlight-light         hover:dark:fill-iconHighlight-dark hover:dark:text-iconHighlight-dark":
                  !disabled,
              })}
            >
              <Icon src={ChevronUpDownIcon} size="lg" />
            </ToggleComponent>
          </div>
        </WrapperComponent>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={cn(
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/10 focus:outline-none",
              "dark:bg-controlBackground-dark",
              "transition-colors dark:[&::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-primary-800 dark:hover:[&::-webkit-scrollbar-thumb]:bg-accentHighlight-dark/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-surface-dark/60 [&::-webkit-scrollbar]:max-h-1.5 [&::-webkit-scrollbar]:max-w-1.5"
            )}
          >
            {optionsPanel}
          </div>
        </Transition>
      </div>
    );
  }
);
export interface OptionLayoutProps<T extends TValue> {
  option: SelectOption<T>;
  selected?: boolean;
  focused?: boolean;
}

export function OptionLayout<T extends TValue>({
  option,
  selected,
  focused,
}: OptionLayoutProps<T>) {
  return (
    <div
      className={cn(
        "relative cursor-pointer select-none ",
        "flex items-center justify-between gap-3 px-4 py-2",
        "text-contentSecondary-light dark:text-contentSecondary-dark",
        "hover:bg-controlActive-light hover:dark:bg-controlActive-dark/70",
        {
          "bg-controlActive-light dark:bg-controlActive-dark/70": focused,
        }
      )}
    >
      <div
        className={cn("truncate text-sm", {
          "opacity-50": selected,
        })}
      >
        {option.label ?? option.value}
      </div>
      {selected && (
        <CheckIcon
          className="pointer-events-none absolute right-2.5 top-2.5 size-4"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
