import React, { Fragment } from "react";
import dynamic from "next/dynamic";

import { ROLLUP_DEFINITIONS } from "~/defintions/rollups";
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
  const {
    color,
    iconClassname,
    name,
    iconSrc = `${rollup}.svg`,
  } = ROLLUP_DEFINITIONS[rollup];

  const countLabel = `${name}: ${amount} ${
    amount === 1 ? "transaction" : "transactions"
  }`;

  const rollupIcon = (
    <div
      className="relative text-[var(--brand-color-light)] dark:text-[var(--brand-color-dark)]"
      style={getBrandColorStyle(color)}
    >
      <Icon
        src={
          iconSrc.startsWith("/")
            ? iconSrc
            : dynamic(() => import(`~/icons/rollups/${iconSrc}`))
        }
        title={name}
        className={iconClassname}
        size={props.size ?? "md"}
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
