import type { RollupDefinition } from "../../types";

export default {
  name: "XGA",
  color: {
    light: "#9A9393",
    dark: "#D3C6C3",
  },
  iconClassname: "rounded-xl bg-gray-200 dark:bg-white h-[18px] w-[18px]",
  icon: "icon.svg",
  blobPosters: {
    "1": ["0x90680f0f6d63060fb7a16bdc722a85b992dd5047"],
  },
} satisfies RollupDefinition;
