import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/solid";
import cn from "classnames";

import { Scrollable } from "../Scrollable";

export interface Option<T> {
  value: T;
  label?: ReactNode;
  selectedLabel?: ReactNode;
}

interface BaseDropdownProps<T> {
  options: readonly Option<T>[];
  disabled?: boolean;
  width?: string;
  placeholder?: string;
  clearable?: boolean;
}

type SelectedValue<
  T,
  M extends boolean | undefined,
  C extends boolean | undefined
> = M extends true
  ? C extends true
    ? Option<T>[] | null
    : Option<T>[]
  : C extends true
  ? Option<T> | null
  : Option<T>;

type OnChangeFn<
  T,
  M extends boolean | undefined,
  C extends boolean | undefined
> = (newValue: SelectedValue<T, M, C>) => void;

export type DropdownProps<
  T,
  M extends boolean | undefined = undefined,
  C extends boolean | undefined = undefined
> = BaseDropdownProps<T> & {
  multiple?: M;
  clearable?: C;
  selected: SelectedValue<T, M, C>;
  onChange: OnChangeFn<T, M, C>;
};

const DEFAULT_WIDTH = "w-32";

export function Dropdown<
  T,
  M extends boolean | undefined = undefined,
  C extends boolean | undefined = undefined
>({
  options,
  selected,
  multiple,
  width,
  onChange,
  clearable,
  disabled,
  placeholder = "Select an item",
}: DropdownProps<T, M, C>) {
  const hasSelectedValue = Array.isArray(selected)
    ? selected.length > 0
    : !!selected;

  return (
    <Listbox
      value={selected}
      onChange={onChange}
      multiple={multiple}
      disabled={disabled}
    >
      <div className="relative">
        <ListboxButton
          className={`${
            width ?? DEFAULT_WIDTH
          } flex h-9 cursor-pointer items-center justify-between rounded-lg border border-transparent
          bg-controlBackground-light pl-2 pr-8 text-left text-sm shadow-md hover:border hover:border-controlBorderHighlight-light 
            focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white active:border-controlBorderHighlight-dark
            disabled:cursor-not-allowed disabled:bg-opacity-40 disabled:hover:border-transparent ui-open:border-controlActive-light dark:bg-controlBackground-dark dark:hover:border-controlBorderHighlight-dark dark:disabled:bg-opacity-40
            disabled:dark:hover:border-transparent dark:ui-open:border-controlActive-dark`}
        >
          <Scrollable>
            {hasSelectedValue ? (
              Array.isArray(selected) ? (
                <div className="flex flex-row items-center gap-1 align-middle">
                  {selected.map(({ selectedLabel, label }, i) => {
                    return (
                      <Fragment key={i}>{selectedLabel ?? label}</Fragment>
                    );
                  })}
                </div>
              ) : selected?.label ? (
                selected.label
              ) : (
                (selected?.value as ReactNode)
              )
            ) : (
              <div
                className={cn("text-hint-light dark:text-hint-dark", {
                  "text-opacity-40 dark:text-opacity-40": disabled,
                })}
              >
                {placeholder}
              </div>
            )}
          </Scrollable>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {clearable && hasSelectedValue ? (
              <XMarkIcon
                className="h-5 w-5 text-icon-light hover:text-iconHighlight-light dark:text-icon-dark dark:hover:text-iconHighlight-dark"
                onClick={(e) => {
                  e.stopPropagation();
                  multiple
                    ? onChange([] as unknown as SelectedValue<T, M, C>)
                    : onChange(null as SelectedValue<T, M, C>);
                }}
              />
            ) : (
              <ChevronUpDownIcon
                className={cn(
                  "pointer-events-none h-5 w-5 text-icon-light dark:text-icon-dark",
                  {
                    "text-opacity-40 dark:text-opacity-40": disabled,
                  }
                )}
                aria-hidden="true"
              />
            )}
          </div>
        </ListboxButton>
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-controlBackground-light py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-controlBackground-dark sm:text-sm">
            {options.map((opt) => (
              <ListboxOption
                key={String(opt.value)}
                className={`relative cursor-pointer select-none px-4 py-2 text-contentSecondary-light hover:bg-controlActive-light data-[selected]:font-semibold data-[selected]:text-content-light dark:text-contentSecondary-dark  hover:dark:bg-controlActive-dark data-[selected]:dark:font-semibold data-[selected]:dark:text-content-dark`}
                value={opt}
              >
                {({ selected }) => (
                  <div
                    className={cn("flex items-center justify-between gap-3")}
                  >
                    <div className="truncate text-sm">{opt.label}</div>
                    {selected && (
                      <CheckIcon
                        className="pointer-events-none absolute right-2.5 top-2.5 size-4"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
