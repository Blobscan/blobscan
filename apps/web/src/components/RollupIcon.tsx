import classNames from "classnames";

import ArbitrumIcon from "~/icons/arbitrum.svg";
import BaseIcon from "~/icons/base.svg";
import BlastIcon from "~/icons/blast.svg";
import BobaIcon from "~/icons/boba.svg";
import KromaIcon from "~/icons/kroma.svg";
import LineaIcon from "~/icons/linea.svg";
import MetalIcon from "~/icons/metal.svg";
import ModeIcon from "~/icons/mode.svg";
import OptimismIcon from "~/icons/optimism.svg";
import OptopiaIcon from "~/icons/optopia.svg";
import PGNIcon from "~/icons/pgn.svg";
import ScrollIcon from "~/icons/scroll.svg";
import StarknetIcon from "~/icons/starknet.svg";
import TaikoIcon from "~/icons/taiko.svg";
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
          className={`${commonStyles} text-[#1b4add] dark:text-[#ffffff]`}
        />
      );
      break;
    case "base":
      rollupIcon = <BaseIcon className={commonStyles} />;
      break;
    case "blast":
      rollupIcon = (
        <BlastIcon
          className={`${commonStyles} rounded bg-black dark:bg-opacity-0`}
        />
      );
      break;
    case "boba":
      rollupIcon = <BobaIcon className={commonStyles} />;
      break;
    case "camp":
      rollupIcon = null;
      break;
    case "kroma":
      rollupIcon = <KromaIcon className={commonStyles} />;
      break;
    case "linea":
      rollupIcon = <LineaIcon className={"h-3.5 w-3.5"} />;
      break;
    case "metal":
      rollupIcon = <MetalIcon className={commonStyles} />;
      break;
    case "mode":
      rollupIcon = (
        <ModeIcon className="h-5 w-5 text-[#ceb245] dark:text-[#ffd940]" />
      );
      break;
    case "optimism":
      rollupIcon = <OptimismIcon className={commonStyles} />;
      break;
    case "optopia":
      rollupIcon = <OptopiaIcon className={commonStyles} />;
      break;
    case "paradex":
      rollupIcon = null;
      break;
    case "pgn":
      rollupIcon = <PGNIcon className={commonStyles} />;
      break;
    case "starknet":
      rollupIcon = <StarknetIcon className={commonStyles} />;
      break;
    case "scroll":
      rollupIcon = <ScrollIcon className={commonStyles} />;
      break;
    case "taiko":
      rollupIcon = <TaikoIcon className={commonStyles} />;
      break;
    case "zksync":
      rollupIcon = <ZkSyncIcon className={commonStyles} />;
      break;
    case "zora":
      rollupIcon = <ZoraIcon className={commonStyles} />;
      break;
  }

  return (
    <div title={rollupLabel}>
      {rollupIcon === null ? <div className={commonStyles}></div> : rollupIcon}
    </div>
  );
};
