import type { ReactNode } from "react";
import React from "react";

import type { Rollup } from "@blobscan/api";

import ArbitrumIcon from "~/icons/arbitrum.svg";
import BaseIcon from "~/icons/base.svg";
import ModeIcon from "~/icons/mode.svg";
import OptimismIcon from "~/icons/optimism.svg";
import StarknetIcon from "~/icons/starknet.svg";
import ZkSyncIcon from "~/icons/zksync.svg";
import ZoraIcon from "~/icons/zora.svg";
import type { Size } from "~/types";
import { capitalize } from "~/utils";
import { Badge } from "./Badge";

const ROLLUP_CONFIG: Record<
  Rollup,
  { style: string; icon: ReactNode; label?: string }
> = {
  ARBITRUM: {
    icon: <ArbitrumIcon />,
    style: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  },
  BASE: {
    icon: <BaseIcon />,
    style: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  OPTIMISM: {
    icon: <OptimismIcon />,
    style:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  STARKNET: {
    icon: <StarknetIcon />,
    style:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  SCROLL: {
    icon: <div />,
    style: "",
  },
  ZKSYNC: {
    icon: <ZkSyncIcon />,
    style: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
    label: "zkSync",
  },
  MODE: {
    icon: <ModeIcon />,
    style: "bg-lime-200 text-[#000000] dark:bg-lime-700 dark:text-[#DFFE00]",
  },
  ZORA: {
    icon: <ZoraIcon />,
    style: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300",
  },
};

type RollupBadgeProps = {
  rollup: Rollup;
  size?: Size;
};

export const RollupBadge: React.FC<RollupBadgeProps> = ({ rollup, size }) => {
  const { icon, style, label } = ROLLUP_CONFIG[rollup];

  return (
    <Badge
      className={style}
      icon={icon}
      label={label ?? capitalize(rollup)}
      size={size}
    />
  );
};
