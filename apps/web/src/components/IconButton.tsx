import type { ButtonHTMLAttributes, FC } from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const iconVariants = cva(
  `
  rounded
  text-sm
  font-semibold
  transition-colors
  active:scale-[0.99]
  disabled:pointer-events-none
  disabled:cursor-default
  flex
  items-center
  justify-center
  `,
  {
    variants: {
      variant: {
        default: `
        focus-visible:outline
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-iconHighlight-dark

        fill-icon-light
        aria-pressed:fill-primary-700
        aria-pressed:text-primary-700
       dark:aria-pressed:fill-primary-100
        dark:aria-pressed:text-primary-100
        text-icon-light
        hover:fill-iconHighlight-light
        hover:text-iconHighlight-light
        dark:fill-icon-dark
        dark:text-icon-dark
        hover:dark:fill-iconHighlight-dark
        hover:dark:text-iconHighlight-dark
        `,
        disabled: `
          dark:text-accentDisabled-dark
        `,
      },
      size: {
        sm: "[&>*]:h-4 [&>*]:w-4",
        md: "[&>*]:h-5 [&>*]:w-5",
        lg: "[&>*]:h-6 [&>*]:w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconVariants>;

const IconButton: FC<IconButtonProps> = ({
  className,
  variant,
  size,
  ...props
}) => {
  return (
    <button
      className={twMerge(iconVariants({ variant, size }), className)}
      {...props}
    />
  );
};

export { IconButton };
