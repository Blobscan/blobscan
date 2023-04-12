import type { Config } from "tailwindcss";

import baseConfig from "@blobscan/tailwind-config";

export default {
  content: ["./src/**/*.tsx"],
  presets: [baseConfig],
} satisfies Config;
