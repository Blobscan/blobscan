import type { Config } from "tailwindcss";

import { baseColors, semanticColors } from "./colors";

export default {
  content: [""],
  darkMode: "class",
  theme: {
    colors: {
      ...baseColors,
      ...semanticColors,
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
