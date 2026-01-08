import type { Category } from "~/types";
import { Listbox } from "../Selects";
import type { SelectOption, TMultiple, ListboxProps } from "../Selects";

export type CategorySelectorOption = SelectOption<Category>;

export type CategorySelectorProps<M extends TMultiple = false> = Omit<
  ListboxProps<Category, M, true>,
  "options" | "nullable" | "placeholder"
>;

const CATEGORIES: CategorySelectorOption[] = [
  { value: "rollup", label: "Rollup" },
  { value: "other", label: "Other" },
];

export function CategorySelector<M extends TMultiple = false>(
  props: CategorySelectorProps<M>
) {
  return (
    <Listbox {...props} options={CATEGORIES} placeholder="Category" nullable />
  );
}
