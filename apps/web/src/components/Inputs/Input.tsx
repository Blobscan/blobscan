import type { FC, InputHTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const inputVariants = cva(
  `
  block
  w-full
  rounded-md
  p-0.5
  px-2
  border
  transition-colors
  focus:ring-0
  shadow-lg
placeholder:text-hint-light
hover:border-controlBorderHighlight-light
focus:border-accentHighlight-light
dark:placeholder:text-hint-dark
dark:hover:border-controlBorderHighlight-dark
dark:focus:border-accentHighlight-dark
  `,
  {
    variants: {
      variant: {
        filled: `
        bg-controlBackground-light
        dark:bg-controlBackground-dark
          border-transparent
        `,
        outline: `
        bg-controlBackground-light
        dark:bg-background-dark
        dark:border-border-dark
        border-border-light
        `,
      },
    },
  }
);

export type InputProps =
  | InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof inputVariants>;

export const Input: FC<InputProps> = function ({
  className,
  variant,
  ...props
}) {
  return (
    <input
      className={twMerge(inputVariants({ variant }), className)}
      {...props}
    />
  );
};
