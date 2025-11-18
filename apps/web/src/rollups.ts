import type { Rollup } from "./types";

interface RollupStyle {
  label: string;
  color: { light: string; dark: string };
  iconStyle?: string;
  badgeStyle?: string;
}

export const ROLLUP_STYLES: Record<Rollup, RollupStyle> = {
  abstract: {
    label: "Abstract",
    color: { light: "#195b3b", dark: "#7dffc0" },
    badgeStyle:
      "dark:bg-[#195b3b] bg-[#7dffc0] dark:text-[#7dffc0] text-[#195b3b]",
  },
  aevo: {
    label: "Aevo",
    color: { light: "#291f3f", dark: "#d8c9fa" },
    badgeStyle:
      "bg-[#ccbaf5] dark:bg-[#291f3f] dark:text-[#d8c9fa] text-[#291f3f]",
  },
  ancient8: {
    label: "Ancient8",
    color: { light: "#3b4e0b", dark: "#d8ff76" },
    badgeStyle:
      "bg-[#d8ff76] dark:bg-[#3b4e0b] dark:text-[#d8ff76] text-[#3b4e0b]",
    iconStyle: "rounded-lg bg-green-500",
  },
  arbitrum: {
    label: "Arbitrum",
    color: { light: "#12537e", dark: "#80cffc" },
    badgeStyle:
      "bg-[#80cffc] dark:bg-[#12537e] dark:text-[#80cffc] text-[#12537e]",
  },
  arenaz: {
    label: "ArenaZ",
    color: { light: "#2c00bb", dark: "#b19aff" },
    badgeStyle:
      "bg-[#b19aff] dark:bg-[#2c00bb] dark:text-[#b19aff] text-[#2c00bb]",
    iconStyle: "rounded-xl",
  },
  base: {
    label: "Base",
    color: { light: "#2242a1", dark: "#88a6ff" },
    badgeStyle:
      "bg-[#88a6ff] dark:bg-[#2242a1] dark:text-[#88a6ff] text-[#2242a1]",
  },
  blast: {
    label: "Blast",
    color: { light: "#9d9245", dark: "#e4d341" },
    badgeStyle:
      "bg-[#e4d341] dark:bg-[#9d9245] dark:text-[#e4d341] text-[#9d9245]",
  },
  bob: {
    label: "BoB",
    color: { light: "#e4d341", dark: "#9d9245" },
    badgeStyle:
      "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
  },
  boba: {
    label: "Boba",
    color: { light: "#648314", dark: "#cdff03" },
    badgeStyle:
      "bg-[#cdff03] dark:bg-[#648314] dark:text-[#cdff03] text-[#648314]",
  },
  camp: {
    label: "Camp",
    color: { light: "#8c4b1f", dark: "#ffc79b" },
    badgeStyle:
      "bg-[#ffc79b] dark:bg-[#8c4b1f] dark:text-[#ffc79b] text-[#8c4b1f]",
  },
  codex: {
    label: "Codex",
    color: { light: "#3a3a3a", dark: "#d4d4d4" },
    badgeStyle:
      "bg-[#3a3a3a] dark:bg-[#3a3a3a] text-[#d4d4d4] dark:text-[#d4d4d4]",
  },
  debankchain: {
    label: "DeBank Chain",
    color: { light: "#87592a", dark: "#f7d2a8" },
    badgeStyle:
      "bg-[#f7d2a8] dark:bg-[#87592a] dark:text-[#f7d2a8] text-[#87592a]",
  },
  ethernity: {
    label: "Ethernity",
    color: { light: "#6a2aff", dark: "#00e8c2" },
    badgeStyle: "bg-gradient-to-r from-[#6a2aff] to-[#00e8c2] text-[#97ffee]",
  },
  flynet: {
    label: "Flynet",
    color: { light: "#1a1a1a", dark: "#e0e0e0" },
    badgeStyle:
      "bg-[#1a1a1a] dark:bg-[#e0e0e0] dark:text-[#1a1a1a] text-[#e0e0e0]",
  },
  fraxtal: {
    label: "Fraxtal",
    color: { light: "#013280", dark: "#5e9cff" },
    badgeStyle:
      "bg-[#5e9cff] dark:bg-[#013280] dark:text-[#5e9cff] text-[#013280]",
  },
  fuel: {
    label: "Fuel",
    color: { light: "#00a75f", dark: "#9dffbf" },
    badgeStyle:
      "dark:bg-[#00a75f] bg-[#9dffbf] dark:text-[#9dffbf] text-[#00a75f]",
  },
  gravity: {
    label: "Gravity",
    color: { light: "#FFAC43", dark: "#FFAC43" },
    badgeStyle:
      "bg-[#FFAC43] text-[#16110a] dark:bg-[#FFAC43] dark:text-[#16110a]",
  },
  hashkey: {
    label: "HashKey",
    color: { light: "#9c4899", dark: "#f573f0" },
    badgeStyle:
      "dark:bg-[#9c4899] bg-[#f573f0] dark:text-[#f573f0] text-[#9c4899]",
  },
  hemi: {
    label: "Hemi",
    color: { light: "#844b04", dark: "#ffb272" },
    badgeStyle:
      "bg-[#ffb272] dark:bg-[#844b04] dark:text-[#ffb272] text-[#844b04]",
  },
  hpp: {
    label: "HPP",
    color: { light: "#8383D9", dark: "#8383D9" },
    badgeStyle:
      "bg-[#8383D9] text-[#000000] dark:bg-[#8383D9] dark:text-[#ffffff]",
  },
  hypr: {
    label: "Hypr",
    color: { light: "#8c1f1f", dark: "#f7a8a8" },
    badgeStyle:
      "bg-[#f7a8a8] dark:bg-[#8c1f1f] dark:text-[#f7a8a8] text-[#8c1f1f]",
  },
  infinaeon: {
    label: "Infinaeon",
    color: { light: "#007b7f", dark: "#7dfbff" },
    badgeStyle:
      "bg-[#7dfbff] dark:bg-[#007b7f] dark:text-[#7dfbff] text-[#007b7f]",
  },
  ink: {
    label: "Ink",
    color: { light: "#2f1176", dark: "#c0a9f6" },
    badgeStyle:
      "bg-[#c0a9f6] dark:bg-[#2f1176] dark:text-[#c0a9f6] text-[#2f1176]",
  },
  karak: {
    label: "Karak",
    color: { light: "#8c501f", dark: "#f7d2a8" },
    badgeStyle:
      "bg-[#f7d2a8] dark:bg-[#8c501f] dark:text-[#f7d2a8] text-[#8c501f]",
  },
  katana: {
    label: "Katana",
    color: { light: "#0541B2", dark: "#059EED" },
    badgeStyle:
      "bg-gradient-to-r from-[#0541B2] to-[#059EED] text-[#C5EAFC] dark:text-[#C5EAFC]",
  },
  kinto: {
    label: "Kinto",
    color: { light: "#949292", dark: "#dfd7d7" },
    badgeStyle:
      "bg-[#dfd7d7] dark:bg-[#949292] dark:text-[#dfd7d7] text-[#949292]",
  },
  kroma: {
    label: "Kroma",
    color: { light: "#16822a", dark: "#1fb63a" },
    badgeStyle:
      "bg-[#1fb63a] dark:bg-[#16822a] dark:text-[#1fb63a] text-[#16822a]",
  },
  lambda: {
    label: "Lambda",
    color: { light: "#3f4ae1", dark: "#c5c9ff" },
    badgeStyle:
      "bg-[#c5c9ff] dark:bg-[#3f4ae1] dark:text-[#c5c9ff] text-[#3f4ae1]",
  },
  lachain: {
    label: "LaChain",
    color: { light: "#ec4280", dark: "#ec4280" },
    iconStyle: "rounded-lg",
    badgeStyle:
      "bg-gradient-to-r from-[#7b0dfd] to-[#ec4280] text-[#000000] dark:text-[#ffffff]",
  },
  lighter: {
    label: "Lighter",
    color: { light: "#121218", dark: "#cbd5e0" },
    badgeStyle:
      "bg-[#121218] text-[#cbd5e0] dark:bg-[#cbd5e0] dark:text-[#4a5568]",
  },
  linea: {
    label: "Linea",
    color: { light: "#878119", dark: "#efe52b" },
    badgeStyle:
      "bg-[#efe52b] dark:bg-[#878119] dark:text-[#efe52b] text-[#878119]",
  },
  lisk: {
    label: "Lisk",
    color: { light: "#7b1b0a", dark: "#e84d31" },
    badgeStyle:
      "bg-[#e84d31] dark:bg-[#7b1b0a] dark:text-[#e84d31] text-[#7b1b0a]",
  },
  manta: {
    label: "Manta",
    color: { light: "#2770ab", dark: "#32e7ff" },
    badgeStyle:
      "bg-[#32e7ff] dark:bg-[#2770ab] dark:text-[#32e7ff] text-[#2770ab]",
  },
  mantle: {
    label: "Mantle",
    color: { light: "#008F6A", dark: "#65B3AE" },
    badgeStyle:
      "bg-[#65B3AE] dark:bg-[#008F6A] dark:text-[#80dcd6] text-[#5de8c3]",
    iconStyle: "rounded-lg",
  },
  metal: {
    label: "Metal",
    color: { light: "#69439c", dark: "#dbc0ff" },
    badgeStyle:
      "bg-[#dbc0ff] dark:bg-[#69439c] dark:text-[#dbc0ff] text-[#69439c]",
  },
  metamail: {
    label: "MetaMail",
    color: { light: "#135490", dark: "#c5e0f9" },
    badgeStyle:
      "bg-[#c5e0f9] dark:bg-[#135490] dark:text-[#c5e0f9] text-[#135490]",
    iconStyle: "text-blue-500",
  },
  metis: {
    label: "Metis",
    color: { light: "#5d878b", dark: "#c0fbfd" },
    badgeStyle:
      "bg-[#c0fbfd] dark:bg-[#5d878b] dark:text-[#c0fbfd] text-[#5d878b]",
  },
  mint: {
    label: "Mint",
    color: { light: "#3d8141", dark: "#75ff7c" },
    badgeStyle:
      "bg-[#75ff7c] dark:bg-[#3d8141] dark:text-[#75ff7c] text-[#3d8141]",
  },
  mode: {
    label: "Mode",
    color: { light: "#8c8c35", dark: "#ffff5d" },
    badgeStyle:
      "bg-[#ffff5d] dark:bg-[#8c8c35] dark:text-[#ffff5d] text-[#8c8c35]",
    iconStyle: "text-[#ceb245] dark:text-[#ffd940]",
  },
  morph: {
    label: "Morph",
    color: { light: "#176800", dark: "#3bff04" },
    badgeStyle:
      "bg-[#3bff04] dark:bg-[#176800] dark:text-[#3bff04] text-[#176800]",
    iconStyle: "text-[#f7f7f7] dark:text-[#000000]",
  },
  nal: {
    label: "NAL",
    color: { light: "#1c1e1f", dark: "#e5eef4" },
    badgeStyle:
      "bg-[#e5eef4] dark:bg-[#1c1e1f] dark:text-[#e5eef4] text-[#1c1e1f]",
  },
  nanonnetwork: {
    label: "Nanon Network",
    color: { light: "#132874", dark: "#7793fb" },
    badgeStyle:
      "bg-[#7793fb] dark:bg-[#132874] dark:text-[#7793fb] text-[#132874]",
    iconStyle: "rounded-lg",
  },
  opbnb: {
    label: "opBNB",
    color: { light: "#7a745f", dark: "#f8ebbf" },
    badgeStyle:
      "bg-[#f8ebbf] dark:bg-[#7a745f] dark:text-[#f8ebbf] text-[#7a745f]",
  },
  optimism: {
    label: "Optimism",
    color: { light: "#ff3232", dark: "#ffb2b2" },
    badgeStyle:
      "bg-orange-100 dark:bg-orange-900 dark:text-orange-300 text-orange-800",
  },
  optopia: {
    label: "Optopia",
    color: { light: "#8c0101", dark: "#ff9292" },
    badgeStyle:
      "bg-[#ff9292] dark:bg-[#8c0101] dark:text-[#ff9292] text-[#8c0101]",
  },
  orderly: {
    label: "Orderly",
    color: { light: "#6f27ff", dark: "#d4bfff" },
    badgeStyle:
      "bg-[#d4bfff] dark:bg-[#6f27ff] dark:text-[#d4bfff] text-[#6f27ff]",
  },
  pandasea: {
    label: "PandaSea",
    color: { light: "#7e00a1", dark: "#f6d4ff" },
    badgeStyle:
      "bg-[#7e00a1] dark:bg-[#f6d4ff] dark:text-[#7e00a1] text-[#f6d4ff]",
  },
  paradex: {
    label: "Paradex",
    color: { light: "#8f00b7", dark: "#e37eff" },
    badgeStyle:
      "bg-[#e37eff] dark:bg-[#8f00b7] dark:text-[#e37eff] text-[#8f00b7]",
    iconStyle: "rounded-lg",
  },
  parallel: {
    label: "Parallel",
    color: { light: "#830059", dark: "#ffc5ed" },
    badgeStyle:
      "bg-[#ffc5ed] dark:bg-[#830059] dark:text-[#ffc5ed] text-[#830059]",
  },
  pegglecoin: {
    label: "Pegglecoin",
    color: { light: "#f59e0b", dark: "#fbbf24" },
    badgeStyle:
      "bg-[#f59e0b] dark:bg-[#fbbf24] dark:text-[#f59e0b] text-[#fbbf24]",
  },
  phala: {
    label: "Phala",
    color: { light: "#20a42f", dark: "#00ff1e" },
    badgeStyle:
      "bg-[#00ff1e] dark:bg-[#20a42f] dark:text-[#00ff1e] text-[#20a42f]",
  },
  plume: {
    label: "Plume",
    color: { light: "#FF3D00", dark: "#FF3D00" },
    badgeStyle:
      "bg-[#111111] text-[#F9F9F9] dark:bg-[#F9F9F9] dark:text-[#4a5568]",
  },
  pgn: {
    label: "PGN",
    color: { light: "#000000", dark: "#e7fff6" },
    badgeStyle:
      "bg-[#e7fff6] dark:bg-[#000000] dark:text-[#e7fff6] text-[#000000]",
  },
  polynomial: {
    label: "Polynomial",
    color: { light: "#5d741a", dark: "#bcd570" },
    badgeStyle:
      "bg-[#bcd570] dark:bg-[#5d741a] dark:text-[#bcd570] text-[#5d741a]",
  },
  powerloom: {
    label: "Powerloom",
    color: { light: "#55E794", dark: "#55E794" },
    badgeStyle:
      "bg-[#0D0F0F] text-[#F9F9F9] dark:bg-[#0D0F0F] dark:text-[#F9F9F9]",
  },
  r0ar: {
    label: "R0ar",
    color: { light: "#539632", dark: "#b0f872" },
    badgeStyle:
      "bg-[#b0f872] dark:bg-[#539632] dark:text-[#b0f872] text-[#539632]",
  },
  race: {
    label: "Race",
    color: { light: "#824800", dark: "#ffbd6d" },
    badgeStyle:
      "bg-[#fdd4a3] dark:bg-[#824800] dark:text-[#ffbd6d] text-[#824800]",
  },
  rari: {
    label: "Rari",
    color: { light: "#7b00ff", dark: "#e1cafa" },
    badgeStyle:
      "bg-[#e1cafa] dark:bg-[#7b00ff] dark:text-[#e1cafa] text-[#7b00ff]",
  },
  river: {
    label: "River",
    color: { light: "#1c1c1c", dark: "#f2e6e6" },
    badgeStyle:
      "bg-[#f2e6e6] dark:bg-[#1c1c1c] dark:text-[#f2e6e6] text-[#1c1c1c]",
  },
  scroll: {
    label: "Scroll",
    color: { light: "#d28800", dark: "#ffd689" },
    badgeStyle:
      "bg-[#ffd689] dark:bg-[#d28800] dark:text-[#ffd689] text-[#d28800]",
  },
  settlus: {
    label: "Settlus",
    color: { light: "#2d3748", dark: "#e2e8f0" },
    badgeStyle:
      "bg-[#005650] dark:bg-[#e2e8f0] dark:text-[#2d3748] text-[#e2e8f0]",
  },
  shape: {
    label: "Shape",
    color: { light: "#cccaca", dark: "#cccaca" },
    badgeStyle: "bg-[#cccaca] dark:bg-[#cccaca] text-black",
  },
  snaxchain: {
    label: "Snax Chain",
    color: { light: "#0089de", dark: "#bedfff" },
    badgeStyle:
      "bg-[#bedfff] dark:bg-[#0089de] dark:text-[#bedfff] text-[#0089de]",
  },
  soneium: {
    label: "Soneium",
    color: { light: "#434242", dark: "#b5b1b1" },
    badgeStyle:
      "bg-[#b5b1b1] dark:bg-[#434242] dark:text-[#b5b1b1] text-[#434242]",
  },
  spire: {
    label: "Spire",
    color: { light: "#1a202c", dark: "#f7fafc" },
    badgeStyle:
      "bg-[#1a202c] dark:bg-[#f7fafc] dark:text-[#1a202c] text-[#f7fafc]",
  },
  starknet: {
    label: "Starknet",
    color: { light: "#d6bcfa", dark: "#6b21a8" },
    badgeStyle:
      "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300",
  },
  superlumio: {
    label: "Superlumio",
    color: { light: "#2f1364", dark: "#c198ff" },
    badgeStyle:
      "bg-[#c198ff] dark:bg-[#2f1364] dark:text-[#c198ff] text-[#2f1364]",
  },
  superseed: {
    label: "SuperSeed",
    color: { light: "#000000", dark: "#e6e6e6" },
    badgeStyle:
      "bg-[#706ae0] dark:bg-[#000000] dark:text-[#e6e6e6] text-[#000000]",
  },
  swanchain: {
    label: "Swan Chain",
    color: { light: "#270094", dark: "#9e99fc" },
    badgeStyle:
      "bg-[#4400ff] dark:bg-[#270094] dark:text-[#9e99fc] text-[#8f89f1]",
  },
  swellchain: {
    label: "Swell Chain",
    color: { light: "#001974", dark: "#a4b8ff" },
    badgeStyle:
      "bg-[#a4b8ff] dark:bg-[#001974] dark:text-[#a4b8ff] text-[#001974]",
  },
  symbiosis: {
    label: "Symbiosis",
    color: { light: "#8448ff", dark: "#75FB6E" },
    badgeStyle:
      "bg-[#73c56f] text-[#75FB6E] dark:bg-[#3f853b] dark:text-[#75FB6E]",
  },
  taiko: {
    label: "Taiko",
    color: { light: "#97266d", dark: "#fbb6ce" },
    badgeStyle: "bg-pink-300 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  },
  thebinaryholdings: {
    label: "The Binary Holdings",
    color: { light: "#4a9c34", dark: "#b9f7a8" },
    badgeStyle:
      "bg-[#b9f7a8] dark:bg-[#4a9c34] dark:text-[#b9f7a8] text-[#4a9c34]",
    iconStyle: "h-3 w-3",
  },
  unichain: {
    label: "UniChain",
    color: { light: "#8d0086", dark: "#f7a8f3" },
    badgeStyle:
      "bg-[#f7a8f3] dark:bg-[#8d0086] dark:text-[#f7a8f3] text-[#8d0086]",
  },
  world: {
    label: "World",
    color: { light: "#029e9e", dark: "#93dcf8" },
    badgeStyle:
      "bg-[#93dcf8] dark:bg-[#029e9e] dark:text-[#93dcf8] text-[#029e9e]",
  },
  xga: {
    label: "XGA",
    color: { light: "#2b2727", dark: "#f5eeee" },
    badgeStyle:
      "bg-[#f5eeee] dark:bg-[#2b2727] dark:text-[#f5eeee] text-[#2b2727]",
    iconStyle: "rounded-xl bg-gray-200 dark:bg-white h-[18px] w-[18px]",
  },
  zeronetwork: {
    label: "Zero Network",
    color: { light: "#800020", dark: "#fa92ac" },
    badgeStyle:
      "bg-[#fa92ac] dark:bg-[#800020] dark:text-[#ff789a] text-[#800020]",
  },
  zircuit: {
    label: "Zircuit",
    color: { light: "#587351", dark: "#dcead5" },
    badgeStyle:
      "bg-[#dcead5] dark:bg-[#587351] dark:text-[#dcead5] text-[#587351]",
  },
  zora: {
    label: "Zora",
    color: { light: "#0f3197", dark: "#94afff" },
    badgeStyle:
      "bg-[#94afff] dark:bg-[#0f3197] dark:text-[#94afff] text-[#0f3197]",
  },
  zksync: {
    label: "zkSync",
    color: { light: "#1b2f6b", dark: "#6a8fff" },
    badgeStyle:
      "bg-[#6a8fff] dark:bg-[#1b2f6b] dark:text-[#6a8fff] text-[#1b2f6b]",
  },
};
