import type {
  ButtonHTMLAttributes,
  DOMAttributes,
  FC,
  HTMLAttributes,
  ReactElement,
} from "react";
import { MagnifyingGlassCircleIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";

import type { Size } from "~/types";

type Variant = "outline" | "primary" | "icon";
type VariantStyles = Record<
  Variant,
  HTMLAttributes<HTMLButtonElement>["className"]
>;

type ButtonProps = {
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  variant?: keyof VariantStyles;
  className?: HTMLAttributes<HTMLButtonElement>["className"];
  size?: Size;
  icon?: ReactElement<{ className?: string }>;
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
    rounded-full p-2
    text-icon-light
    shadow-sm transition-colors
    focus-visible:outline
    focus-visible:outline-2
    focus-visible:outline-offset-2
    focus-visible:outline-iconHighlight-dark
    dark:text-icon-dark
  `,
};

export const Button: FC<ButtonProps> = function ({
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
      ${VARIANT_STYLES[variant ?? "primary"]}
      ${
        variant !== "icon"
          ? classNames({
              "px-2 py-1": size === "sm",
              "px-4 py-2": size === "md",
              "px-4 py-3": size === "lg",
            })
          : `
            fill-icon-light
            text-icon-light
            hover:fill-iconHighlight-light
            hover:text-iconHighlight-light
            dark:fill-icon-dark
            dark:text-icon-dark
            hover:dark:fill-iconHighlight-dark
            hover:dark:text-iconHighlight-dark
            ${classNames({
              "w-7": size === "sm",
              "w-9": size === "md",
              "w-11": size === "lg",
              "w-13": size === "xl",
            })}
          `
      }
      ${classNames({
        "h-7": size === "sm",
        "h-9": size === "md",
        "h-11": size === "lg",
        "h-13": size === "xl",
      })}
      cursor-pointer
      rounded
      text-sm
      font-semibold
      shadow-sm
      transition-colors
      active:scale-[0.99]
      disabled:pointer-events-none
      disabled:cursor-default
      ${className}
      `}
      onClick={onClick}
    >
      <div className="flex h-full items-center gap-1">
        {icon && <div className="h-full">{icon}</div>}
        {label}
      </div>
    </button>
  );
};
