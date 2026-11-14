import type { RollupDefinition } from "../../types";

export default {
  name: "World",
  color: {
    light: "#73ACBA",
    dark: "#7EC9DB",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0xdbbe3d8c2d2b22a2611c5a94a9a12c2fcd49eb29"],
    "11155111": ["0x0f3ff4731D7a10B89ED79AD1Fd97844d7F66B96d"],
  },
} satisfies RollupDefinition;
