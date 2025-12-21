import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import cn from "classnames";

import { DropdownLayout, OptionLayout } from "./BaseDropdown";
import type {
  BaseDropdownProps,
  Option,
  SelectedOption,
  TMultiple,
  TNullable,
  TValue,
} from "./BaseDropdown";

export type ComboboxProps<
  T extends TValue,
  M extends TMultiple,
  N extends TNullable
> = BaseDropdownProps<T, M, N>;

export function Combobox<
  T extends TValue,
  M extends TMultiple = false,
  N extends TNullable = false
>({
  options,
  selected,
  onChange,
  disabled,
  multiple,
  nullable,
  placeholder,
}: ComboboxProps<T, M, N>) {
  const [query, setQuery] = useState("");
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const selectedOptRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionSelected = Array.isArray(selected)
    ? selected.length > 0
    : !!selected;
  const displayInput = multiple || !optionSelected;

  useEffect(() => {
    if (activeTagIndex == null) return;

    const tagRef = selectedOptRefs.current[activeTagIndex];

    if (!tagRef) {
      return;
    }

    tagRef.focus();
    tagRef.scrollIntoView({
      inline: "center",
      block: "center",
    });
  }, [activeTagIndex]);

  const filtered = useMemo(() => {
    const queryWords = query.trim().toLowerCase().split(" ");

    return options.filter((o) => {
      if (!queryWords) {
        return true;
      }

      return queryWords.every((w) => String(o.value).toLowerCase().includes(w));
    });
  }, [options, query]);

  function removeOption(opt: Option<T>) {
    if (!selected) return;

    let newOptions: SelectedOption<T, M, N>;

    if (Array.isArray(selected)) {
      newOptions = selected.filter(
        (s) => s.value !== opt.value
      ) as SelectedOption<T, M, N>;
    } else {
      newOptions = null as SelectedOption<T, M, N>;
    }

    onChange(newOptions);
  }

  function handleChange(newOptions: SelectedOption<T, M, N>) {
    setQuery("");

    if (!Array.isArray(newOptions) && selected === newOptions) {
      onChange(null as SelectedOption<T, M, N>);
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({
      inline: "center",
      block: "center",
    });
    onChange(newOptions);
  }

  function clearAll() {
    const newOption: SelectedOption<T, M, N> = (
      multiple ? [] : null
    ) as SelectedOption<T, M, N>;

    onChange(newOption);
    setQuery("");
  }

  function focusInputToEnd() {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  }

  return (
    <HeadlessCombobox
      ref={comboboxRef}
      multiple={multiple}
      disabled={disabled}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      value={selected}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onChange={handleChange}
      onClose={() => {
        setQuery("");
      }}
    >
      <DropdownLayout
        toggleAs={ComboboxButton}
        showClear={Boolean(optionSelected && nullable)}
        onClear={clearAll}
        disabled={disabled}
        optionsPanel={
          <ComboboxOptions className="h-full">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 dark:text-white/60">
                No results
              </div>
            ) : (
              filtered.map((opt) => (
                <ComboboxOption key={opt.value} value={opt}>
                  {({ selected, focus }) => (
                    <OptionLayout
                      option={opt}
                      selected={selected}
                      focused={focus}
                    />
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        }
      >
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onMouseDown={() => {
            inputRef.current?.focus();
          }}
          onBlur={() => {
            setActiveTagIndex(null);
            const tagRef = selectedOptRefs.current[0];

            if (!tagRef) {
              return;
            }

            tagRef.scrollIntoView({
              inline: "center",
              block: "center",
            });
          }}
        >
          <div className="flex flex-row items-center gap-2">
            {Array.isArray(selected)
              ? selected?.map((opt, i) => (
                  <button
                    key={opt.value}
                    ref={(el) => {
                      selectedOptRefs.current[i] = el;
                    }}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      inputRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                      switch (e.key) {
                        case "ArrowLeft":
                          e.preventDefault();

                          setActiveTagIndex(Math.max(i - 1, 0));
                          break;
                        case "ArrowRight": {
                          e.preventDefault();

                          if (i < selected.length - 1) {
                            setActiveTagIndex(i + 1);
                          } else {
                            setActiveTagIndex(null);
                            focusInputToEnd();
                          }
                          break;
                        }
                        case "Backspace":
                        case "Delete": {
                          e.preventDefault();
                          const removedIndex = i;
                          const removed = Array.isArray(selected)
                            ? selected[removedIndex]
                            : selected;
                          if (!removed) return;

                          removeOption(removed as unknown as Option<T>);

                          setTimeout(() => {
                            if (
                              selected.length === 1 ||
                              removedIndex === selected.length - 1
                            ) {
                              focusInputToEnd();
                              setActiveTagIndex(null);

                              return;
                            }

                            setActiveTagIndex(removedIndex);
                            selectedOptRefs.current[removedIndex]?.focus();
                          }, 0);

                          break;
                        }
                        default:
                          inputRef.current?.focus();
                          break;
                      }
                    }}
                    className={cn(
                      "focus:rounded-lg focus:ring-2 focus:ring-indigo-500"
                    )}
                  >
                    {opt.label}
                  </button>
                ))
              : selected?.label}

            {displayInput && (
              <ComboboxInput
                ref={inputRef}
                className={cn(
                  "h-6 border-none bg-transparent text-sm outline-none focus:outline-none focus:ring-0"
                )}
                value={query}
                placeholder={
                  Array.isArray(selected) && selected.length > 0
                    ? ""
                    : placeholder
                }
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onFocus={() => {
                  setActiveTagIndex(null);
                }}
                onKeyDown={(e) => {
                  const el = e.currentTarget;
                  const caretAtStart =
                    el.selectionStart === 0 && el.selectionEnd === 0;

                  if (
                    e.key === "ArrowLeft" &&
                    caretAtStart &&
                    optionSelected &&
                    Array.isArray(selected)
                  ) {
                    e.preventDefault();

                    inputRef.current?.blur();

                    setActiveTagIndex(selected.length - 1);

                    return;
                  }

                  if (
                    e.key === "Backspace" &&
                    query.length === 0 &&
                    optionSelected &&
                    Array.isArray(selected)
                  ) {
                    e.preventDefault();

                    const lastOption = selected[selected.length - 1];

                    if (lastOption) removeOption(lastOption);

                    return;
                  }
                }}
              />
            )}
          </div>
        </div>
      </DropdownLayout>
    </HeadlessCombobox>
  );
}
