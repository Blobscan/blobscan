import type { FC } from "react";
import { twMerge } from "tailwind-merge";

export const SurfaceCardBase: FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={twMerge(
      `
    dark:bg-neutral-850
    truncate
    rounded-md
    border
    border-border-light
    p-4
    dark:border-border-dark
    `,
      className
    )}
    {...props}
  />
);
