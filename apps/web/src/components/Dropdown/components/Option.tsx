import { ListboxOption } from "@headlessui/react";

import type { Option as OptionProps } from "../Dropdown";

export const Option: React.FC<OptionProps> = function ({ label, value }) {
  return (
    <ListboxOption
      className={({ focus }) =>
        `relative cursor-pointer select-none py-2 pl-4 pr-4 font-normal ${
          focus
            ? "bg-controlActive-light dark:bg-controlActive-dark dark:text-content-dark"
            : "text-contentSecondary-light dark:text-contentSecondary-dark"
        }`
      }
      value={value}
    >
      {({ selected }) => (
        <div className="flex items-center">
          <span
            className={`block truncate text-sm ${selected ? "font-bold" : ""}`}
          >
            {label}
          </span>
        </div>
      )}
    </ListboxOption>
  );
};
