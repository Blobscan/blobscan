import React, { Fragment } from "react";

import { ROLLUP_DEFINITIONS } from "@blobscan/rollups";
import type { RollupDefinition } from "@blobscan/rollups";
import { rollupIcons } from "@blobscan/rollups/icons";

import type { Rollup } from "~/types";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { BrandBadge, getBrandColorStyle } from "./BrandBadge";

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
  const { color, iconClassname, name }: RollupDefinition =
    ROLLUP_DEFINITIONS[rollup];

  const rollupIcon = (
    <div
      className="relative text-[var(--brand-color-light)] dark:text-[var(--brand-color-dark)]"
      style={getBrandColorStyle(color)}
    >
      <Icon
        src={rollupIcons[rollup]}
        title={name}
        className={iconClassname}
        size={props.size ?? "md"}
      />
      {amount > 1 && (
        <div className="absolute -bottom-2 -right-1 text-[10px] text-black dark:text-contentSecondary-dark">
          {amount}
        </div>
      )}
    </div>
  );

  if (compact) {
    return rollupIcon;
  }

  const content = (
    <Fragment>
      {rollupIcon}
      {name}
    </Fragment>
  );

  return (
    <BrandBadge brandColor={color} {...props}>
      {content}
    </BrandBadge>
  );
};
