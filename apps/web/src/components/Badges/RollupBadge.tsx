import type { ReactNode } from "react";
import React from "react";

import type { Rollup } from "@blobscan/api";

import ArbitrumIcon from "~/icons/arbitrum.svg";
import BaseIcon from "~/icons/base.svg";
import OptimismIcon from "~/icons/optimism.svg";
import StarknetIcon from "~/icons/starknet.svg";
import { Size } from "~/types";
import { capitalize } from "~/utils";
import { Badge } from "./Badge";

const ROLLUP_CONFIG: Record<Rollup, { style: string; icon: ReactNode }> = {
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
    icon: <div />,
    style: "",
  },
};

type RollupBadgeProps = {
  rollup: Rollup;
  size?: Size;
};

export const RollupBadge: React.FC<RollupBadgeProps> = ({ rollup, size }) => {
  const { icon, style } = ROLLUP_CONFIG[rollup];

  return (
    <Badge
      className={style}
      icon={icon}
      label={capitalize(rollup)}
      size={size}
    />
  );
};
