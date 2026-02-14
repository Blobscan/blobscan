import React, { Fragment } from "react";
import dynamic from "next/dynamic";

import { ROLLUP_DEFINITIONS } from "~/defintions/rollups";
import type { Rollup } from "~/types";
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
  const {
    badgeClassname,
    iconClassname,
    name,
    iconSrc = `${rollup}.svg`,
  } = ROLLUP_DEFINITIONS[rollup];

  const rollupIcon = (
    <div className="relative">
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
    <Badge className={badgeClassname} {...props}>
      {content}
    </Badge>
  );
};
