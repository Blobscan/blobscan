import { type DOMAttributes, type HTMLAttributes } from "react";

type VariantName = "outline" | "primary";
type VariantStyles = Record<
  VariantName,
  HTMLAttributes<HTMLButtonElement>["className"]
>;

type ButtonProps = {
  variant: keyof VariantStyles;
  className?: HTMLAttributes<HTMLButtonElement>["className"];
  size?: string;
  icon?: React.ReactNode;
  label?: string;
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

export function Button({
  className,
  icon,
  label,
  onClick,
  variant,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`
      ${VARIANT_STYLES[variant]}
      rounded
      px-3
      py-2
      text-sm
      font-semibold
      shadow-sm
      transition-colors
      active:scale-[0.99]
      ${className}
      `}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
