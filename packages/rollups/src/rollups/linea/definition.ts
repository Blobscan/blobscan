import type { RollupDefinition } from "../../types";

export default {
  name: "Linea",
  color: {
    light: "#AFAB66",
    dark: "#DCD34C",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": [
      "0xa9268341831efa4937537bc3e9eb36dbece83c7e",
      "0x46d2f319fd42165d4318f099e143dea8124e9e3e",
    ],
    "11155111": [
      "0x47c63d1e391fcb3dcdc40c4d7fa58adb172f8c38",
      "0x88584cf948cd51267f220edd9e21e67ccf3fcfa8",
    ],
  },
} satisfies RollupDefinition;
