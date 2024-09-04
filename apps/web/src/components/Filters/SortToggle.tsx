import React, { FC } from "react";
import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
} from "@heroicons/react/24/outline";

import { IconButtonGroup, IconButtonGroupProps } from "../IconButtonGroup";

export const SORT_OPTIONS = [
  { value: "desc", icon: <BarsArrowDownIcon /> },
  { value: "asc", icon: <BarsArrowUpIcon /> },
];

type SortToggleProps = Pick<IconButtonGroupProps, "selected" | "onChange">;

export const SortToggle: FC<SortToggleProps> = function (props) {
  return <IconButtonGroup options={SORT_OPTIONS} {...props} />;
};
