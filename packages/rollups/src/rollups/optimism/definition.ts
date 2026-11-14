import type { RollupDefinition } from "../../types";

export default {
  name: "Optimism",
  color: {
    light: "#FF5E71",
    dark: "#FF5C70",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0x6887246668a3b87f54deb3b94ba47a6f63f32985"],
    "11155111": [
      "0x8f23bb38f531600e5d8fddaaec41f13fab46e98c",
      "0xdf50ccaa4467b61b51d8ed86320d8ca67a56265e",
      "0xe14b3f075ad9377689daf659e04a2a99a4acede4",
    ],
  },
} satisfies RollupDefinition;
