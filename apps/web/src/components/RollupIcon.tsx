import Image from "next/image";

import { ICONS } from "~/icons/rollups";
import { ICON_CLASSES } from "~/styles";
import type { Rollup, Size } from "~/types";
import { capitalize } from "~/utils";

export type RollupIconProps = {
  rollup: Rollup;
  size?: Size;
};

const ROLLUP_CUSTOM_STYLES: Partial<Record<Rollup, string>> = {
  ancient8: "rounded-lg bg-green-500",
  arenaz: "rounded-xl ",
  mantle: "rounded-lg",
  metamail: "text-blue-500",
  mode: "text-[#ceb245] dark:text-[#ffd940]",
  morph: "text-[#f7f7f7] dark:text-[#000000]",
  nanonnetwork: "rounded-lg",
  paradex: "rounded-lg",
  thebinaryholdings: "h-3 w-3",
  xga: "rounded-xl bg-gray-200 dark:bg-white h-[18px] w-[18px]",
};

export const RollupIcon: React.FC<RollupIconProps> = ({
  rollup,
  size = "md",
}) => {
  const customStyles = ROLLUP_CUSTOM_STYLES[rollup] ?? "";
  const iconSizeStyles = ICON_CLASSES[size] || "";
  const RollupImage = ICONS[rollup];

  if (!RollupImage) {
    return <div className={iconSizeStyles.tailwindClasses}></div>;
  }

  return (
    <div
      className={`${iconSizeStyles.tailwindClasses} flex items-center`}
      title={capitalize(rollup)}
    >
      {typeof RollupImage === "string" ? (
        <Image
          alt={capitalize(rollup)}
          width={iconSizeStyles.css.width}
          height={iconSizeStyles.css.height}
          src={RollupImage}
          className={customStyles}
        />
      ) : (
        <RollupImage className={`${iconSizeStyles} ${customStyles}`} />
      )}
    </div>
  );
};
