import type { FC } from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const variants = cva(
  `
      rounded-lg
      text-xs
      font-medium
      p-1.5
      inline-block
  
      bg-opacity-10
      dark:bg-opacity-10
  
      border
      border-opacity-30
      dark:border-opacity-30
  `,
  {
    variants: {
      variant: {
        green: `
          bg-green-600 
          text-green-600 
          border-green-600 
  
          dark:bg-green-500 
          dark:text-green-500 
          dark:border-green-500 
          `,
        gray: `
          bg-contentTertiary-light
          text-warmGray-500
          border-contentTertiary-light
          
          dark:bg-contentTertiary-dark
          dark:text-contentTertiary-dark
          dark:border-contentTertiary-dark
          `,
      },
    },
    defaultVariants: {
      variant: "green",
    },
  }
);

type Props = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof variants>;

export const Indicator: FC<Props> = ({ className, variant, ...props }) => {
  return (
    <div className={twMerge(variants({ variant }), className)} {...props} />
  );
};
