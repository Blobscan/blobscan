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
import type { Category, Size } from "~/types";
import { capitalize } from "~/utils";

export type CategoryIconProps = {
  category: Required<Category>;
  size?: Size;
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = "md",
}) => {
  const commonStyles = classNames({
    "h-3 w-3": size === "sm",
    "h-4 w-4": size === "md",
    "h-5 w-5": size === "lg",
  });
  const categoryLabel = capitalize(category);
  let categoryIcon;

  switch (category) {
    case "arbitrum":
      categoryIcon = (
        <ArbitrumIcon
          className={`${commonStyles} text-[#1b4add] dark:text-[#ffffff]`}
        />
      );
      break;
    case "base":
      categoryIcon = <BaseIcon className={commonStyles} />;
      break;
    case "blast":
      categoryIcon = (
        <BlastIcon
          className={`${commonStyles} rounded bg-black dark:bg-opacity-0`}
        />
      );
      break;
    case "boba":
      categoryIcon = <BobaIcon className={commonStyles} />;
      break;
    case "camp":
      categoryIcon = null;
      break;
    case "kroma":
      categoryIcon = <KromaIcon className={commonStyles} />;
      break;
    case "linea":
      categoryIcon = <LineaIcon className={"h-3.5 w-3.5"} />;
      break;
    case "metal":
      categoryIcon = <MetalIcon className={commonStyles} />;
      break;
    case "mode":
      categoryIcon = (
        <ModeIcon className="h-5 w-5 text-[#ceb245] dark:text-[#ffd940]" />
      );
      break;
    case "optimism":
      categoryIcon = <OptimismIcon className={commonStyles} />;
      break;
    case "optopia":
      categoryIcon = <OptopiaIcon className={commonStyles} />;
      break;
    case "paradex":
      categoryIcon = null;
      break;
    case "pgn":
      categoryIcon = <PGNIcon className={commonStyles} />;
      break;
    case "starknet":
      categoryIcon = <StarknetIcon className={commonStyles} />;
      break;
    case "scroll":
      categoryIcon = <ScrollIcon className={commonStyles} />;
      break;
    case "taiko":
      categoryIcon = <TaikoIcon className={commonStyles} />;
      break;
    case "zksync":
      categoryIcon = <ZkSyncIcon className={commonStyles} />;
      break;
    case "zora":
      categoryIcon = <ZoraIcon className={commonStyles} />;
      break;
  }

  return <div title={categoryLabel}>{categoryIcon}</div>;
};
