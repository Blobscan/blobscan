import { useRef } from "react";
import type { FC } from "react";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps, Option } from "~/components/Dropdown";

export type RollupOption = Option<string>;

type RollupFilterProps = Pick<
  DropdownProps<string, true, true>,
  "selected" | "disabled" | "options" | "onChange"
>;

export const RollupFilter: FC<RollupFilterProps> = function ({
  onChange,
  selected,
  disabled,
  options,
}) {
  const noneIsSelected = useRef<boolean>(false);

  const handleOnChange = (newRollups_: RollupOption[] | null) => {
    let newRollups = newRollups_ ? newRollups_ : [];

    const noneOptionIndex = newRollups.findIndex((r) => r.value === "null");

    if (noneIsSelected.current && newRollups.length > 1) {
      noneIsSelected.current = false;
      newRollups = newRollups.filter((_, index) => index !== noneOptionIndex);
    }

    if (
      !noneIsSelected.current &&
      noneOptionIndex !== -1 &&
      newRollups.length > 1
    ) {
      noneIsSelected.current = true;
      newRollups = newRollups.filter((_, index) => index === noneOptionIndex);
    }

    onChange(newRollups);
  };

  return (
    <Dropdown
      selected={selected}
      options={options}
      onChange={handleOnChange}
      placeholder="Rollup"
      width="w-[120px] min-[440px]:w-[180px] min-[540px]:w-[260px] min-[580px]:w-[280px] sm:w-[170px] md:w-[110px] lg:w-[180px] xl:w-[200px]"
      disabled={disabled}
      clearable
      multiple
    />
  );
};
