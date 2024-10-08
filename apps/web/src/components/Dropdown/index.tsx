import type { ReactNode } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/solid";

import { Option } from "./Option";

export interface Option {
  value: string | number;
  label?: ReactNode;
  prefix?: ReactNode;
}
export interface DropdownProps {
  options: Option[];
  selected?: Option | null;
  width?: string;
  placeholder?: string;
  clearable?: boolean;
  onChange(newOption: Option | null): void;
}

const DEFAULT_WIDTH = "w-32";

export const Dropdown: React.FC<DropdownProps> = function ({
  options,
  selected,
  width,
  onChange,
  clearable = false,
  placeholder = "Select an item",
}) {
  return (
    <Listbox value={selected} onChange={onChange}>
      <div className="relative">
        <ListboxButton
          className={`relative h-9 ${
            width ?? DEFAULT_WIDTH
          } flex cursor-pointer items-center justify-between rounded-lg border border-transparent bg-controlBackground-light pl-2 pr-8 text-left text-sm shadow-md hover:border hover:border-controlBorderHighlight-light focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white active:border-controlBorderHighlight-dark ui-open:border-controlActive-light dark:bg-controlBackground-dark dark:hover:border-controlBorderHighlight-dark dark:ui-open:border-controlActive-dark`}
        >
          <div className="truncate align-middle">
            {selected ? (
              selected.label ?? selected.value
            ) : (
              <div className="text-hint-light dark:text-hint-dark">
                {placeholder}
              </div>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {clearable && selected ? (
              <XMarkIcon
                className="h-5 w-5 text-icon-light hover:text-iconHighlight-light dark:text-icon-dark dark:hover:text-iconHighlight-dark"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
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
              <Option {...option} key={id} />
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
};
