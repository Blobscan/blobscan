import type { FC } from "react";
import React from "react";
import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
} from "@heroicons/react/24/outline";

import type { Sort } from "~/schemas/sort";
import { IconButton } from "../IconButton";

type SortToggleProps = {
  type: Sort;
  onChange: (type: Sort) => void;
};

export const SortToggle: FC<SortToggleProps> = function ({ type, onChange }) {
  return (
    <IconButton
      onClick={() => onChange(type === "asc" ? "desc" : "asc")}
      className="bg-controlBackground-light p-2 shadow-md dark:bg-controlBackground-dark"
    >
      {type === "desc" ? <BarsArrowDownIcon /> : <BarsArrowUpIcon />}
    </IconButton>
  );
};
