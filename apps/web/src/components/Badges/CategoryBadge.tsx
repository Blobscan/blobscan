import type { FC } from "react";
import {
  QuestionMarkCircleIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import cn from "classnames";

import { CATEGORY_OPTIONS } from "~/components/Selectors/CategorySelector";
import type { Category, Rollup } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";
import { RollupBadge } from "./RollupBadge";

const CATEGORY_STYLES: Record<
  Category,
  { icon: RenderableIcon; className: string }
> = {
  rollup: {
    icon: Square3Stack3DIcon,
    className:
      "bg-primary-200 text-primary-800 dark:bg-primary-800 dark:text-primary-200",
  },
  other: {
    icon: QuestionMarkCircleIcon,
    className:
      "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
  },
};

type CategoryBadgeProps = BadgeProps & {
  category: Category;
  /**
   * The rollup of the category. For the rollup category, its badge shows
   * inside this badge, after the label.
   */
  rollup?: Rollup;
};

export const CategoryBadge: FC<CategoryBadgeProps> = function ({
  category,
  rollup,
  className: extraClassName,
  ...props
}) {
  const { icon, className } = CATEGORY_STYLES[category];
  const label =
    CATEGORY_OPTIONS.find(({ value }) => value === category)?.label ?? category;
  const subRollup = category === "rollup" ? rollup : undefined;

  return (
    <Badge
      // With a rollup badge inside, the padding at the end is the same as
      // the space around the rollup badge.
      className={cn(
        className,
        { "gap-2 py-1 pr-1": subRollup },
        extraClassName
      )}
      {...props}
    >
      <Icon src={icon} size="sm" />
      {label}
      {subRollup && <RollupBadge rollup={subRollup} size={props.size} />}
    </Badge>
  );
};
