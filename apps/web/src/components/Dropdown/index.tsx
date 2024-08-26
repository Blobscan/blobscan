import type { ReactNode } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";

import { Option } from "./Option";

export interface Option {
  value: string | number;
  label?: ReactNode;
  prefix?: React.ReactNode;
}

export interface DropdownProps {
  options: Option[];
  selected: Option | null;
  width?: string;
  height?: string;
  placeholder?: string;
  onChange(newOption: Option): void;
}

const DEFAULT_WIDTH = "w-32";
const DEFAULT_HEIGHT = "h-9";

export const Dropdown: React.FC<DropdownProps> = function ({
  options,
  selected,
  width,
  height,
  onChange,
  placeholder = "Select",
}) {
  return (
    <Listbox value={selected} onChange={onChange}>
      <div className="relative">
        <ListboxButton
          className={`relative ${height ?? DEFAULT_HEIGHT} ${
            width ?? DEFAULT_WIDTH
          } cursor-pointer rounded-lg border border-transparent bg-controlBackground-light pl-2 pr-8 text-left text-sm shadow-md hover:border hover:border-controlBackground-light focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white active:border-controlBorderHighlight-dark ui-open:border-controlActive-light dark:bg-controlBackground-dark dark:hover:border-controlBorderHighlight-dark dark:ui-open:border-controlActive-dark`}
        >
          <span className="block truncate align-middle font-normal">
            {selected
              ? selected.label
                ? selected.label
                : selected.value
              : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-icon-light dark:text-icon-dark"
              aria-hidden="true"
            />
          </span>
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
