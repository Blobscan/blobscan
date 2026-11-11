import type { CSSProperties, FC } from "react";
import cn from "classnames";

import type { ResourceDefinition } from "~/types/definition";
import { Badge } from "./Badge";
import type { BadgeProps } from "./Badge";

type BrandColor = ResourceDefinition["color"];

export function getBrandColorStyle(color: BrandColor) {
  return {
    "--brand-color-light": color.light,
    "--brand-color-dark": color.dark,
  } as CSSProperties;
}

export const BrandBadge: FC<BadgeProps & { brandColor: BrandColor }> = ({
  brandColor,
  className,
  style,
  ...props
}) => (
  <Badge
    {...props}
    className={cn(
      "border border-[var(--brand-color-light)] bg-[color-mix(in_srgb,var(--brand-color-light)_12%,white)] text-content-light dark:border-[var(--brand-color-dark)] dark:bg-[color-mix(in_srgb,var(--brand-color-dark)_18%,#1F1F32)] dark:text-content-dark",
      className
    )}
    style={{ ...getBrandColorStyle(brandColor), ...style }}
  />
);
