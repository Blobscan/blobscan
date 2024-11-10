import { ListboxOption } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";

import type { Option as OptionType } from ".";

interface OptionProps {
  option: OptionType;
}

export const Option: React.FC<OptionProps> = function ({ option }) {
  const { prefix, label, value } = option;
  const formattedValue = Array.isArray(value) ? value.join(", ") : value;

  return (
    <ListboxOption
      className={`relative cursor-pointer select-none px-4 py-2 text-contentSecondary-light hover:bg-controlActive-light data-[selected]:font-semibold data-[selected]:text-content-light dark:text-contentSecondary-dark  hover:dark:bg-controlActive-dark data-[selected]:dark:font-semibold data-[selected]:dark:text-content-dark`}
      value={option}
    >
      {({ selected }) => (
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-row items-center gap-2">
            {prefix && prefix}
            <span className="block truncate text-sm">
              {label ? label : formattedValue}
            </span>
          </div>
          {selected && (
            <CheckIcon
              className="group pointer-events-none absolute right-2.5 top-2.5 size-4"
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </ListboxOption>
  );
};
