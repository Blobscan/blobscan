import { Listbox } from "../Selects";
import type { ListboxProps, SelectOption } from "../Selects";

export const SECTION_NAMES = [
  "all",
  "blob",
  "block",
  "gas",
  "fee",
  "transaction",
] as const;

export type SectionName = (typeof SECTION_NAMES)[number];

export type SectionOption = SelectOption<SectionName>;

export const SECTION_OPTIONS: [SectionOption, ...SectionOption[]] = [
  { label: "All Stats", value: "all" },
  { label: "Blobs", value: "blob" },
  { label: "Blocks", value: "block" },
  { label: "Gas", value: "gas" },
  { label: "Fees", value: "fee" },
  { label: "Transactions", value: "transaction" },
] as const;

export const DEFAULT_SECTION = SECTION_OPTIONS[0];

export type StatsSectionSelectorProps = Omit<
  ListboxProps<SectionName, false, false>,
  "options" | "multiple" | "nullable" | "placeholder"
>;

export function StatsSectionSelector(props: StatsSectionSelectorProps) {
  return <Listbox {...props} options={SECTION_OPTIONS} />;
}
