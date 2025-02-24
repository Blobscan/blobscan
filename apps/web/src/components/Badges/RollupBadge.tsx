import React from "react";

import type { Rollup } from "~/types";
import { capitalize } from "~/utils";
import { RollupIcon } from "../RollupIcon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

const ROLLUP_CONFIG: Record<Rollup, { style: string; label?: string }> = {
  abstract: {
    style: "dark:bg-[#195b3b] bg-[#7dffc0] dark:text-[#7dffc0] text-[#195b3b]",
  },
  aevo: {
    style: "bg-[#ccbaf5] dark:bg-[#291f3f] dark:text-[#d8c9fa] text-[#291f3f]",
  },
  ancient8: {
    style: "bg-[#d8ff76] dark:bg-[#3b4e0b] dark:text-[#d8ff76] text-[#3b4e0b]",
  },
  arbitrum: {
    style: "bg-[#80cffc] dark:bg-[#12537e] dark:text-[#80cffc] text-[#12537e]",
  },
  arenaz: {
    style: "bg-[#b19aff] dark:bg-[#2c00bb] dark:text-[#b19aff] text-[#2c00bb]",
    label: "ArenaZ",
  },
  base: {
    style: "bg-[#88a6ff] dark:bg-[#2242a1] dark:text-[#88a6ff] text-[#2242a1]",
  },
  blast: {
    style: "bg-[#f2edc3] dark:bg-[#9d9245] dark:text-[#f2edc3] text-[#9d9245]",
  },
  bob: {
    style: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
  },
  boba: {
    style: "bg-[#cdff03] dark:bg-[#648314] dark:text-[#cdff03] text-[#648314]",
  },
  camp: {
    style: "bg-[#ffc79b] dark:bg-[#8c4b1f] dark:text-[#ffc79b] text-[#8c4b1f]",
  },
  debankchain: {
    style: "bg-[#f7d2a8] dark:bg-[#87592a] dark:text-[#f7d2a8] text-[#87592a]",
    label: "DeBank Chain",
  },
  ethernity: {
    style: "bg-gradient-to-r from-[#6a2aff] to-[#00e8c2] text-[#97ffee]",
  },
  fraxtal: {
    style: "bg-[#5e9cff] dark:bg-[#013280] dark:text-[#5e9cff] text-[#013280]",
  },
  fuel: {
    style: "dark:bg-[#00a75f] bg-[#9dffbf] dark:text-[#9dffbf] text-[#00a75f]",
  },
  hashkey: {
    style: "dark:bg-[#9c4899] bg-[#f573f0] dark:text-[#f573f0] text-[#9c4899]",
    label: "HashKey",
  },
  hemi: {
    style: "bg-[#ffb272] dark:bg-[#844b04] dark:text-[#ffb272] text-[#844b04]",
  },
  hypr: {
    style: "bg-[#f7a8a8] dark:bg-[#8c1f1f] dark:text-[#f7a8a8] text-[#8c1f1f]",
  },
  infinaeon: {
    style: "bg-[#7dfbff] dark:bg-[#007b7f] dark:text-[#7dfbff] text-[#007b7f]",
  },
  ink: {
    style: "bg-[#c0a9f6] dark:bg-[#2f1176] dark:text-[#c0a9f6] text-[#2f1176]",
  },
  karak: {
    style: "bg-[#f7d2a8] dark:bg-[#8c501f] dark:text-[#f7d2a8] text-[#8c501f]",
  },
  kinto: {
    style: "bg-[#dfd7d7] dark:bg-[#949292] dark:text-[#dfd7d7] text-[#949292]",
  },
  kroma: {
    style: "bg-[#1fb63a] dark:bg-[#16822a] dark:text-[#1fb63a] text-[#16822a]",
  },
  lambda: {
    style: "bg-[#c5c9ff] dark:bg-[#3f4ae1] dark:text-[#c5c9ff] text-[#3f4ae1]",
  },
  linea: {
    style: "bg-[#efe52b] dark:bg-[#878119] dark:text-[#efe52b] text-[#878119]",
  },
  lisk: {
    style: "bg-[#e84d31] dark:bg-[#7b1b0a] dark:text-[#e84d31] text-[#7b1b0a]",
  },
  manta: {
    style: "bg-[#32e7ff] dark:bg-[#2770ab] dark:text-[#32e7ff] text-[#2770ab]",
  },
  mantle: {
    style: "bg-[#65B3AE] dark:bg-[#008F6A] dark:text-[#80dcd6] text-[#5de8c3]",
  },
  metal: {
    style: "bg-[#dbc0ff] dark:bg-[#69439c] dark:text-[#dbc0ff] text-[#69439c]",
  },
  metamail: {
    style: "bg-[#c5e0f9] dark:bg-[#135490] dark:text-[#c5e0f9] text-[#135490]",
    label: "MetaMail",
  },
  metis: {
    style: "bg-[#c0fbfd] dark:bg-[#5d878b] dark:text-[#c0fbfd] text-[#5d878b]",
  },
  mint: {
    style: "bg-[#75ff7c] dark:bg-[#3d8141] dark:text-[#75ff7c] text-[#3d8141]",
  },
  mode: {
    style: "bg-[#ffff5d] dark:bg-[#8c8c35] dark:text-[#ffff5d] text-[#8c8c35]",
  },
  morph: {
    style: "bg-[#3bff04] dark:bg-[#176800] dark:text-[#3bff04] text-[#176800]",
  },
  nal: {
    style: "bg-[#e5eef4] dark:bg-[#1c1e1f] dark:text-[#e5eef4] text-[#1c1e1f]",
    label: "NAL",
  },
  nanonnetwork: {
    style: "bg-[#7793fb] dark:bg-[#132874] dark:text-[#7793fb] text-[#132874]",
    label: "Nanon Network",
  },
  opbnb: {
    style: "bg-[#f8ebbf] dark:bg-[#7a745f] dark:text-[#f8ebbf] text-[#7a745f]",
    label: "opBNB",
  },
  optimism: {
    style:
      "bg-orange-100 dark:bg-orange-900 dark:text-orange-300 text-orange-800",
  },
  optopia: {
    style: "bg-[#ff9292] dark:bg-[#8c0101] dark:text-[#ff9292] text-[#8c0101]",
  },
  orderly: {
    style: "bg-[#d4bfff] dark:bg-[#6f27ff] dark:text-[#d4bfff] text-[#6f27ff]",
  },
  pandasea: {
    style: "bg-[#f6d4ff] dark:bg-[#7e00a1] dark:text-[#f6d4ff] text-[#7e00a1]",
    label: "PandaSea",
  },
  paradex: {
    style: "bg-[#e37eff] dark:bg-[#8f00b7] dark:text-[#e37eff] text-[#8f00b7]",
  },
  parallel: {
    style: "bg-[#ffc5ed] dark:bg-[#830059] dark:text-[#ffc5ed] text-[#830059]",
  },
  phala: {
    style: "bg-[#00ff1e] dark:bg-[#20a42f] dark:text-[#00ff1e] text-[#20a42f]",
  },
  pgn: {
    style: "bg-[#e7fff6] dark:bg-[#000000] dark:text-[#e7fff6] text-[#000000]",
    label: "PGN",
  },
  polynomial: {
    style: "bg-[#bcd570] dark:bg-[#5d741a] dark:text-[#bcd570] text-[#5d741a]",
  },
  r0ar: {
    style: "bg-[#b0f872] dark:bg-[#539632] dark:text-[#b0f872] text-[#539632]",
  },
  race: {
    style: "bg-[#fdd4a3] dark:bg-[#824800] dark:text-[#ffbd6d] text-[#824800]",
  },
  rari: {
    style: "bg-[#e1cafa] dark:bg-[#7b00ff] dark:text-[#e1cafa] text-[#7b00ff]",
  },
  river: {
    style: "bg-[#f2e6e6] dark:bg-[#1c1c1c] dark:text-[#f2e6e6] text-[#1c1c1c]",
  },
  scroll: {
    style: "bg-[#ffd689] dark:bg-[#d28800] dark:text-[#ffd689] text-[#d28800]",
  },
  shape: {
    style: "bg-[#cccaca] dark:bg-[#cccaca] text-black",
  },
  snaxchain: {
    style: "bg-[#bedfff] dark:bg-[#0089de] dark:text-[#bedfff] text-[#0089de]",
    label: "Snax Chain",
  },
  soneium: {
    style: "bg-[#b5b1b1] dark:bg-[#434242] dark:text-[#b5b1b1] text-[#434242]",
  },
  starknet: {
    style:
      "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300",
  },
  superlumio: {
    style: "bg-[#c198ff] dark:bg-[#2f1364] dark:text-[#c198ff] text-[#2f1364]",
  },
  superseed: {
    style: "bg-[#3b34c5] dark:bg-[#000000] dark:text-[#e6e6e6] text-[#000000]",
    label: "SuperSeed",
  },
  swanchain: {
    style: "bg-[#4400ff] dark:bg-[#270094] dark:text-[#9e99fc] text-[#8f89f1]",
    label: "Swan Chain",
  },
  swellchain: {
    style: "bg-[#a4b8ff] dark:bg-[#001974] dark:text-[#a4b8ff] text-[#001974]",
    label: "Swell Chain",
  },
  taiko: {
    style: "bg-pink-300 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  },
  thebinaryholdings: {
    style: "bg-[#b9f7a8] dark:bg-[#4a9c34] dark:text-[#b9f7a8] text-[#4a9c34]",
    label: "The Binary Holdings",
  },
  unichain: {
    style: "bg-[#f7a8f3] dark:bg-[#8d0086] dark:text-[#f7a8f3] text-[#8d0086]",
  },
  world: {
    style: "bg-[#93dcf8] dark:bg-[#029e9e] dark:text-[#93dcf8] text-[#029e9e]",
  },
  xga: {
    style: "bg-[#f5eeee] dark:bg-[#2b2727] dark:text-[#f5eeee] text-[#2b2727]",
    label: "XGA",
  },
  zeronetwork: {
    style: "bg-[#fa92ac] dark:bg-[#800020] dark:text-[#ff789a] text-[#800020]",
    label: "Zero Network",
  },
  zircuit: {
    style: "bg-[#dcead5] dark:bg-[#587351] dark:text-[#dcead5] text-[#587351]",
  },
  zora: {
    style: "bg-[#94afff] dark:bg-[#0f3197] dark:text-[#94afff] text-[#0f3197]",
  },
  zksync: {
    style: "bg-[#6a8fff] dark:bg-[#1b2f6b] dark:text-[#6a8fff] text-[#1b2f6b]",
    label: "zkSync",
  },
};

type RollupBadgeProps = BadgeProps & {
  rollup: Rollup;
};

export const RollupBadge: React.FC<RollupBadgeProps> = ({
  rollup,
  ...props
}) => {
  const { style, label } = ROLLUP_CONFIG[rollup];

  return (
    <Badge className={style} {...props}>
      <RollupIcon rollup={rollup} />
      {label ?? capitalize(rollup)}
    </Badge>
  );
};
