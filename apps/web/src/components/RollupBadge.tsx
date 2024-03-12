import type { ReactNode } from "react";
import React from "react";

import ArbitrumIcon from "~/icons/arbitrum.svg";
import BaseIcon from "~/icons/base.svg";
import OptimismIcon from "~/icons/optimism.svg";
import StarknetIcon from "~/icons/starknet.svg";

type RollupMapping = {
  [rollup: string]: {
    tag: ReactNode;
  };
};

const rollupMapping: RollupMapping = {
  arbitrum: {
    tag: (
      <span className="me-2 rounded-full bg-sky-100 px-2.5 py-0.5 text-sky-800 dark:bg-sky-900 dark:text-sky-300">
        <div className="flex items-center">
          <ArbitrumIcon />
          <div className="ml-2">Arbitrum</div>
        </div>
      </span>
    ),
  },
  base: {
    tag: (
      <span className="me-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        <div className="flex items-center">
          <BaseIcon />
          <div className="ml-2">Base</div>
        </div>
      </span>
    ),
  },
  optimism: {
    tag: (
      <span className="me-2 rounded-full bg-red-100 px-2.5 py-0.5 text-red-800 dark:bg-red-900 dark:text-red-300">
        <div className="flex items-center">
          <OptimismIcon />
          <div className="ml-2">Optimism</div>
        </div>
      </span>
    ),
  },
  starknet: {
    tag: (
      <span className="me-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
        <div className="flex items-center">
          <StarknetIcon />
          <div className="ml-2">Starknet</div>
        </div>
      </span>
    ),
  },
};

const RollupBadge = ({ rollup }: { rollup: string }) => {
  const { tag } = rollupMapping[rollup.toLowerCase()] ?? {};

  if (!tag) {
    return null;
  }

  return <div className="flex">{tag}</div>;
};

export default RollupBadge;
