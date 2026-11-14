import type { RollupDefinition } from "../../types";

export default {
  name: "Robinhood Chain",
  color: {
    light: "#68AF7E",
    dark: "#78D78C",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0xdaa526086787d9debe1d7f3ffdb1fe50cf8687f4"],
    "11155111": ["0x6d77b3f2cfffa24e474afab0d09c1646e87a0a7b"],
  },
} satisfies RollupDefinition;
