import React from "react";

import type { Rollup } from "~/types";
import { capitalize } from "~/utils";
import { RollupIcon } from "../RollupIcon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

const ROLLUP_CONFIG: Record<Rollup, { style: string; label?: string }> = {
  arbitrum: {
    style: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  },
  base: {
    style: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  blast: {
    style:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-50",
  },
  boba: {
    style: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
  },
  camp: {
    style:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-50",
  },
  kroma: {
    style: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-50",
  },
  linea: {
    style: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
  },
  metal: {
    style: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
  },
  mode: {
    style: "bg-lime-100 dark:bg-lime-800 text-lime-800 dark:text-lime-300",
  },
  optimism: {
    style:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  },
  optopia: {
    style: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
  paradex: {
    style:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  pgn: {
    style: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
    label: "PGN",
  },
  starknet: {
    style:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  scroll: {
    style: "bg-amber-100 text-slate-950 dark:bg-slate-900 dark:text-slate-50",
  },
  taiko: {
    style: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
  },
  zksync: {
    style: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
    label: "zkSync",
  },
  zora: {
    style:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
};

type RollupBadgeProps = BadgeProps & {
  rollup: Rollup;
};

export const RollupBadge: React.FC<RollupBadgeProps> = ({
  rollup,
  ...props
}) => {
  const { style, label } = ROLLUP_CONFIG[rollup];

  return (
    <Badge className={style} {...props}>
      <RollupIcon rollup={rollup} />
      {label ?? capitalize(rollup)}
    </Badge>
  );
};
