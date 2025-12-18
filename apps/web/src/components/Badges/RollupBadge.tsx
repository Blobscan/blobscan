import React from "react";

import { ICONS } from "~/icons/rollups";
import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup } from "~/types";
import { capitalize } from "~/utils";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

type RollupBadgeProps = BadgeProps & {
  amount?: number;
  rollup: Rollup;
  compact?: boolean;
};

export const RollupBadge: React.FC<RollupBadgeProps> = ({
  compact = false,
  rollup,
  amount = 1,
  ...props
}) => {
  const { badgeStyle, iconStyle, label } = ROLLUP_STYLES[rollup];
  const rollupIconSrc = ICONS[rollup];
  const rollupIcon = rollupIconSrc ? (
    <div className="relative">
      <Icon
        src={rollupIconSrc}
        title={label}
        className={iconStyle}
        size={props.size ?? "md"}
      />
      {amount > 1 && (
        <div className="absolute -bottom-2 -right-1 text-[10px] text-black dark:text-contentSecondary-dark">
          {amount}
        </div>
      )}
    </div>
  ) : (
    <div className="h-4 w-4" />
  );

  return compact ? (
    rollupIcon
  ) : (
    <Badge className={badgeStyle} {...props}>
      {rollupIcon}
      {label}
    </Badge>
  );
};
