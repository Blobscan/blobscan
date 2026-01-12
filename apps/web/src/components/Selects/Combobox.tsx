import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import cn from "classnames";

import { SelectLayout, OptionLayout } from "./SelectLayout";
import type {
  BaseSelectProps,
  SelectOption,
  SelectedOption,
  TMultiple,
  TNullable,
  TValue,
} from "./SelectLayout";

export type ComboboxProps<
  T extends TValue,
  M extends TMultiple,
  N extends TNullable
> = BaseSelectProps<T, M, N>;

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
  const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(
    null
  );
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const selectedOptRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionOrOptionsSelected = Array.isArray(selected)
    ? selected.length > 0
    : !!selected;
  const displayInput = multiple || !optionOrOptionsSelected;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  function scrollToInput({
    scrollBehavior = "instant",
  }: {
    scrollBehavior?: "smooth" | "instant";
  } = {}) {
    requestAnimationFrame(() => {
      const container = containerRef.current;
      const input = inputRef.current;
      const optionsContainer = optionsRef.current;
      if (!container || !input || !optionsContainer) return;

      const inputRect = input.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      input.focus();

      const peekPx = containerRect.width / 2.5;
      const padding = 20;
      const isInputVisible =
        inputRect.left > containerRect.left + padding &&
        inputRect.left < containerRect.right - padding;

      if (isInputVisible) {
        return;
      }

      const selectedOptionsWidth = container.scrollWidth - input.scrollWidth;
      const target = Math.max(0, selectedOptionsWidth - peekPx);

      container.scrollTo({
        left: target,
        behavior: scrollBehavior,
      });
    });
  }

  useEffect(() => {
    if (activeOptionIndex == null) return;

    const selectedOptionRef = selectedOptRefs.current[activeOptionIndex];

    if (!selectedOptionRef) {
      return;
    }

    selectedOptionRef.focus();
    selectedOptionRef.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [activeOptionIndex]);

  const filtered = useMemo(() => {
    const queryWords = query.trim().toLowerCase().split(" ");

    return options.filter((o) => {
      if (!queryWords) {
        return true;
      }

      return queryWords.every((w) => String(o.value).toLowerCase().includes(w));
    });
  }, [options, query]);

  function removeOption(opt: SelectOption<T>) {
    if (!selected) return;

    let newOptions: SelectedOption<T, M, N>;

    if (Array.isArray(selected)) {
      newOptions = selected.filter(
        (s) => s.value !== opt.value
      ) as SelectedOption<T, M, N>;
    } else {
      newOptions = null as SelectedOption<T, M, N>;
    }

    scrollToInput({ scrollBehavior: "smooth" });

    onChange(newOptions);
  }

  function handleChange(newOptions: SelectedOption<T, M, N>) {
    setQuery("");

    if (!Array.isArray(newOptions) && selected === newOptions) {
      onChange(null as SelectedOption<T, M, N>);
      return;
    }

    scrollToInput({ scrollBehavior: "smooth" });
    onChange(newOptions);
  }

  function clearAll() {
    const newOption: SelectedOption<T, M, N> = (
      multiple ? [] : null
    ) as SelectedOption<T, M, N>;

    onChange(newOption);
    setQuery("");
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
      <SelectLayout
        ref={containerRef}
        toggleAs={ComboboxButton}
        showClear={Boolean(optionOrOptionsSelected && nullable)}
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
            scrollToInput();
          }}
          onBlur={() => {
            setActiveOptionIndex(null);
            const firstSelectedOptionRef = selectedOptRefs.current[0];

            if (!firstSelectedOptionRef) {
              return;
            }

            firstSelectedOptionRef.scrollIntoView({
              block: "nearest",
              inline: "center",
            });
          }}
        >
          <div className="flex flex-row items-center gap-2">
            <div ref={optionsRef} className="flex flex-row items-center gap-2">
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
                        scrollToInput();
                      }}
                      onKeyDown={(e) => {
                        switch (e.key) {
                          case "ArrowLeft":
                            e.preventDefault();

                            setActiveOptionIndex(Math.max(i - 1, 0));
                            break;
                          case "ArrowRight": {
                            e.preventDefault();

                            if (i < selected.length - 1) {
                              setActiveOptionIndex(i + 1);
                            } else {
                              scrollToInput();
                              setActiveOptionIndex(null);
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

                            removeOption(removed as unknown as SelectOption<T>);

                            setTimeout(() => {
                              if (
                                selected.length === 1 ||
                                removedIndex === selected.length - 1
                              ) {
                                scrollToInput();
                                setActiveOptionIndex(null);

                                return;
                              }

                              setActiveOptionIndex(removedIndex);
                              selectedOptRefs.current[removedIndex]?.focus();
                            }, 0);

                            break;
                          }
                          default:
                            scrollToInput();
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
            </div>

            {displayInput && (
              <ComboboxInput
                ref={inputRef}
                className={cn(
                  "h-6 border-none bg-transparent text-sm outline-none placeholder:text-hint-light focus:outline-none focus:ring-0 dark:placeholder:text-hint-dark"
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
                  setActiveOptionIndex(null);
                }}
                onKeyDown={(e) => {
                  const el = e.currentTarget;
                  const caretAtStart =
                    el.selectionStart === 0 && el.selectionEnd === 0;

                  if (
                    e.key === "ArrowLeft" &&
                    caretAtStart &&
                    optionOrOptionsSelected &&
                    Array.isArray(selected)
                  ) {
                    e.preventDefault();

                    inputRef.current?.blur();

                    setActiveOptionIndex(selected.length - 1);

                    return;
                  }

                  if (
                    e.key === "Backspace" &&
                    query.length === 0 &&
                    optionOrOptionsSelected &&
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
      </SelectLayout>
    </HeadlessCombobox>
  );
}
