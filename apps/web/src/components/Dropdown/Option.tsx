import { ListboxOption } from "@headlessui/react";

import type { Option as OptionProps } from ".";

export const Option: React.FC<OptionProps> = function (props) {
  const { prefix, label, value } = props;
  return (
    <ListboxOption
      className={({ focus }) =>
        `relative cursor-pointer select-none px-4 py-2 ${
          focus
            ? "bg-controlActive-light dark:bg-controlActive-dark dark:text-content-dark"
            : "text-contentSecondary-light dark:text-contentSecondary-dark"
        }`
      }
      value={props}
    >
      {({ selected }) => (
        <div className="flex items-center gap-3">
          {prefix && prefix}
          <span
            className={`block truncate text-sm ${selected ? "font-bold" : ""}`}
          >
            {label ? label : value}
          </span>
        </div>
      )}
    </ListboxOption>
  );
};
