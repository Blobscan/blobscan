import type { ReactNode } from "react";
import React from "react";

import ArbitrumIcon from "~/icons/arbitrum.svg";
import BaseIcon from "~/icons/base.svg";
import OptimismIcon from "~/icons/optimism.svg";
import StarknetIcon from "~/icons/starknet.svg";
import Badge from "./Badge";

type RollupToBadge = {
  [rollup: string]: ReactNode;
};

const ROLLUP_BADGES: RollupToBadge = {
  arbitrum: <Badge label="Arbitrum" icon={<ArbitrumIcon />} color="sky" />,
  base: <Badge label="Base" icon={<BaseIcon />} color="blue" />,
  optimism: <Badge label="Optimism" icon={<OptimismIcon />} color="orange" />,
  starknet: <Badge label="Starknet" icon={<StarknetIcon />} color="purple" />,
};

const RollupBadge = ({ rollup }: { rollup: string }) => {
  const badge = ROLLUP_BADGES[rollup.toLowerCase()];

  return <div className="flex">{badge}</div>;
};

export default RollupBadge;
