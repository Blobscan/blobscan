import Image from "next/image";
import classNames from "classnames";

import AbstractIcon from "~/icons/abstract.svg";
import ArbitrumIcon from "~/icons/arbitrum.svg";
import ArenaZIcon from "~/icons/arenaz.svg";
import BaseIcon from "~/icons/base.svg";
import BlastIcon from "~/icons/blast.svg";
import BobIcon from "~/icons/bob.svg";
import BobaIcon from "~/icons/boba.svg";
import CampIcon from "~/icons/camp.svg";
import DebankIcon from "~/icons/debank.svg";
import EthernityIcon from "~/icons/ethernity.svg";
import FuelIcon from "~/icons/fuel.svg";
import HashkeyIcon from "~/icons/hashkey.svg";
import InkIcon from "~/icons/ink.svg";
import KintoIcon from "~/icons/kinto.svg";
import KromaIcon from "~/icons/kroma.svg";
import lambdaIconSrc from "~/icons/lambda.png";
import LineaIcon from "~/icons/linea.svg";
import LiskIcon from "~/icons/lisk.svg";
import MetalIcon from "~/icons/metal.svg";
import MintIcon from "~/icons/mint.svg";
import ModeIcon from "~/icons/mode.svg";
import MorphIcon from "~/icons/morph.svg";
import NalIcon from "~/icons/nal.svg";
import OptimismIcon from "~/icons/optimism.svg";
import OptopiaIcon from "~/icons/optopia.svg";
import ParadexIcon from "~/icons/paradex.svg";
import PGNIcon from "~/icons/pgn.svg";
import PolynomialIcon from "~/icons/polynomial.svg";
import RaceIcon from "~/icons/race.svg";
import RiverIcon from "~/icons/river.svg";
import ScrollIcon from "~/icons/scroll.svg";
import ShapeIcon from "~/icons/shape.svg";
import SnaxchainIcon from "~/icons/snaxchain.svg";
import SoneiumIcon from "~/icons/soneium.svg";
import StarknetIcon from "~/icons/starknet.svg";
import SuperlumioIcon from "~/icons/superlumio.svg";
import SuperSeedIcon from "~/icons/superseed.svg";
import SwanchainIcon from "~/icons/swanchain.svg";
import SwellchainIcon from "~/icons/swellchain.svg";
import TaikoIcon from "~/icons/taiko.svg";
import TheBinaryHoldingsIcon from "~/icons/thebinaryholdings.svg";
import UnichainIcon from "~/icons/unichain.svg";
import WorldIcon from "~/icons/world.svg";
import ZeroNetworkIcon from "~/icons/zeronetwork.svg";
import ZircuitIcon from "~/icons/zircuit.svg";
import ZkSyncIcon from "~/icons/zksync.svg";
import ZoraIcon from "~/icons/zora.svg";
import type { Rollup, Size } from "~/types";
import { capitalize } from "~/utils";

