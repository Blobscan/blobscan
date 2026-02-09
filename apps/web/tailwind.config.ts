import type { Config } from "tailwindcss";

import baseConfig from "@blobscan/tailwind-config";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  presets: [baseConfig],
  theme: {
    extend: {
      keyframes: {
        glow: {
          "0%, 100%": {
            boxShadow: "0px 0px 60px 43px rgba(255, 60, 0, 1)", // yellow
          },
          "50%": {
            boxShadow: "0px 0px 70px 55px rgba(255, 200, 0, 1)", // red
          },
        },
      },
      animation: {
        glow: "glow 3s ease-in-out infinite",
      },
    },
  },
} satisfies Config;
