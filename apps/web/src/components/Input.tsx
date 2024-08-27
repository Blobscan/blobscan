import type {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  InputHTMLAttributes,
} from "react";

type InputProps =
  | DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
  | { className: HTMLAttributes<HTMLInputElement> };

export const Input: FC<InputProps> = function ({ className, ...props }) {
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
  dark:bg-controlBackground-dark
  dark:placeholder:text-hint-dark
  dark:hover:border-controlBorderHighlight-dark
  dark:focus:border-accentHighlight-dark
  ${className}
  `}
      {...props}
    />
  );
};
