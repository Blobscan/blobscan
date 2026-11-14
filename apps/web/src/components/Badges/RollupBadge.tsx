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
  amount,
  ...props
}) => {
  const { color, iconClassname, name }: RollupDefinition =
    ROLLUP_DEFINITIONS[rollup];

  const countLabel = `${name}: ${amount} ${
    amount === 1 ? "transaction" : "transactions"
  }`;

  const rollupIcon = (
    <div
      className="relative text-[var(--brand-color-light)] dark:text-[var(--brand-color-dark)]"
      style={getBrandColorStyle(color)}
    >
      <Icon
        src={rollupIcons[rollup]}
        title={name}
        className={iconClassname}
        size={props.size ?? (compact ? "md" : "sm")}
      />
      {amount !== undefined && amount > 0 && (
        <div
          className="absolute -bottom-1 -right-1 flex h-[11px] min-w-[11px] items-center justify-center rounded-full bg-slate-900 px-0.5 text-[8px] font-bold leading-none text-white shadow-sm ring-1 ring-white dark:bg-slate-100 dark:text-slate-950 dark:ring-slate-900"
          aria-label={countLabel}
          title={countLabel}
        >
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
