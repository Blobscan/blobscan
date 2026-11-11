import type { FC } from "react";
import {
  Squares2X2Icon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";

import { CATEGORY_OPTIONS } from "~/components/Selectors/CategorySelector";
import { CATEGORY_COLORS } from "~/defintions/categories";
import type { Category, Rollup } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { BrandBadge } from "./BrandBadge";
import { RollupBadge } from "./RollupBadge";

const CATEGORY_STYLES: Record<Category, { icon: RenderableIcon }> = {
  rollup: {
    icon: Square3Stack3DIcon,
  },
  other: {
    icon: Squares2X2Icon,
  },
};

type CategoryBadgeProps = BadgeProps & {
  category: Category;
  /**
   * Show the rollup badge after the category label.
   */
  rollup?: Rollup;
};

export const CategoryBadge: FC<CategoryBadgeProps> = function ({
  category,
  rollup,
  className,
  ...props
}) {
  const { icon } = CATEGORY_STYLES[category];
  const label =
    CATEGORY_OPTIONS.find(({ value }) => value === category)?.label ?? category;
  const subRollup = category === "rollup" ? rollup : undefined;

  return (
    <div className="flex items-center gap-2">
      <BrandBadge
        brandColor={CATEGORY_COLORS[category]}
        className={className}
        {...props}
      >
        <Icon src={icon} size="sm" />
        {label}
      </BrandBadge>
      {subRollup && <RollupBadge rollup={subRollup} size={props.size} />}
    </div>
  );
};
