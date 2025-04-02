import React from "react";
import { useTheme } from "next-themes";

import { ROLLUP_REGISTRY } from "@blobscan/rollups";

import type { Rollup } from "~/types";
import { capitalize } from "~/utils";
import { RollupIcon } from "../RollupIcon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

type RollupBadgeProps = BadgeProps & {
  rollup: Rollup;
};

export const RollupBadge: React.FC<RollupBadgeProps> = ({
  rollup,
  ...props
}) => {
  const { resolvedTheme } = useTheme();
  const { label, color } = ROLLUP_REGISTRY[rollup];
  const backgroundColor = color[resolvedTheme === "dark" ? "light" : "dark"];
  const textColor = color[resolvedTheme === "dark" ? "dark" : "light"];

  return (
    <Badge style={{ backgroundColor, color: textColor }} {...props}>
      <RollupIcon rollup={rollup} />
      {label ?? capitalize(rollup)}
    </Badge>
  );
};
