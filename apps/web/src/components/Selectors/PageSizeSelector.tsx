import { PAGE_SIZES } from "~/schemas/pagination";
import type { ListboxProps } from "../Selects";
import { Listbox } from "../Selects";
import type { SelectOption } from "../Selects";

export type PageSizeOption = SelectOption<number>;

export const PAGE_SIZES_OPTIONS: PageSizeOption[] = PAGE_SIZES.map((value) => ({
  value,
}));

export type PageSizeSelectorProps = Omit<
  ListboxProps<number, false, false>,
  "options" | "multiple" | "nullable" | "placeholder"
>;

export function PageSizeSelector(props: PageSizeSelectorProps) {
  return <Listbox {...props} options={PAGE_SIZES_OPTIONS} />;
}
