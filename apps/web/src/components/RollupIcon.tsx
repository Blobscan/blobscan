import classNames from "classnames";

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

export type RollupIconProps = {
  rollup: Required<Rollup>;
  size?: Size;
};

export const RollupIcon: React.FC<RollupIconProps> = ({
  rollup,
  size = "md",
}) => {
  const commonStyles = classNames({
    "h-3 w-3": size === "sm",
    "h-4 w-4": size === "md",
    "h-5 w-5": size === "lg",
  });
  const rollupLabel = capitalize(rollup);
  let rollupIcon;

  switch (rollup) {
    case "arbitrum":
      rollupIcon = (
        <ArbitrumIcon
          className={`${commonStyles} text-[#1b4add] dark:text-[#8395cc]`}
        />
      );
      break;
    case "base":
      rollupIcon = <BaseIcon className={commonStyles} />;
      break;
    case "linea":
      rollupIcon = <LineaIcon className={"h-3.5 w-3.5"} />;
      break;
    case "optimism":
      rollupIcon = <OptimismIcon className={commonStyles} />;
      break;
    case "paradex":
      rollupIcon = null;
      break;
    case "starknet":
      rollupIcon = <StarknetIcon className={commonStyles} />;
      break;
    case "scroll":
      rollupIcon = <div />;
      break;
    case "zksync":
      rollupIcon = <ZkSyncIcon className={commonStyles} />;
      break;
    case "mode":
      rollupIcon = (
        <ModeIcon className="h-5 w-5 text-[#ceb245] dark:text-[#ffd940]" />
      );
      break;
    case "zora":
      rollupIcon = <ZoraIcon className={commonStyles} />;
      break;
  }

  return <div title={rollupLabel}>{rollupIcon}</div>;
};