export type RollupIconProps = {
  rollup: Rollup;
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
  let rollupIcon: JSX.Element | null = null;

  switch (rollup) {
    case "abstract":
      rollupIcon = <AbstractIcon className={commonStyles} />;
      break;
    case "arbitrum":
      rollupIcon = (
        <ArbitrumIcon
          className={`${commonStyles} text-[#1b4add] dark:text-[#ffffff]`}
        />
      );
      break;
    case "arenaz":
      rollupIcon = <ArenaZIcon className={`${commonStyles} rounded-xl`} />;
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
    case "bob":
      rollupIcon = <BobIcon className={commonStyles} />;
      break;
    case "boba":
      rollupIcon = <BobaIcon className={commonStyles} />;
      break;
    case "camp":
      rollupIcon = <CampIcon className={commonStyles} />;
      break;
    case "debankchain":
      rollupIcon = <DebankIcon className={commonStyles} />;
      break;
    case "ethernity":
      rollupIcon = <EthernityIcon className={commonStyles} />;
      break;
    case "fuel":
      rollupIcon = <FuelIcon className={commonStyles} />;
      break;
    case "hashkey":
      rollupIcon = <HashkeyIcon className={commonStyles} />;
      break;
    case "ink":
      rollupIcon = <InkIcon className={commonStyles} />;
      break;
    case "kinto":
      rollupIcon = <KintoIcon className={commonStyles} />;
      break;
    case "kroma":
      rollupIcon = <KromaIcon className={commonStyles} />;
      break;
    case "lambda":
      rollupIcon = (
        <Image alt="Lambda" src={lambdaIconSrc} className={commonStyles} />
      );
      break;
    case "linea":
      rollupIcon = <LineaIcon className={commonStyles} />;
      break;
    case "lisk":
      rollupIcon = <LiskIcon className={commonStyles} />;
      break;
    case "metal":
      rollupIcon = <MetalIcon className={commonStyles} />;
      break;
    case "mint":
      rollupIcon = <MintIcon className={commonStyles} />;
      break;
    case "mode":
      rollupIcon = (
        <ModeIcon
          className={`${commonStyles} text-[#ceb245] dark:text-[#ffd940]`}
        />
      );
      break;
    case "morph":
      rollupIcon = (
        <MorphIcon
          className={`${commonStyles} text-[#f7f7f7] dark:text-[#000000]`}
        />
      );
      break;
    case "nal":
      rollupIcon = (
        <NalIcon className={`${commonStyles}  text-black dark:text-white`} />
      );
      break;
    case "optimism":
      rollupIcon = <OptimismIcon className={commonStyles} />;
      break;
    case "optopia":
      rollupIcon = <OptopiaIcon className={commonStyles} />;
      break;
    case "paradex":
      rollupIcon = <ParadexIcon className={commonStyles} />;
      break;
    case "pgn":
      rollupIcon = <PGNIcon className={commonStyles} />;
      break;
    case "polynomial":
      rollupIcon = <PolynomialIcon className={commonStyles} />;
      break;
    case "race":
      rollupIcon = <RaceIcon className={commonStyles} />;
      break;
    case "river":
      rollupIcon = <RiverIcon className={commonStyles} />;
      break;
    case "scroll":
      rollupIcon = <ScrollIcon className={commonStyles} />;
      break;
    case "shape":
      rollupIcon = <ShapeIcon className={commonStyles} />;
      break;
    case "snaxchain":
      rollupIcon = <SnaxchainIcon className={commonStyles} />;
      break;
    case "soneium":
      rollupIcon = <SoneiumIcon className={commonStyles} />;
      break;
    case "starknet":
      rollupIcon = <StarknetIcon className={commonStyles} />;
      break;
    case "superlumio":
      rollupIcon = <SuperlumioIcon className={commonStyles} />;
      break;
    case "superseed":
      rollupIcon = <SuperSeedIcon className={commonStyles} />;
      break;
    case "swanchain":
      rollupIcon = <SwanchainIcon className={commonStyles} />;
      break;
    case "swellchain":
      rollupIcon = <SwellchainIcon className={commonStyles} />;
      break;
    case "taiko":
      rollupIcon = <TaikoIcon className={commonStyles} />;
      break;
    case "thebinaryholdings":
      rollupIcon = (
        <TheBinaryHoldingsIcon
          className={classNames({
            "h-2 w-2": size === "sm",
            "h-3 w-3": size === "md",
            "h-4 w-4": size === "lg",
          })}
        />
      );
      break;
    case "unichain":
      rollupIcon = <UnichainIcon className={commonStyles} />;
      break;
    case "world":
      rollupIcon = (
        <WorldIcon className={`${commonStyles} text-black dark:text-white`} />
      );
      break;
    case "zeronetwork":
      rollupIcon = <ZeroNetworkIcon className={commonStyles} />;
      break;
    case "zircuit":
      rollupIcon = <ZircuitIcon className={commonStyles} />;
      break;
    case "zora":
      rollupIcon = <ZoraIcon className={commonStyles} />;
      break;
    case "zksync":
      rollupIcon = <ZkSyncIcon className={commonStyles} />;
      break;
  }

  return (
    <div title={capitalize(rollup)}>
      {rollupIcon === null ? <div className={commonStyles}></div> : rollupIcon}
    </div>
  );
};
