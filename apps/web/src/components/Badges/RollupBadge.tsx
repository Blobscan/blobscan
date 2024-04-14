import type { ReactNode } from "react";
import React from "react";

import ArbitrumIcon from "~/icons/arbitrum.svg";
import BaseIcon from "~/icons/base.svg";
import LineaIcon from "~/icons/linea.svg";
import ModeIcon from "~/icons/mode.svg";
import OptimismIcon from "~/icons/optimism.svg";
import StarknetIcon from "~/icons/starknet.svg";
import ZkSyncIcon from "~/icons/zksync.svg";
import ZoraIcon from "~/icons/zora.svg";
import type { Rollup, Size } from "~/types";
import { capitalize } from "~/utils";
import { RollupIcon } from "../RollupIcon";
import { Badge } from "./Badge";

const ROLLUP_CONFIG: Record<Rollup, { style: string; label?: string }> = {
  arbitrum: {
    style: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  },
  base: {
    style: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  linea: {
    style: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  },
  optimism: {
    style:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  paradex: {
    style:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  starknet: {
    style:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  scroll: {
    style: "",
  },
  zksync: {
    style: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
    label: "zkSync",
  },
  mode: {
    style: "bg-lime-100 dark:bg-lime-800 text-lime-800 dark:text-lime-300",
  },
  zora: {
    style: "bg-zinc-400 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300",
  },
};

type RollupBadgeProps = {
  rollup: Rollup;
  size?: Size;
};

export const RollupBadge: React.FC<RollupBadgeProps> = ({ rollup, size }) => {
  const { style, label } = ROLLUP_CONFIG[rollup];

  return (
    <Badge
      className={style}
      icon={<RollupIcon rollup={rollup} />}
      label={label ?? capitalize(rollup)}
      size={size}
    />
  );
};
