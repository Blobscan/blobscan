import type { ButtonHTMLAttributes, FC } from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  `
  rounded
  text-sm
  font-semibold
  transition-colors
  active:scale-[0.99]
  disabled:pointer-events-none
  disabled:cursor-default
  `,
  {
    variants: {
      variant: {
        primary: `
        shadow-sm
        bg-accent-light
        dark:bg-primary-500
        text-accentContent-light
        dark:text-accentContent-dark
        hover:bg-accentHighlight-light
        dark:hover:bg-accentHighlight-dark
        active:bg-accent-light
        dark:active:bg-accent-dark

        disabled:text-warmGray-400
        dark:disabled:text-coolGray-400
        disabled:bg-warmGray-500
        dark:disabled:bg-coolGray-300
        disabled:border-warmGray-500
        dark:disabled:border-coolGray-300
        `,
        outline: `
        shadow-sm
        bg-transparent
        dark:bg-transparent
        border-accent-light
        dark:border-accent-dark
        text-accent-light
        dark:text-accent-dark
        hover:text-content-dark
        dark:hover:text-content-dark
        hover:bg-accentHighlight-light
        dark:hover:bg-accentHighlight-dark
        active:bg-accent-light
        dark:active:bg-accent-dark
        border
    
        disabled:text-contentDisabled-light
        disabled:border-accentDisabled-light
        dark:disabled:text-contentDisabled-dark
        dark:disabled:border-accentDisabled-dark
        `,
        icon: `
        focus-visible:outline
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-iconHighlight-dark

        fill-icon-light
        text-icon-light
        hover:fill-iconHighlight-light
        hover:text-iconHighlight-light
        dark:fill-icon-dark
        dark:text-icon-dark
        hover:dark:fill-iconHighlight-dark
        hover:dark:text-iconHighlight-dark
        `,
      },
      size: {
        sm: "px-2 py-1 h-7",
        md: "px-4 py-2 h-9",
        lg: "px-4 py-3 h-11",
        "md-icon": "w-9 h-9 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button: FC<Props> = ({ className, variant, size, ...props }) => {
  return (
    <button
      className={twMerge(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};

export { Button };
