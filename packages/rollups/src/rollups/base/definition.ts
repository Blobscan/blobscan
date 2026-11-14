import type { RollupDefinition } from "../../types";

export default {
  name: "Base",
  color: {
    light: "#5C5CFF",
    dark: "#3C8AFF",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0x5050f69a9786f081509234f1a7f4684b5e5b76c9"],
    "11155111": [
      "0xfc56e7272eebbba5bc6c544e159483c4a38f8ba3",
      "0x6cdebe940bc0f26850285caca097c11c33103e47",
    ],
  },
} satisfies RollupDefinition;
