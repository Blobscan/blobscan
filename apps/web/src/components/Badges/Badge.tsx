import React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const badgeVariants = cva(
  `
    w-fit
    shrink-0
    whitespace-nowrap
    flex
    items-center
    gap-1
    rounded-full
    px-2
    py-0
    leading-none
    transition-colors
  `,
  {
    variants: {
      variant: {
        primary: `
          border
          border-primary-500
          bg-primary-500/10
          text-content-light
          dark:bg-primary-500/20
          dark:text-content-dark
        `,
      },
      size: {
        xs: "h-5 text-[11px]",
        sm: "h-6 text-[13px]",
        md: "h-7 text-[15px]",
        lg: "h-8 text-[17px]",
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
  variant,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(badgeVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
};
