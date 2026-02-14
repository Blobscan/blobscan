import type { ResourceDefinition } from "~/types/definition";
import type { Rollup } from "../types";

export const ROLLUP_DEFINITIONS: Record<Rollup, ResourceDefinition> = {
  abstract: {
    name: "Abstract",
    color: { light: "#195b3b", dark: "#7dffc0" },
    badgeClassname:
      "dark:bg-[#195b3b] bg-[#7dffc0] dark:text-[#7dffc0] text-[#195b3b]",
  },
  aevo: {
    name: "Aevo",
    color: { light: "#291f3f", dark: "#d8c9fa" },
    badgeClassname:
      "bg-[#ccbaf5] dark:bg-[#291f3f] dark:text-[#d8c9fa] text-[#291f3f]",
  },
  ancient8: {
    name: "Ancient8",
    color: { light: "#3b4e0b", dark: "#d8ff76" },
    badgeClassname:
      "bg-[#d8ff76] dark:bg-[#3b4e0b] dark:text-[#d8ff76] text-[#3b4e0b]",
    iconClassname: "rounded-lg bg-green-500",
  },
  arbitrum: {
    name: "Arbitrum",
    color: { light: "#12537e", dark: "#80cffc" },
    badgeClassname:
      "bg-[#80cffc] dark:bg-[#12537e] dark:text-[#80cffc] text-[#12537e]",
  },
  arenaz: {
    name: "ArenaZ",
    color: { light: "#2c00bb", dark: "#b19aff" },
    badgeClassname:
      "bg-[#b19aff] dark:bg-[#2c00bb] dark:text-[#b19aff] text-[#2c00bb]",
    iconClassname: "rounded-xl",
  },
  base: {
    name: "Base",
    color: { light: "#2242a1", dark: "#88a6ff" },
    badgeClassname:
      "bg-[#88a6ff] dark:bg-[#2242a1] dark:text-[#88a6ff] text-[#2242a1]",
  },
  blast: {
    name: "Blast",
    color: { light: "#9d9245", dark: "#e4d341" },
    badgeClassname:
      "bg-[#e4d341] dark:bg-[#9d9245] dark:text-[#e4d341] text-[#9d9245]",
  },
  bob: {
    name: "BoB",
    color: { light: "#e4d341", dark: "#9d9245" },
    badgeClassname:
      "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-50",
  },
  boba: {
    name: "Boba",
    color: { light: "#648314", dark: "#cdff03" },
    badgeClassname:
      "bg-[#cdff03] dark:bg-[#648314] dark:text-[#cdff03] text-[#648314]",
  },
  camp: {
    name: "Camp",
    color: { light: "#8c4b1f", dark: "#ffc79b" },
    badgeClassname:
      "bg-[#ffc79b] dark:bg-[#8c4b1f] dark:text-[#ffc79b] text-[#8c4b1f]",
  },
  codex: {
    name: "Codex",
    color: { light: "#3a3a3a", dark: "#d4d4d4" },
    badgeClassname:
      "bg-[#3a3a3a] dark:bg-[#3a3a3a] text-[#d4d4d4] dark:text-[#d4d4d4]",
  },
  debankchain: {
    name: "DeBank Chain",
    color: { light: "#87592a", dark: "#f7d2a8" },
    badgeClassname:
      "bg-[#f7d2a8] dark:bg-[#87592a] dark:text-[#f7d2a8] text-[#87592a]",
  },
  ethernity: {
    name: "Ethernity",
    color: { light: "#6a2aff", dark: "#00e8c2" },
    badgeClassname:
      "bg-gradient-to-r from-[#6a2aff] to-[#00e8c2] text-[#97ffee]",
  },
  flynet: {
    name: "Flynet",
    color: { light: "#1a1a1a", dark: "#e0e0e0" },
    badgeClassname:
      "bg-[#1a1a1a] dark:bg-[#e0e0e0] dark:text-[#1a1a1a] text-[#e0e0e0]",
  },
  fraxtal: {
    name: "Fraxtal",
    color: { light: "#013280", dark: "#5e9cff" },
    badgeClassname:
      "bg-[#5e9cff] dark:bg-[#013280] dark:text-[#5e9cff] text-[#013280]",
  },
  fuel: {
    name: "Fuel",
    color: { light: "#00a75f", dark: "#9dffbf" },
    badgeClassname:
      "dark:bg-[#00a75f] bg-[#9dffbf] dark:text-[#9dffbf] text-[#00a75f]",
  },
  gravity: {
    name: "Gravity",
    color: { light: "#FFAC43", dark: "#FFAC43" },
    badgeClassname:
      "bg-[#FFAC43] text-[#16110a] dark:bg-[#FFAC43] dark:text-[#16110a]",
  },
  hashkey: {
    name: "HashKey",
    color: { light: "#9c4899", dark: "#f573f0" },
    badgeClassname:
      "dark:bg-[#9c4899] bg-[#f573f0] dark:text-[#f573f0] text-[#9c4899]",
  },
  hemi: {
    name: "Hemi",
    color: { light: "#844b04", dark: "#ffb272" },
    badgeClassname:
      "bg-[#ffb272] dark:bg-[#844b04] dark:text-[#ffb272] text-[#844b04]",
  },
  hpp: {
    name: "HPP",
    color: { light: "#8383D9", dark: "#8383D9" },
    badgeClassname:
      "bg-[#8383D9] text-[#000000] dark:bg-[#8383D9] dark:text-[#ffffff]",
  },
  hypr: {
    name: "Hypr",
    color: { light: "#8c1f1f", dark: "#f7a8a8" },
    badgeClassname:
      "bg-[#f7a8a8] dark:bg-[#8c1f1f] dark:text-[#f7a8a8] text-[#8c1f1f]",
  },
  infinaeon: {
    name: "Infinaeon",
    color: { light: "#007b7f", dark: "#7dfbff" },
    badgeClassname:
      "bg-[#7dfbff] dark:bg-[#007b7f] dark:text-[#7dfbff] text-[#007b7f]",
    iconSrc: "/rollups/infinaeon.png",
  },
  ink: {
    name: "Ink",
    color: { light: "#2f1176", dark: "#c0a9f6" },
    badgeClassname:
      "bg-[#c0a9f6] dark:bg-[#2f1176] dark:text-[#c0a9f6] text-[#2f1176]",
  },
  karak: {
    name: "Karak",
    color: { light: "#8c501f", dark: "#f7d2a8" },
    badgeClassname:
      "bg-[#f7d2a8] dark:bg-[#8c501f] dark:text-[#f7d2a8] text-[#8c501f]",
  },
  katana: {
    name: "Katana",
    color: { light: "#0541B2", dark: "#059EED" },
    badgeClassname:
      "bg-gradient-to-r from-[#0541B2] to-[#059EED] text-[#C5EAFC] dark:text-[#C5EAFC]",
  },
  kinto: {
    name: "Kinto",
    color: { light: "#949292", dark: "#dfd7d7" },
    badgeClassname:
      "bg-[#dfd7d7] dark:bg-[#949292] dark:text-[#dfd7d7] text-[#949292]",
  },
  kroma: {
    name: "Kroma",
    color: { light: "#16822a", dark: "#1fb63a" },
    badgeClassname:
      "bg-[#1fb63a] dark:bg-[#16822a] dark:text-[#1fb63a] text-[#16822a]",
  },
  lambda: {
    name: "Lambda",
    color: { light: "#3f4ae1", dark: "#c5c9ff" },
    badgeClassname:
      "bg-[#c5c9ff] dark:bg-[#3f4ae1] dark:text-[#c5c9ff] text-[#3f4ae1]",
    iconSrc: "/rollups/lambda.png",
  },
  lachain: {
    name: "LaChain",
    color: { light: "#ec4280", dark: "#ec4280" },
    iconClassname: "rounded-lg",
    badgeClassname:
      "bg-gradient-to-r from-[#7b0dfd] to-[#ec4280] text-[#000000] dark:text-[#ffffff]",
    iconSrc: "/rollups/lachain.jpg",
  },
  lighter: {
    name: "Lighter",
    color: { light: "#121218", dark: "#cbd5e0" },
    badgeClassname:
      "bg-[#121218] text-[#cbd5e0] dark:bg-[#cbd5e0] dark:text-[#4a5568]",
  },
  linea: {
    name: "Linea",
    color: { light: "#878119", dark: "#efe52b" },
    badgeClassname:
      "bg-[#efe52b] dark:bg-[#878119] dark:text-[#efe52b] text-[#878119]",
  },
  lisk: {
    name: "Lisk",
    color: { light: "#7b1b0a", dark: "#e84d31" },
    badgeClassname:
      "bg-[#e84d31] dark:bg-[#7b1b0a] dark:text-[#e84d31] text-[#7b1b0a]",
  },
  manta: {
    name: "Manta",
    color: { light: "#2770ab", dark: "#32e7ff" },
    badgeClassname:
      "bg-[#32e7ff] dark:bg-[#2770ab] dark:text-[#32e7ff] text-[#2770ab]",
    iconSrc: "/rollups/manta.png",
  },
  mantle: {
    name: "Mantle",
    color: { light: "#008F6A", dark: "#65B3AE" },
    badgeClassname:
      "bg-[#65B3AE] dark:bg-[#008F6A] dark:text-[#80dcd6] text-[#5de8c3]",
    iconClassname: "rounded-lg",
  },
  metal: {
    name: "Metal",
    color: { light: "#69439c", dark: "#dbc0ff" },
    badgeClassname:
      "bg-[#dbc0ff] dark:bg-[#69439c] dark:text-[#dbc0ff] text-[#69439c]",
  },
  metamail: {
    name: "MetaMail",
    color: { light: "#135490", dark: "#c5e0f9" },
    badgeClassname:
      "bg-[#c5e0f9] dark:bg-[#135490] dark:text-[#c5e0f9] text-[#135490]",
    iconClassname: "text-blue-500",
  },
  metis: {
    name: "Metis",
    color: { light: "#5d878b", dark: "#c0fbfd" },
    badgeClassname:
      "bg-[#c0fbfd] dark:bg-[#5d878b] dark:text-[#c0fbfd] text-[#5d878b]",
  },
  mint: {
    name: "Mint",
    color: { light: "#3d8141", dark: "#75ff7c" },
    badgeClassname:
      "bg-[#75ff7c] dark:bg-[#3d8141] dark:text-[#75ff7c] text-[#3d8141]",
  },
  mode: {
    name: "Mode",
    color: { light: "#8c8c35", dark: "#ffff5d" },
    badgeClassname:
      "bg-[#ffff5d] dark:bg-[#8c8c35] dark:text-[#ffff5d] text-[#8c8c35]",
    iconClassname: "text-[#ceb245] dark:text-[#ffd940]",
  },
  morph: {
    name: "Morph",
    color: { light: "#176800", dark: "#3bff04" },
    badgeClassname:
      "bg-[#3bff04] dark:bg-[#176800] dark:text-[#3bff04] text-[#176800]",
    iconClassname: "text-[#f7f7f7] dark:text-[#000000]",
  },
  nal: {
    name: "NAL",
    color: { light: "#1c1e1f", dark: "#e5eef4" },
    badgeClassname:
      "bg-[#e5eef4] dark:bg-[#1c1e1f] dark:text-[#e5eef4] text-[#1c1e1f]",
  },
  nanonnetwork: {
    name: "Nanon Network",
    color: { light: "#132874", dark: "#7793fb" },
    badgeClassname:
      "bg-[#7793fb] dark:bg-[#132874] dark:text-[#7793fb] text-[#132874]",
    iconClassname: "rounded-lg",
  },
  opbnb: {
    name: "opBNB",
    color: { light: "#7a745f", dark: "#f8ebbf" },
    badgeClassname:
      "bg-[#f8ebbf] dark:bg-[#7a745f] dark:text-[#f8ebbf] text-[#7a745f]",
  },
  optimism: {
    name: "Optimism",
    color: { light: "#ff3232", dark: "#ffb2b2" },
    badgeClassname:
      "bg-orange-100 dark:bg-orange-900 dark:text-orange-300 text-orange-800",
  },
  optopia: {
    name: "Optopia",
    color: { light: "#8c0101", dark: "#ff9292" },
    badgeClassname:
      "bg-[#ff9292] dark:bg-[#8c0101] dark:text-[#ff9292] text-[#8c0101]",
  },
  orderly: {
    name: "Orderly",
    color: { light: "#6f27ff", dark: "#d4bfff" },
    badgeClassname:
      "bg-[#d4bfff] dark:bg-[#6f27ff] dark:text-[#d4bfff] text-[#6f27ff]",
    iconSrc: "/rollups/orderly.png",
  },
  pandasea: {
    name: "PandaSea",
    color: { light: "#7e00a1", dark: "#f6d4ff" },
    badgeClassname:
      "bg-[#7e00a1] dark:bg-[#f6d4ff] dark:text-[#7e00a1] text-[#f6d4ff]",
    iconSrc: "/rollups/pandasea.png",
  },
  paradex: {
    name: "Paradex",
    color: { light: "#8f00b7", dark: "#e37eff" },
    badgeClassname:
      "bg-[#e37eff] dark:bg-[#8f00b7] dark:text-[#e37eff] text-[#8f00b7]",
    iconClassname: "rounded-lg",
  },
  parallel: {
    name: "Parallel",
    color: { light: "#830059", dark: "#ffc5ed" },
    badgeClassname:
      "bg-[#ffc5ed] dark:bg-[#830059] dark:text-[#ffc5ed] text-[#830059]",
  },
  pegglecoin: {
    name: "Pegglecoin",
    color: { light: "#f59e0b", dark: "#fbbf24" },
    badgeClassname:
      "bg-[#f59e0b] dark:bg-[#fbbf24] dark:text-[#f59e0b] text-[#fbbf24]",
  },
  phala: {
    name: "Phala",
    color: { light: "#20a42f", dark: "#00ff1e" },
    badgeClassname:
      "bg-[#00ff1e] dark:bg-[#20a42f] dark:text-[#00ff1e] text-[#20a42f]",
  },
  plume: {
    name: "Plume",
    color: { light: "#FF3D00", dark: "#FF3D00" },
    badgeClassname:
      "bg-[#111111] text-[#F9F9F9] dark:bg-[#F9F9F9] dark:text-[#4a5568]",
  },
  pgn: {
    name: "PGN",
    color: { light: "#000000", dark: "#e7fff6" },
    badgeClassname:
      "bg-[#e7fff6] dark:bg-[#000000] dark:text-[#e7fff6] text-[#000000]",
  },
  polynomial: {
    name: "Polynomial",
    color: { light: "#5d741a", dark: "#bcd570" },
    badgeClassname:
      "bg-[#bcd570] dark:bg-[#5d741a] dark:text-[#bcd570] text-[#5d741a]",
  },
  powerloom: {
    name: "Powerloom",
    color: { light: "#55E794", dark: "#55E794" },
    badgeClassname:
      "bg-[#0D0F0F] text-[#F9F9F9] dark:bg-[#0D0F0F] dark:text-[#F9F9F9]",
  },
  r0ar: {
    name: "R0ar",
    color: { light: "#539632", dark: "#b0f872" },
    badgeClassname:
      "bg-[#b0f872] dark:bg-[#539632] dark:text-[#b0f872] text-[#539632]",
  },
  race: {
    name: "Race",
    color: { light: "#824800", dark: "#ffbd6d" },
    badgeClassname:
      "bg-[#fdd4a3] dark:bg-[#824800] dark:text-[#ffbd6d] text-[#824800]",
  },
  rari: {
    name: "Rari",
    color: { light: "#7b00ff", dark: "#e1cafa" },
    badgeClassname:
      "bg-[#e1cafa] dark:bg-[#7b00ff] dark:text-[#e1cafa] text-[#7b00ff]",
  },
  river: {
    name: "River",
    color: { light: "#1c1c1c", dark: "#f2e6e6" },
    badgeClassname:
      "bg-[#f2e6e6] dark:bg-[#1c1c1c] dark:text-[#f2e6e6] text-[#1c1c1c]",
  },
  scroll: {
    name: "Scroll",
    color: { light: "#d28800", dark: "#ffd689" },
    badgeClassname:
      "bg-[#ffd689] dark:bg-[#d28800] dark:text-[#ffd689] text-[#d28800]",
  },
  settlus: {
    name: "Settlus",
    color: { light: "#2d3748", dark: "#e2e8f0" },
    badgeClassname:
      "bg-[#005650] dark:bg-[#e2e8f0] dark:text-[#2d3748] text-[#e2e8f0]",
  },
  shape: {
    name: "Shape",
    color: { light: "#cccaca", dark: "#cccaca" },
    badgeClassname: "bg-[#cccaca] dark:bg-[#cccaca] text-black",
  },
  snaxchain: {
    name: "Snax Chain",
    color: { light: "#0089de", dark: "#bedfff" },
    badgeClassname:
      "bg-[#bedfff] dark:bg-[#0089de] dark:text-[#bedfff] text-[#0089de]",
  },
  soneium: {
    name: "Soneium",
    color: { light: "#434242", dark: "#b5b1b1" },
    badgeClassname:
      "bg-[#b5b1b1] dark:bg-[#434242] dark:text-[#b5b1b1] text-[#434242]",
  },
  spire: {
    name: "Spire",
    color: { light: "#1a202c", dark: "#f7fafc" },
    badgeClassname:
      "bg-[#1a202c] dark:bg-[#f7fafc] dark:text-[#1a202c] text-[#f7fafc]",
  },
  starknet: {
    name: "Starknet",
    color: { light: "#d6bcfa", dark: "#6b21a8" },
    badgeClassname:
      "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300",
  },
  superlumio: {
    name: "Superlumio",
    color: { light: "#2f1364", dark: "#c198ff" },
    badgeClassname:
      "bg-[#c198ff] dark:bg-[#2f1364] dark:text-[#c198ff] text-[#2f1364]",
  },
  superseed: {
    name: "SuperSeed",
    color: { light: "#000000", dark: "#e6e6e6" },
    badgeClassname:
      "bg-[#706ae0] dark:bg-[#000000] dark:text-[#e6e6e6] text-[#000000]",
  },
  swanchain: {
    name: "Swan Chain",
    color: { light: "#270094", dark: "#9e99fc" },
    badgeClassname:
      "bg-[#4400ff] dark:bg-[#270094] dark:text-[#9e99fc] text-[#8f89f1]",
  },
  swellchain: {
    name: "Swell Chain",
    color: { light: "#001974", dark: "#a4b8ff" },
    badgeClassname:
      "bg-[#a4b8ff] dark:bg-[#001974] dark:text-[#a4b8ff] text-[#001974]",
  },
  symbiosis: {
    name: "Symbiosis",
    color: { light: "#8448ff", dark: "#75FB6E" },
    badgeClassname:
      "bg-[#73c56f] text-[#75FB6E] dark:bg-[#3f853b] dark:text-[#75FB6E]",
  },
  taiko: {
    name: "Taiko",
    color: { light: "#97266d", dark: "#fbb6ce" },
    badgeClassname:
      "bg-pink-300 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  },
  thebinaryholdings: {
    name: "The Binary Holdings",
    color: { light: "#4a9c34", dark: "#b9f7a8" },
    badgeClassname:
      "bg-[#b9f7a8] dark:bg-[#4a9c34] dark:text-[#b9f7a8] text-[#4a9c34]",
    iconClassname: "h-3 w-3",
  },
  unichain: {
    name: "UniChain",
    color: { light: "#8d0086", dark: "#f7a8f3" },
    badgeClassname:
      "bg-[#f7a8f3] dark:bg-[#8d0086] dark:text-[#f7a8f3] text-[#8d0086]",
  },
  world: {
    name: "World",
    color: { light: "#029e9e", dark: "#93dcf8" },
    badgeClassname:
      "bg-[#93dcf8] dark:bg-[#029e9e] dark:text-[#93dcf8] text-[#029e9e]",
  },
  xga: {
    name: "XGA",
    color: { light: "#2b2727", dark: "#f5eeee" },
    badgeClassname:
      "bg-[#f5eeee] dark:bg-[#2b2727] dark:text-[#f5eeee] text-[#2b2727]",
    iconClassname: "rounded-xl bg-gray-200 dark:bg-white h-[18px] w-[18px]",
  },
  zeronetwork: {
    name: "Zero Network",
    color: { light: "#800020", dark: "#fa92ac" },
    badgeClassname:
      "bg-[#fa92ac] dark:bg-[#800020] dark:text-[#ff789a] text-[#800020]",
  },
  zircuit: {
    name: "Zircuit",
    color: { light: "#587351", dark: "#dcead5" },
    badgeClassname:
      "bg-[#dcead5] dark:bg-[#587351] dark:text-[#dcead5] text-[#587351]",
  },
  zora: {
    name: "Zora",
    color: { light: "#0f3197", dark: "#94afff" },
    badgeClassname:
      "bg-[#94afff] dark:bg-[#0f3197] dark:text-[#94afff] text-[#0f3197]",
  },
  zksync: {
    name: "zkSync",
    color: { light: "#1b2f6b", dark: "#6a8fff" },
    badgeClassname:
      "bg-[#6a8fff] dark:bg-[#1b2f6b] dark:text-[#6a8fff] text-[#1b2f6b]",
  },
};
