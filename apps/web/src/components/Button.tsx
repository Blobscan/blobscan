import {
  type ButtonHTMLAttributes,
  type DOMAttributes,
  type HTMLAttributes,
  type HtmlHTMLAttributes,
} from "react";

type Size = "sm" | "md" | "lg";
type SizeStyles = Record<
  Size,
  HtmlHTMLAttributes<HTMLButtonElement>["className"]
>;
type Variant = "outline" | "primary";
type VariantStyles = Record<
  Variant,
  HTMLAttributes<HTMLButtonElement>["className"]
>;

type ButtonProps = {
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  variant: keyof VariantStyles;
  className?: HTMLAttributes<HTMLButtonElement>["className"];
  size?: Size;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  onClick?: DOMAttributes<HTMLButtonElement>["onClick"];
};

const VARIANT_STYLES: VariantStyles = {
  primary: `
  bg-accent-light
  dark:bg-primary-500
  text-accentContent-light
  dark:text-accentContent-dark
  hover:bg-accentHighlight-light
  dark:hover:bg-accentHighlight-dark
  disabled:bg-accentDisabled-light
  dark:disabled:bg-accentDisabled-dark
  active:bg-accent-light
  dark:active:bg-accent-dark
  `,
  outline: `
    dark:disabled:text-
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
  `,
};

const SIZES: SizeStyles = {
  sm: `
    px-2
    py-1
  `,
  md: `
    px-4
    py-2
  `,
  lg: `
    px-4
    py-3
  `,
};

export function Button({
  disabled = false,
  type = "button",
  className,
  icon,
  label,
  onClick,
  size = "md",
  variant,
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      type={type}
      className={`
      ${VARIANT_STYLES[variant]}
      ${SIZES[size]}
      cursor-pointer
      rounded
      text-sm
      font-semibold
      shadow-sm
      transition-colors
      active:scale-[0.99]
      disabled:cursor-default
      ${className}
      `}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
