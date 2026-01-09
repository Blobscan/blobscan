import type { Category } from "~/types";
import { Listbox } from "../Selects";
import type { SelectOption, TMultiple, ListboxProps } from "../Selects";

export type CategorySelectorOption = SelectOption<Category>;

export type CategorySelectorProps<M extends TMultiple = false> = Omit<
  ListboxProps<Category, M, true>,
  "options" | "nullable" | "placeholder"
>;

export const CATEGORY_OPTIONS: CategorySelectorOption[] = [
  { value: "other", label: "Other" },
  { value: "rollup", label: "Rollup" },
] as const;

export function CategorySelector<M extends TMultiple = false>(
  props: CategorySelectorProps<M>
) {
  return (
    <Listbox
      {...props}
      options={CATEGORY_OPTIONS}
      placeholder="Category"
      nullable
    />
  );
}
