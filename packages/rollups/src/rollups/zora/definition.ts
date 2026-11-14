import type { RollupDefinition } from "../../types";

export default {
  name: "Zora",
  color: {
    light: "#80A1E1",
    dark: "#89AAED",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0x625726c858dbf78c0125436c943bf4b4be9d9033"],
    "11155111": ["0x3cd868e221a3be64b161d596a7482257a99d857f"],
  },
} satisfies RollupDefinition;
