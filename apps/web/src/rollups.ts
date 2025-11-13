import type { Rollup } from "./types";

type RollupStyle = {
  label: string;
  color: { light: string; dark: string };
  badgeStyle?: string;
  iconStyle?: string;
};

function createRollupStyle({ label, color, badgeStyle: badge }: RollupStyle) {
  return {
    label,
    color,
    badge:
      badge ??
      `bg-[${color.light}] dark:bg-[${color.dark}] dark:text-[${color.light}] text-[${color.dark}]`,
  };
}

export const ROLLUP_STYLES: Record<Rollup, RollupStyle> = {
  abstract: createRollupStyle({
    label: "Abstract",
    color: { light: "#195b3b", dark: "#7dffc0" },
  }),
  aevo: createRollupStyle({
    label: "Aevo",
    color: { light: "#291f3f", dark: "#d8c9fa" },
  }),
  ancient8: createRollupStyle({
    label: "Ancient8",
    color: { light: "#3b4e0b", dark: "#d8ff76" },
    iconStyle: "rounded-lg bg-green-500",
  }),
  arbitrum: createRollupStyle({
    label: "Arbitrum",
    color: { light: "#12537e", dark: "#80cffc" },
  }),
  arenaz: createRollupStyle({
    label: "ArenaZ",
    color: { light: "#2c00bb", dark: "#b19aff" },
    iconStyle: "rounded-xl",
  }),
  base: createRollupStyle({
    label: "Base",
    color: { light: "#2242a1", dark: "#88a6ff" },
  }),
  blast: createRollupStyle({
    label: "Blast",
    color: { light: "#9d9245", dark: "#e4d341" },
  }),
  bob: createRollupStyle({
    label: "BoB",
    color: { light: "#e4d341", dark: "#9d9245" },
    badgeStyle:
      "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
  }),
  boba: createRollupStyle({
    label: "Boba",
    color: { light: "#648314", dark: "#cdff03" },
  }),
  camp: createRollupStyle({
    label: "Camp",
    color: { light: "#8c4b1f", dark: "#ffc79b" },
  }),
  debankchain: createRollupStyle({
    label: "DeBank Chain",
    color: { light: "#87592a", dark: "#f7d2a8" },
    badgeStyle:
      "bg-[#f7d2a8] dark:bg-[#87592a] dark:text-[#f7d2a8] text-[#87592a]",
  }),
  ethernity: createRollupStyle({
    label: "Ethernity",
    color: { light: "#6a2aff", dark: "#00e8c2" },
    badgeStyle: "bg-gradient-to-r from-[#6a2aff] to-[#00e8c2] text-[#97ffee]",
  }),
  fraxtal: createRollupStyle({
    label: "Fraxtal",
    color: { light: "#013280", dark: "#5e9cff" },
    badgeStyle:
      "bg-[#5e9cff] dark:bg-[#013280] dark:text-[#5e9cff] text-[#013280]",
  }),
  fuel: createRollupStyle({
    label: "Fuel",
    color: { light: "#00a75f", dark: "#9dffbf" },
    badgeStyle:
      "dark:bg-[#00a75f] bg-[#9dffbf] dark:text-[#9dffbf] text-[#00a75f]",
  }),
  hashkey: createRollupStyle({
    label: "HashKey",
    color: { light: "#9c4899", dark: "#f573f0" },
    badgeStyle:
      "dark:bg-[#9c4899] bg-[#f573f0] dark:text-[#f573f0] text-[#9c4899]",
  }),
  hemi: createRollupStyle({
    label: "Hemi",
    color: { light: "#844b04", dark: "#ffb272" },
  }),
  hypr: createRollupStyle({
    label: "Hypr",
    color: { light: "#8c1f1f", dark: "#f7a8a8" },
  }),
  infinaeon: createRollupStyle({
    label: "Infinaeon",
    color: { light: "#007b7f", dark: "#7dfbff" },
  }),
  ink: createRollupStyle({
    label: "Ink",
    color: { light: "#2f1176", dark: "#c0a9f6" },
  }),
  karak: createRollupStyle({
    label: "Karak",
    color: { light: "#8c501f", dark: "#f7d2a8" },
  }),
  kinto: createRollupStyle({
    label: "Kinto",
    color: { light: "#949292", dark: "#dfd7d7" },
  }),
  kroma: createRollupStyle({
    label: "Kroma",
    color: { light: "#16822a", dark: "#1fb63a" },
  }),
  lambda: createRollupStyle({
    label: "Lambda",
    color: { light: "#3f4ae1", dark: "#c5c9ff" },
  }),
  linea: createRollupStyle({
    label: "Linea",
    color: { light: "#878119", dark: "#efe52b" },
  }),
  lisk: createRollupStyle({
    label: "Lisk",
    color: { light: "#7b1b0a", dark: "#e84d31" },
  }),
  manta: createRollupStyle({
    label: "Manta",
    color: { light: "#2770ab", dark: "#32e7ff" },
  }),
  mantle: createRollupStyle({
    label: "Mantle",
    color: { light: "#008F6A", dark: "#65B3AE" },
    badgeStyle:
      "bg-[#65B3AE] dark:bg-[#008F6A] dark:text-[#80dcd6] text-[#5de8c3]",
    iconStyle: "rounded-lg",
  }),
  metal: createRollupStyle({
    label: "Metal",
    color: { light: "#69439c", dark: "#dbc0ff" },
  }),
  metamail: createRollupStyle({
    label: "MetaMail",
    color: { light: "#135490", dark: "#c5e0f9" },
    iconStyle: "text-blue-500",
  }),
  metis: createRollupStyle({
    label: "Metis",
    color: { light: "#5d878b", dark: "#c0fbfd" },
  }),
  mint: createRollupStyle({
    label: "Mint",
    color: { light: "#3d8141", dark: "#75ff7c" },
  }),
  mode: createRollupStyle({
    label: "Mode",
    color: { light: "#8c8c35", dark: "#ffff5d" },
    iconStyle: "text-[#ceb245] dark:text-[#ffd940]",
  }),
  morph: createRollupStyle({
    label: "Morph",
    color: { light: "#176800", dark: "#3bff04" },
    iconStyle: "text-[#f7f7f7] dark:text-[#000000]",
  }),
  nal: createRollupStyle({
    label: "NAL",
    color: { light: "#1c1e1f", dark: "#e5eef4" },
  }),
  nanonnetwork: createRollupStyle({
    label: "Nanon Network",
    color: { light: "#132874", dark: "#7793fb" },
    iconStyle: "rounded-lg",
  }),
  opbnb: createRollupStyle({
    label: "opBNB",
    color: { light: "#7a745f", dark: "#f8ebbf" },
  }),
  optimism: createRollupStyle({
    label: "Optimism",
    color: { light: "#ff3232", dark: "#ffb2b2" },
    badgeStyle:
      "bg-orange-100 dark:bg-orange-900 dark:text-orange-300 text-orange-800",
  }),
  optopia: createRollupStyle({
    label: "Optopia",
    color: { light: "#8c0101", dark: "#ff9292" },
  }),
  orderly: createRollupStyle({
    label: "Orderly",
    color: { light: "#6f27ff", dark: "#d4bfff" },
  }),
  pandasea: createRollupStyle({
    label: "PandaSea",
    color: { light: "#7e00a1", dark: "#f6d4ff" },
  }),
  paradex: createRollupStyle({
    label: "Paradex",
    color: { light: "#8f00b7", dark: "#e37eff" },
    iconStyle: "rounded-lg",
  }),
  parallel: createRollupStyle({
    label: "Parallel",
    color: { light: "#830059", dark: "#ffc5ed" },
  }),
  phala: createRollupStyle({
    label: "Phala",
    color: { light: "#20a42f", dark: "#00ff1e" },
  }),
  pgn: createRollupStyle({
    label: "PGN",
    color: { light: "#000000", dark: "#e7fff6" },
  }),
  polynomial: createRollupStyle({
    label: "Polynomial",
    color: { light: "#5d741a", dark: "#bcd570" },
  }),
  r0ar: createRollupStyle({
    label: "R0ar",
    color: { light: "#539632", dark: "#b0f872" },
  }),
  race: createRollupStyle({
    label: "Race",
    color: { light: "#824800", dark: "#ffbd6d" },
    badgeStyle:
      "bg-[#fdd4a3] dark:bg-[#824800] dark:text-[#ffbd6d] text-[#824800]",
  }),
  rari: createRollupStyle({
    label: "Rari",
    color: { light: "#7b00ff", dark: "#e1cafa" },
  }),
  river: createRollupStyle({
    label: "River",
    color: { light: "#1c1c1c", dark: "#f2e6e6" },
  }),
  scroll: createRollupStyle({
    label: "Scroll",
    color: { light: "#d28800", dark: "#ffd689" },
  }),
  shape: createRollupStyle({
    label: "Shape",
    color: { light: "#cccaca", dark: "#cccaca" },
    badgeStyle: "bg-[#cccaca] dark:bg-[#cccaca] text-black",
  }),
  snaxchain: createRollupStyle({
    label: "Snax Chain",
    color: { light: "#0089de", dark: "#bedfff" },
  }),
  soneium: createRollupStyle({
    label: "Soneium",
    color: { light: "#434242", dark: "#b5b1b1" },
  }),
  starknet: createRollupStyle({
    label: "Starknet",
    color: { light: "#d6bcfa", dark: "#6b21a8" },
    badgeStyle:
      "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300",
  }),
  superlumio: createRollupStyle({
    label: "Superlumio",
    color: { light: "#2f1364", dark: "#c198ff" },
  }),
  superseed: createRollupStyle({
    label: "SuperSeed",
    color: { light: "#000000", dark: "#e6e6e6" },
    badgeStyle:
      "bg-[#706ae0] dark:bg-[#000000] dark:text-[#e6e6e6] text-[#000000]",
  }),
  swanchain: createRollupStyle({
    label: "Swan Chain",
    color: { light: "#270094", dark: "#9e99fc" },
    badgeStyle:
      "bg-[#4400ff] dark:bg-[#270094] dark:text-[#9e99fc] text-[#8f89f1]",
  }),
  swellchain: createRollupStyle({
    label: "Swell Chain",
    color: { light: "#001974", dark: "#a4b8ff" },
  }),
  taiko: createRollupStyle({
    label: "Taiko",
    color: { light: "#97266d", dark: "#fbb6ce" },
    badgeStyle: "bg-pink-300 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  }),
  thebinaryholdings: createRollupStyle({
    label: "The Binary Holdings",
    color: { light: "#4a9c34", dark: "#b9f7a8" },
    iconStyle: "h-3 w-3",
  }),
  unichain: createRollupStyle({
    label: "UniChain",
    color: { light: "#8d0086", dark: "#f7a8f3" },
  }),
  world: createRollupStyle({
    label: "World",
    color: { light: "#029e9e", dark: "#93dcf8" },
  }),
  xga: createRollupStyle({
    label: "XGA",
    color: { light: "#2b2727", dark: "#f5eeee" },
    iconStyle: "rounded-xl bg-gray-200 dark:bg-white h-[18px] w-[18px]",
  }),
  zeronetwork: createRollupStyle({
    label: "Zero Network",
    color: { light: "#800020", dark: "#fa92ac" },
  }),
  zircuit: createRollupStyle({
    label: "Zircuit",
    color: { light: "#587351", dark: "#dcead5" },
  }),
  zora: createRollupStyle({
    label: "Zora",
    color: { light: "#0f3197", dark: "#94afff" },
  }),
  zksync: createRollupStyle({
    label: "zkSync",
    color: { light: "#1b2f6b", dark: "#6a8fff" },
  }),
};
