import type { Rollup } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import abstract from "./abstract.svg";
import aevo from "./aevo.svg";
import ancient8 from "./ancient8.svg";
import arbitrum from "./arbitrum.svg";
import arenaz from "./arenaz.svg";
import base from "./base.svg";
import blast from "./blast.svg";
import bob from "./bob.svg";
import boba from "./boba.svg";
import camp from "./camp.svg";
import debankchain from "./debank.svg";
import ethernity from "./ethernity.svg";
import fraxtal from "./fraxtal.svg";
import fuel from "./fuel.svg";
import hashkey from "./hashkey.svg";
import hemi from "./hemi.svg";
import hypr from "./hypr.svg";
import ink from "./ink.svg";
import karak from "./karak.svg";
import kinto from "./kinto.svg";
import kroma from "./kroma.svg";
import linea from "./linea.svg";
import lisk from "./lisk.svg";
import mantle from "./mantle.svg";
import metal from "./metal.svg";
import metamail from "./metamail.svg";
import metis from "./metis.svg";
import mint from "./mint.svg";
import mode from "./mode.svg";
import morph from "./morph.svg";
import nal from "./nal.svg";
import nanonnetwork from "./nanonnetwork.svg";
import opbnb from "./opbnb.svg";
import optimism from "./optimism.svg";
import optopia from "./optopia.svg";
import paradex from "./paradex.svg";
import parallel from "./parallel.svg";
import pgn from "./pgn.svg";
import phala from "./phala.svg";
import polynomial from "./polynomial.svg";
import r0ar from "./r0ar.svg";
import race from "./race.svg";
import rari from "./rari.svg";
import river from "./river.svg";
import scroll from "./scroll.svg";
import shape from "./shape.svg";
import snaxchain from "./snaxchain.svg";
import soneium from "./soneium.svg";
import starknet from "./starknet.svg";
import superlumio from "./superlumio.svg";
import superseed from "./superseed.svg";
import swanchain from "./swanchain.svg";
import swellchain from "./swellchain.svg";
import taiko from "./taiko.svg";
import thebinaryholdings from "./thebinaryholdings.svg";
import unichain from "./unichain.svg";
import world from "./world.svg";
import xga from "./xga.svg";
import zeronetwork from "./zeronetwork.svg";
import zircuit from "./zircuit.svg";
import zksync from "./zksync.svg";
import zora from "./zora.svg";

type RollupSvgRegistry = Record<Rollup, RenderableIcon>;

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
