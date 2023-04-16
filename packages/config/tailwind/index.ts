import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

import { baseColors, semanticColors } from "./colors";

export default {
  content: [""],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ...baseColors,
        ...semanticColors,
      },
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@headlessui/tailwindcss")],
} satisfies Config;
