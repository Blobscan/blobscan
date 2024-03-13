import type { ReactNode } from "react";
import React from "react";

import type { Size } from "~/types";

type BadgeProps = {
  className?: string;
  label: string;
  icon?: ReactNode;
  size?: Size;
};

const BADGE_STYLES: Record<
  Size,
  { labelStyles: string; containerStyles?: string }
> = {
  xs: {
    labelStyles: "text-xs",
    containerStyles: "py-1",
  },
  sm: {
    labelStyles: "text-sm",
  },
  md: {
    labelStyles: "text-md",
  },
  lg: {
    labelStyles: "text-lg",
  },
  xl: {
    labelStyles: "text-lg",
  },
  "2xl": {
    labelStyles: "text-lg",
  },
};

export const Badge: React.FC<BadgeProps> = ({
  className = "",
  label,
  icon,
  size = "md",
}) => {
  const { labelStyles, containerStyles } = BADGE_STYLES[size];

  return (
    <div
      className={`flex w-fit items-center rounded-full px-2.5 ${
        containerStyles ?? "py-0.5"
      } ${className}`}
    >
      <div className="flex items-center text-content-light dark:text-content-dark">
        {icon}
        <div className={`${labelStyles} ml-2`}>{label}</div>
      </div>
    </div>
  );
};
