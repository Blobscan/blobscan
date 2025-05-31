import type { Rollup } from "@blobscan/db/prisma/enums";

export const ROLLUP_REGISTRY: Record<
  Lowercase<Rollup>,
  { label: string; color: { light: string; dark: string } }
> = {
  abstract: {
    label: "Abstract",
    color: {
      light: "#195b3b",
      dark: "#7dffc0",
    },
  },
  aevo: {
    label: "Aevo",
    color: {
      light: "#291f3f",
      dark: "#d8c9fa",
    },
  },
  ancient8: {
    label: "Ancient8",
    color: {
      light: "#3b4e0b",
      dark: "#d8ff76",
    },
  },
  arbitrum: {
    label: "Arbitrum",
    color: {
      light: "#12537e",
      dark: "#80cffc",
    },
  },
  arenaz: {
    label: "ArenaZ",
    color: {
      light: "#2c00bb",
      dark: "#b19aff",
    },
  },
  base: {
    label: "Base",
    color: {
      light: "#2242a1",
      dark: "#88a6ff",
    },
  },
  blast: {
    label: "Blast",
    color: {
      light: "#9d9245",
      dark: "#e4d341",
    },
  },
  bob: {
    label: "BoB",
    color: {
      light: "#e4d341",
      dark: "#9d9245",
    },
  },
  boba: {
    label: "Boba",
    color: {
      light: "#648314",
      dark: "#cdff03",
    },
  },
  camp: {
    label: "Camp",
    color: {
      light: "#8c4b1f",
      dark: "#ffc79b",
    },
  },
  debankchain: {
    label: "DeBank Chain",
    color: {
      light: "#87592a",
      dark: "#f7d2a8",
    },
  },
  ethernity: {
    label: "Ethernity",
    color: {
      light: "#6a2aff",
      dark: "#00e8c2",
    },
  },
  fraxtal: {
    label: "Fraxtal",
    color: {
      light: "#013280",
      dark: "#5e9cff",
    },
  },
  fuel: {
    label: "Fuel",
    color: {
      light: "#00a75f",
      dark: "#9dffbf",
    },
  },
  hashkey: {
    label: "HashKey",
    color: {
      light: "#9c4899",
      dark: "#f573f0",
    },
  },
  hemi: {
    label: "Hemi",
    color: {
      light: "#844b04",
      dark: "#ffb272",
    },
  },
  hypr: {
    label: "Hypr",
    color: {
      light: "#8c1f1f",
      dark: "#f7a8a8",
    },
  },
  infinaeon: {
    label: "Infinaeon",
    color: {
      light: "#007b7f",
      dark: "#7dfbff",
    },
  },
  ink: {
    label: "Ink",
    color: {
      light: "#2f1176",
      dark: "#c0a9f6",
    },
  },
  karak: {
    label: "Karak",
    color: {
      light: "#8c501f",
      dark: "#f7d2a8",
    },
  },
  kinto: {
    label: "Kinto",
    color: {
      light: "#949292",
      dark: "#dfd7d7",
    },
  },
  kroma: {
    label: "Kroma",
    color: {
      light: "#16822a",
      dark: "#1fb63a",
    },
  },
  lambda: {
    label: "Lambda",
    color: {
      light: "#3f4ae1",
      dark: "#c5c9ff",
    },
  },
  linea: {
    label: "Linea",
    color: {
      light: "#878119",
      dark: "#efe52b",
    },
  },
  lisk: {
    label: "Lisk",
    color: {
      light: "#7b1b0a",
      dark: "#e84d31",
    },
  },
  manta: {
    label: "Manta",
    color: {
      light: "#2770ab",
      dark: "#32e7ff",
    },
  },
  mantle: {
    label: "Mantle",
    color: {
      light: "#008F6A",
      dark: "#65B3AE",
    },
  },
  metal: {
    label: "Metal",
    color: {
      light: "#69439c",
      dark: "#dbc0ff",
    },
  },
  metamail: {
    label: "MetaMail",
    color: {
      light: "#135490",
      dark: "#c5e0f9",
    },
  },
  metis: {
    label: "Metis",
    color: {
      light: "#5d878b",
      dark: "#c0fbfd",
    },
  },
  mint: {
    label: "Mint",
    color: {
      light: "#3d8141",
      dark: "#75ff7c",
    },
  },
  mode: {
    label: "Mode",
    color: {
      light: "#8c8c35",
      dark: "#ffff5d",
    },
  },
  morph: {
    label: "Morph",
    color: {
      light: "#176800",
      dark: "#3bff04",
    },
  },
  nal: {
    label: "NAL",
    color: {
      light: "#1c1e1f",
      dark: "#e5eef4",
    },
  },
  nanonnetwork: {
    label: "Nanon Network",
    color: {
      light: "#132874",
      dark: "#7793fb",
    },
  },
  opbnb: {
    label: "opBNB",
    color: {
      light: "#7a745f",
      dark: "#f8ebbf",
    },
  },
  optimism: {
    label: "Optimism",
    color: {
      light: "#ff3232",
      dark: "#ffb2b2",
    },
  },
  optopia: {
    label: "Optopia",
    color: {
      light: "#8c0101",
      dark: "#ff9292",
    },
  },
  orderly: {
    label: "Orderly",
    color: {
      light: "#6f27ff",
      dark: "#d4bfff",
    },
  },
  pandasea: {
    label: "PandaSea",
    color: {
      light: "#7e00a1",
      dark: "#f6d4ff",
    },
  },
  paradex: {
    label: "Paradex",
    color: {
      light: "#8f00b7",
      dark: "#e37eff",
    },
  },
  parallel: {
    label: "Parallel",
    color: {
      light: "#830059",
      dark: "#ffc5ed",
    },
  },
  phala: {
    label: "Phala",
    color: {
      light: "#20a42f",
      dark: "#00ff1e",
    },
  },
  pgn: {
    label: "PGN",
    color: {
      light: "#000000",
      dark: "#e7fff6",
    },
  },
  polynomial: {
    label: "Polynomial",
    color: {
      light: "#5d741a",
      dark: "#bcd570",
    },
  },
  r0ar: {
    label: "R0ar",
    color: {
      light: "#539632",
      dark: "#b0f872",
    },
  },
  race: {
    label: "Race",
    color: {
      light: "#824800",
      dark: "#ffbd6d",
    },
  },
  rari: {
    label: "Rari",
    color: {
      light: "#7b00ff",
      dark: "#e1cafa",
    },
  },
  river: {
    label: "River",
    color: {
      light: "#1c1c1c",
      dark: "#f2e6e6",
    },
  },
  scroll: {
    label: "Scroll",
    color: {
      light: "#d28800",
      dark: "#ffd689",
    },
  },
  shape: {
    label: "Shape",
    color: {
      light: "#cccaca",
      dark: "#cccaca",
    },
  },
  snaxchain: {
    label: "Snax Chain",
    color: {
      light: "#0089de",
      dark: "#bedfff",
    },
  },
  soneium: {
    label: "Soneium",
    color: {
      light: "#434242",
      dark: "#b5b1b1",
    },
  },
  starknet: {
    label: "Starknet",
    color: {
      light: "#d6bcfa",
      dark: "#6b21a8",
    },
  },
  superlumio: {
    label: "Superlumio",
    color: {
      light: "#2f1364",
      dark: "#c198ff",
    },
  },
  superseed: {
    label: "SuperSeed",
    color: {
      light: "#000000",
      dark: "#e6e6e6",
    },
  },
  swanchain: {
    label: "Swan Chain",
    color: {
      light: "#270094",
      dark: "#9e99fc",
    },
  },
  swellchain: {
    label: "Swell Chain",
    color: {
      light: "#001974",
      dark: "#a4b8ff",
    },
  },
  taiko: {
    label: "Taiko",
    color: {
      light: "#97266d",
      dark: "#fbb6ce",
    },
  },
  thebinaryholdings: {
    label: "The Binary Holdings",
    color: {
      light: "#4a9c34",
      dark: "#b9f7a8",
    },
  },
  unichain: {
    label: "UniChain",
    color: {
      light: "#8d0086",
      dark: "#f7a8f3",
    },
  },
  world: {
    label: "World",
    color: {
      light: "#029e9e",
      dark: "#93dcf8",
    },
  },
  xga: {
    label: "XGA",
    color: {
      light: "#2b2727",
      dark: "#f5eeee",
    },
  },
  zeronetwork: {
    label: "Zero Network",
    color: {
      light: "#800020",
      dark: "#fa92ac",
    },
  },
  zircuit: {
    label: "Zircuit",
    color: {
      light: "#587351",
      dark: "#dcead5",
    },
  },
  zora: {
    label: "Zora",
    color: {
      light: "#0f3197",
      dark: "#94afff",
    },
  },
  zksync: {
    label: "zkSync",
    color: {
      light: "#1b2f6b",
      dark: "#6a8fff",
    },
  },
};
