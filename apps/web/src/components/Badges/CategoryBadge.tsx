import type { FC } from "react";
import {
  QuestionMarkCircleIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";

import { CATEGORY_OPTIONS } from "~/components/Selectors/CategorySelector";
import type { Category } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

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
};

export const CategoryBadge: FC<CategoryBadgeProps> = function ({
  category,
  ...props
}) {
  const { icon, className } = CATEGORY_STYLES[category];
  const label =
    CATEGORY_OPTIONS.find(({ value }) => value === category)?.label ?? category;

  return (
    <Badge className={className} {...props}>
      <Icon src={icon} size="sm" />
      {label}
    </Badge>
  );
};
