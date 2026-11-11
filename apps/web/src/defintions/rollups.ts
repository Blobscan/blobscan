import type { ResourceDefinition } from "~/types/definition";
import type { Rollup } from "../types";

export const ROLLUP_DEFINITIONS: Record<
  Rollup,
  Omit<ResourceDefinition, "badgeClassname">
> = {
  abstract: {
    name: "Abstract",
    color: { light: "#5CB48B", dark: "#34D98B" },
  },
  adi: {
    name: "ADI Chain",
    color: { light: "#939393", dark: "#C9CDD2" },
    iconClassname: "rounded-full bg-white",
  },
  aevo: {
    name: "Aevo",
    color: { light: "#A990CF", dark: "#B597E6" },
  },
  ancient8: {
    name: "Ancient8",
    color: { light: "#9AAD73", dark: "#B9D96B" },
    iconClassname: "rounded-lg bg-green-500",
  },
  arbitrum: {
    name: "Arbitrum",
    color: { light: "#5DA1EF", dark: "#10E1FF" },
  },
  arenaz: {
    name: "ArenaZ",
    color: { light: "#9A7EDD", dark: "#A68AE8" },
    iconClassname: "rounded-xl",
  },
  aztec: {
    name: "Aztec",
    color: { light: "#9EAC68", dark: "#C5DF5E" },
  },
  base: {
    name: "Base",
    color: { light: "#5C5CFF", dark: "#3C8AFF" },
  },
  blast: {
    name: "Blast",
    color: { light: "#B4AB5C", dark: "#E4DA36" },
  },
  bob: {
    name: "BoB",
    color: { light: "#D99E5A", dark: "#F5A13A" },
  },
  boba: {
    name: "Boba",
    color: { light: "#A1B362", dark: "#B8D84B" },
  },
  camp: {
    name: "Camp",
    color: { light: "#DD9363", dark: "#FF964F" },
  },
  codex: {
    name: "Codex",
    color: { light: "#8C8F95", dark: "#C5CAD2" },
  },
  debankchain: {
    name: "DeBank Chain",
    color: { light: "#E18D7C", dark: "#FF8E73" },
  },
  ethernity: {
    name: "Ethernity",
    color: { light: "#5CB4A8", dark: "#45D9BE" },
  },
  flynet: {
    name: "Flynet",
    color: { light: "#93969D", dark: "#BFC5D0" },
  },
  fraxtal: {
    name: "Fraxtal",
    color: { light: "#769BD3", dark: "#7AA7EB" },
  },
  fuel: {
    name: "Fuel",
    color: { light: "#5CB28F", dark: "#35D99B" },
  },
  gravity: {
    name: "Gravity",
    color: { light: "#D69775", dark: "#EB9A66" },
  },
  hashkey: {
    name: "HashKey",
    color: { light: "#C288C1", dark: "#D986D4" },
  },
  hemi: {
    name: "Hemi",
    color: { light: "#DF9365", dark: "#FF9858" },
  },
  hpp: {
    name: "HPP",
    color: { light: "#9F9FD4", dark: "#A4A4E4" },
  },
  hypr: {
    name: "Hypr",
    color: { light: "#D67A80", dark: "#E8797E" },
  },
  infinaeon: {
    name: "Infinaeon",
    color: { light: "#5CB1B5", dark: "#56CED5" },
    iconSrc: "/rollups/infinaeon.png",
  },
  ink: {
    name: "Ink",
    color: { light: "#A57CE6", dark: "#AD85EF" },
  },
  karak: {
    name: "Karak",
    color: { light: "#D7915C", dark: "#ED9652" },
  },
  katana: {
    name: "Katana",
    color: { light: "#6896D3", dark: "#55A8ED" },
  },
  kinto: {
    name: "Kinto",
    color: { light: "#9E9EA1", dark: "#BFC0C7" },
  },
  kroma: {
    name: "Kroma",
    color: { light: "#8FB36F", dark: "#98CF61" },
  },
  lambda: {
    name: "Lambda",
    color: { light: "#9296DA", dark: "#A2A6EF" },
    iconSrc: "/rollups/lambda.png",
  },
  lachain: {
    name: "LaChain",
    color: { light: "#E17EA7", dark: "#EE80AC" },
    iconClassname: "rounded-lg",
    iconSrc: "/rollups/lachain.jpg",
  },
  lighter: {
    name: "Lighter",
    color: { light: "#7E8187", dark: "#C7CEDA" },
  },
  linea: {
    name: "Linea",
    color: { light: "#AFAB66", dark: "#DCD34C" },
  },
  lisk: {
    name: "Lisk",
    color: { light: "#CF897B", dark: "#E58C72" },
  },
  manta: {
    name: "Manta",
    color: { light: "#5CB6C9", dark: "#4AD4E9" },
    iconSrc: "/rollups/manta.png",
  },
  mantle: {
    name: "Mantle",
    color: { light: "#71B2AC", dark: "#70C3B9" },
    iconClassname: "rounded-lg",
  },
  metal: {
    name: "Metal",
    color: { light: "#A181DA", dark: "#AE8DE5" },
  },
  metamail: {
    name: "MetaMail",
    color: { light: "#7AA2C6", dark: "#90BDE2" },
  },
  metis: {
    name: "Metis",
    color: { light: "#5CB3C4", dark: "#64C8DD" },
  },
  mint: {
    name: "Mint",
    color: { light: "#73B389", dark: "#69CE8B" },
  },
  mode: {
    name: "Mode",
    color: { light: "#BAA85C", dark: "#E4C34F" },
  },
  morph: {
    name: "Morph",
    color: { light: "#7CAF6C", dark: "#76CA54" },
  },
  nal: {
    name: "NAL",
    color: { light: "#888D93", dark: "#C5CED8" },
  },
  nanonnetwork: {
    name: "Nanon Network",
    color: { light: "#8093CE", dark: "#8C9EE3" },
    iconClassname: "rounded-lg",
  },
  opbnb: {
    name: "opBNB",
    color: { light: "#C0A85C", dark: "#E7C351" },
  },
  optimism: {
    name: "Optimism",
    color: { light: "#FF5E71", dark: "#FF5C70" },
  },
  optopia: {
    name: "Optopia",
    color: { light: "#DD7A81", dark: "#EF8B93" },
  },
  orderly: {
    name: "Orderly",
    color: { light: "#A982DF", dark: "#B28BE8" },
    iconSrc: "/rollups/orderly.png",
  },
  pandasea: {
    name: "PandaSea",
    color: { light: "#BA84CA", dark: "#CF9EE1" },
    iconSrc: "/rollups/pandasea.png",
  },
  paradex: {
    name: "Paradex",
    color: { light: "#C476DD", dark: "#D778F0" },
    iconClassname: "rounded-lg",
  },
  parallel: {
    name: "Parallel",
    color: { light: "#CE88AC", dark: "#E59CBD" },
  },
  pegglecoin: {
    name: "Pegglecoin",
    color: { light: "#CEA457", dark: "#E9BD55" },
  },
  phala: {
    name: "Phala",
    color: { light: "#A0B366", dark: "#C3DB6A" },
  },
  plume: {
    name: "Plume",
    color: { light: "#E8836A", dark: "#F58160" },
  },
  pgn: {
    name: "PGN",
    color: { light: "#858C8A", dark: "#C3D8CD" },
  },
  polynomial: {
    name: "Polynomial",
    color: { light: "#A3B366", dark: "#C4DA68" },
  },
  powerloom: {
    name: "Powerloom",
    color: { light: "#73B594", dark: "#6BD69E" },
  },
  r0ar: {
    name: "R0ar",
    color: { light: "#8CB079", dark: "#A0CE7A" },
  },
  race: {
    name: "Race",
    color: { light: "#C09B84", dark: "#D4A17B" },
  },
  rari: {
    name: "Rari",
    color: { light: "#B78CE3", dark: "#C394ED" },
  },
  river: {
    name: "River",
    color: { light: "#938F96", dark: "#CFC7D3" },
  },
  robinhood: {
    name: "Robinhood Chain",
    color: { light: "#68AF7E", dark: "#78D78C" },
  },
  scroll: {
    name: "Scroll",
    color: { light: "#C4A585", dark: "#DBB487" },
  },
  settlus: {
    name: "Settlus",
    color: { light: "#76A8A2", dark: "#83BDB3" },
  },
  shape: {
    name: "Shape",
    color: { light: "#9C9C9F", dark: "#C6C6CE" },
  },
  snaxchain: {
    name: "Snax Chain",
    color: { light: "#5CB6CA", dark: "#63CFE7" },
  },
  soneium: {
    name: "Soneium",
    color: { light: "#93959A", dark: "#B5BBC6" },
  },
  spire: {
    name: "Spire",
    color: { light: "#77A5CF", dark: "#7CBAE9" },
  },
  starknet: {
    name: "Starknet",
    color: { light: "#DA9992", dark: "#EC9589" },
  },
  superlumio: {
    name: "Superlumio",
    color: { light: "#C47EC0", dark: "#D98DD0" },
  },
  superseed: {
    name: "SuperSeed",
    color: { light: "#9993C8", dark: "#A9A2DD" },
  },
  swanchain: {
    name: "Swan Chain",
    color: { light: "#7E9CDC", dark: "#85A9ED" },
  },
  swellchain: {
    name: "Swell Chain",
    color: { light: "#7B96D6", dark: "#8B9FE4" },
  },
  symbiosis: {
    name: "Symbiosis",
    color: { light: "#83B381", dark: "#96D58B" },
  },
  syndicate: {
    name: "Syndicate",
    color: { light: "#959298", dark: "#CBC4D3" },
    iconClassname: "rounded-full bg-white",
  },
  taiko: {
    name: "Taiko",
    color: { light: "#DA73B1", dark: "#EA7BB9" },
  },
  thebinaryholdings: {
    name: "The Binary Holdings",
    color: { light: "#88AF82", dark: "#9ACB91" },
    iconClassname: "h-3 w-3",
  },
  unichain: {
    name: "UniChain",
    color: { light: "#E85CB6", dark: "#FF64C4" },
  },
  world: {
    name: "World",
    color: { light: "#73ACBA", dark: "#7EC9DB" },
  },
  xga: {
    name: "XGA",
    color: { light: "#9A9393", dark: "#D3C6C3" },
    iconClassname: "rounded-xl bg-gray-200 dark:bg-white h-[18px] w-[18px]",
  },
  xlayer: {
    name: "X Layer",
    color: { light: "#909396", dark: "#C5C9D0" },
  },
  zeronetwork: {
    name: "Zero Network",
    color: { light: "#E58292", dark: "#ED899A" },
  },
  zircuit: {
    name: "Zircuit",
    color: { light: "#8CB18C", dark: "#A2C996" },
  },
  zora: {
    name: "Zora",
    color: { light: "#80A1E1", dark: "#89AAED" },
  },
  zksync: {
    name: "zkSync",
    color: { light: "#818CAB", dark: "#99A8D2" },
  },
};
