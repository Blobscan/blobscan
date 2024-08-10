import type { Config } from "tailwindcss";

import baseConfig from "@blobscan/tailwind-config";

export default {
  content: [
    "./src/**/*.tsx",
    "../../node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  presets: [baseConfig],
} satisfies Config;
