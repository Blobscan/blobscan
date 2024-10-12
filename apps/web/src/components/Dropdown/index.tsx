import { Fragment, useRef } from "react";
import type { ReactNode } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/solid";
import cn from "classnames";

import useOverflow from "~/hooks/useOverflow";
import { Option } from "./Option";

export interface Option {
  value: string | number;
  label?: ReactNode;
  prefix?: ReactNode;
  inputDisplay?: ReactNode;
}

type BaseDropdownProps = {
  options: Option[];
  width?: string;
  placeholder?: string;
  clearable?: boolean;
};

interface SingleDropdownProps extends BaseDropdownProps {
  selected?: Option | null;
  multiple?: false;
  onChange(newOption: Option | null): void;
}

export interface MultiDropdownProps extends BaseDropdownProps {
  selected?: Option[] | null;
  multiple: true;
  onChange(newOptions: Option[]): void;
}

export type DropdownProps = SingleDropdownProps | MultiDropdownProps;

const DEFAULT_WIDTH = "w-32";

export const Dropdown: React.FC<DropdownProps> = function ({
  options,
  selected,
  multiple,
  width,
  onChange,
  clearable = false,
  placeholder = "Select an item",
}) {
  const hasValue = Array.isArray(selected) ? selected.length > 0 : selected;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const isOverflowing = useOverflow(containerRef, innerRef);

  return (
    <Listbox value={selected} onChange={onChange} multiple={multiple}>
      <div className="relative">
        <ListboxButton
          className={`relative h-9 ${
            width ?? DEFAULT_WIDTH
          } flex cursor-pointer items-center justify-between rounded-lg border border-transparent bg-controlBackground-light pl-2 pr-8 text-left text-sm shadow-md hover:border hover:border-controlBorderHighlight-light focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white active:border-controlBorderHighlight-dark ui-open:border-controlActive-light dark:bg-controlBackground-dark dark:hover:border-controlBorderHighlight-dark dark:ui-open:border-controlActive-dark`}
        >
          <div
            className={cn("truncate align-middle", {
              "gradient-mask-r-90": isOverflowing,
            })}
            ref={containerRef}
          >
            {hasValue ? (
              Array.isArray(selected) ? (
                <div
                  className="flex flex-row items-center gap-1"
                  ref={innerRef}
                >
                  {selected.map((s) => {
                    return (
                      <Fragment key={s.value}>
                        {s.inputDisplay ? s.inputDisplay : s.label}
                      </Fragment>
                    );
                  })}
                </div>
              ) : (
                selected?.label
              )
            ) : (
              <div className="text-hint-light dark:text-hint-dark">
                {placeholder}
              </div>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {clearable && hasValue ? (
              <XMarkIcon
                className="h-5 w-5 text-icon-light hover:text-iconHighlight-light dark:text-icon-dark dark:hover:text-iconHighlight-dark"
                onClick={(e) => {
                  e.stopPropagation();
                  multiple ? onChange([]) : onChange(null);
                }}
              />
            ) : (
              <ChevronUpDownIcon
                className="pointer-events-none h-5 w-5 text-icon-light dark:text-icon-dark"
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
            {options.map((option, id) => (
              <Option key={id} option={option} />
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
};
