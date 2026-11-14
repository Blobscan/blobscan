import type { RollupDefinition } from "../../types";

export default {
  name: "Paradex",
  color: {
    light: "#C476DD",
    dark: "#D778F0",
  },
  iconClassname: "rounded-lg",
  icon: "icon.svg",
  blobPosters: {
    "1": [
      "0xc70ae19b5feaa5c19f576e621d2bad9771864fe2",
      "0x09d1ad25b369a0c48bdf4caab85afd08a3f07044",
    ],
  },
} satisfies RollupDefinition;
