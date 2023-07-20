import type {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  InputHTMLAttributes,
} from "react";

export const Input: FC<
  | DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
  | { className: HTMLAttributes<HTMLInputElement> }
> = function ({ className, ...props }) {
  return (
    <input
      className={`
    block
    w-full
    rounded-md
    border
    border-border-light
    bg-controlBackground-light
    p-0.5
    px-2
    transition-colors
    placeholder:text-hint-light
    hover:border-controlBorderHighlight-light
    focus:border-accentHighlight-light
    focus:ring-0
    dark:border-border-dark
    dark:bg-background-dark
    dark:placeholder:text-hint-dark
    dark:hover:border-controlBorderHighlight-dark
    dark:focus:border-accentHighlight-dark
    ${className}
    `}
      {...props}
    />
  );
};
