import React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const badgeVariants = cva(
  `
    w-fit
    flex
    items-center
    gap-1.5
    rounded-full
    px-2.5
    py-0.5
    transition-colors
  `,
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-md",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export const Badge: React.FC<BadgeProps> = ({
  className,
  size,
  children,
  ...props
}) => {
  return (
    <div className={twMerge(badgeVariants({ size }), className)} {...props}>
      {children}
    </div>
  );
};
