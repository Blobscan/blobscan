import type { FC, SVGProps } from "react";

import abstract from "~/icons/rollups/abstract.svg";
import aevo from "~/icons/rollups/aevo.svg";
import ancient8 from "~/icons/rollups/ancient8.svg";
import arbitrum from "~/icons/rollups/arbitrum.svg";
import arenaz from "~/icons/rollups/arenaz.svg";
import base from "~/icons/rollups/base.svg";
import blast from "~/icons/rollups/blast.svg";
import bob from "~/icons/rollups/bob.svg";
import boba from "~/icons/rollups/boba.svg";
import camp from "~/icons/rollups/camp.svg";
import debankchain from "~/icons/rollups/debank.svg";
import ethernity from "~/icons/rollups/ethernity.svg";
import fraxtal from "~/icons/rollups/fraxtal.svg";
import fuel from "~/icons/rollups/fuel.svg";
import hashkey from "~/icons/rollups/hashkey.svg";
import hemi from "~/icons/rollups/hemi.svg";
import hypr from "~/icons/rollups/hypr.svg";
import ink from "~/icons/rollups/ink.svg";
import karak from "~/icons/rollups/karak.svg";
import kinto from "~/icons/rollups/kinto.svg";
import kroma from "~/icons/rollups/kroma.svg";
import linea from "~/icons/rollups/linea.svg";
import lisk from "~/icons/rollups/lisk.svg";
import mantle from "~/icons/rollups/mantle.svg";
import metal from "~/icons/rollups/metal.svg";
import metamail from "~/icons/rollups/metamail.svg";
import metis from "~/icons/rollups/metis.svg";
import mint from "~/icons/rollups/mint.svg";
import mode from "~/icons/rollups/mode.svg";
import morph from "~/icons/rollups/morph.svg";
import nal from "~/icons/rollups/nal.svg";
import nanonnetwork from "~/icons/rollups/nanonnetwork.svg";
import opbnb from "~/icons/rollups/opbnb.svg";
import optimism from "~/icons/rollups/optimism.svg";
import optopia from "~/icons/rollups/optopia.svg";
import paradex from "~/icons/rollups/paradex.svg";
import parallel from "~/icons/rollups/parallel.svg";
import pgn from "~/icons/rollups/pgn.svg";
import phala from "~/icons/rollups/phala.svg";
import polynomial from "~/icons/rollups/polynomial.svg";
import r0ar from "~/icons/rollups/r0ar.svg";
import race from "~/icons/rollups/race.svg";
import rari from "~/icons/rollups/rari.svg";
import river from "~/icons/rollups/river.svg";
import scroll from "~/icons/rollups/scroll.svg";
import shape from "~/icons/rollups/shape.svg";
import snaxchain from "~/icons/rollups/snaxchain.svg";
import soneium from "~/icons/rollups/soneium.svg";
import starknet from "~/icons/rollups/starknet.svg";
import superlumio from "~/icons/rollups/superlumio.svg";
import superseed from "~/icons/rollups/superseed.svg";
import swanchain from "~/icons/rollups/swanchain.svg";
import swellchain from "~/icons/rollups/swellchain.svg";
import taiko from "~/icons/rollups/taiko.svg";
import thebinaryholdings from "~/icons/rollups/thebinaryholdings.svg";
import unichain from "~/icons/rollups/unichain.svg";
import world from "~/icons/rollups/world.svg";
import xga from "~/icons/rollups/xga.svg";
import zeronetwork from "~/icons/rollups/zeronetwork.svg";
import zircuit from "~/icons/rollups/zircuit.svg";
import zksync from "~/icons/rollups/zksync.svg";
import zora from "~/icons/rollups/zora.svg";
import type { Rollup } from "~/types";

type RollupSvgRegistry = Record<Rollup, FC<SVGProps<SVGElement>> | string>;

export const ICONS: RollupSvgRegistry = {
  abstract,
  aevo,
  ancient8,
  arbitrum,
  arenaz,
  base,
  blast,
  bob,
  boba,
  camp,
  debankchain,
  ethernity,
  fraxtal,
  fuel,
  hashkey,
  hemi,
  hypr,
  ink,
  karak,
  kinto,
  kroma,
  linea,
  lisk,
  mantle,
  metal,
  metamail,
  metis,
  mint,
  mode,
  morph,
  nal,
  nanonnetwork,
  opbnb,
  optimism,
  optopia,
  paradex,
  parallel,
  pgn,
  phala,
  polynomial,
  r0ar,
  race,
  rari,
  river,
  scroll,
  shape,
  snaxchain,
  soneium,
  starknet,
  superlumio,
  superseed,
  swanchain,
  swellchain,
  taiko,
  thebinaryholdings,
  unichain,
  world,
  xga,
  zeronetwork,
  zircuit,
  zksync,
  zora,

  // PNG-based rollups
  infinaeon: "/rollups/infinaeon.png",
  lambda: "/rollups/lambda.png",
  manta: "/rollups/manta.png",
  orderly: "/rollups/orderly.png",
  pandasea: "/rollups/pandasea.png",
};
