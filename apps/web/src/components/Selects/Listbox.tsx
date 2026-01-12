import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import cn from "classnames";

import { SelectLayout, OptionLayout } from "./SelectLayout";
import type {
  BaseSelectProps,
  SelectedOption,
  TMultiple,
  TNullable,
  TValue,
} from "./SelectLayout";

export type ListboxProps<
  T extends TValue,
  M extends TMultiple,
  N extends TNullable
> = BaseSelectProps<T, M, N>;

export function Listbox<
  T extends TValue,
  M extends TMultiple = false,
  N extends TNullable = false
>({
  options,
  selected,
  multiple,
  onChange,
  nullable,
  disabled,
  placeholder = "Select an item",
}: ListboxProps<T, M, N>) {
  const optionSelected = Array.isArray(selected)
    ? selected.length > 0
    : !!selected;

  function clearAll() {
    const newOption: SelectedOption<T, M, N> = (
      multiple ? [] : null
    ) as SelectedOption<T, M, N>;

    onChange(newOption);
  }
  return (
    <HeadlessListbox
      value={selected}
      onChange={onChange}
      multiple={multiple}
      disabled={disabled}
    >
      <SelectLayout
        as={ListboxButton}
        showClear={Boolean(optionSelected && nullable)}
        onClear={clearAll}
        optionsPanel={
          <ListboxOptions className="h-full">
            {options.map((opt) => (
              <ListboxOption key={String(opt.value)} value={opt}>
                {({ focus }) => {
                  const isSelected = selected
                    ? Array.isArray(selected)
                      ? selected.includes(opt)
                      : selected?.value === opt.value
                    : false;

                  return (
                    <OptionLayout
                      option={opt}
                      selected={isSelected}
                      focused={focus}
                    />
                  );
                }}
              </ListboxOption>
            ))}
          </ListboxOptions>
        }
      >
        {optionSelected ? (
          Array.isArray(selected) ? (
            <div className="flex flex-row items-center gap-1 align-middle">
              {selected.map(({ label, value }, i) => {
                return <Fragment key={i}>{label ?? value}</Fragment>;
              })}
            </div>
          ) : selected?.label ? (
            selected.label
          ) : (
            (selected?.value as ReactNode)
          )
        ) : (
          <div
            className={cn(
              "w-full text-ellipsis whitespace-nowrap text-hint-light dark:text-hint-dark",
              {
                "text-opacity-40 dark:text-opacity-40": disabled,
              }
            )}
          >
            {placeholder}
          </div>
        )}
      </SelectLayout>
    </HeadlessListbox>
  );
}
