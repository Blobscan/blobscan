import type { DetailedHTMLProps, ThHTMLAttributes } from "react";
import cn from "classnames";

import type { Size } from "~/types";

export type Alignment = "left" | "center" | "right";

export type Variant = "simple" | "normal";

export interface TableElementProps {
  className?: string;
  alignment?: Alignment;
  size?: Size;
  variant?: Variant;
  spanFullRow?: boolean;
  sticky?: boolean;
}

export type BaseTableCellElementProps = DetailedHTMLProps<
  ThHTMLAttributes<HTMLTableCellElement>,
  HTMLTableCellElement
>;

export const sizeStyles = (size: Size) =>
  cn({
    "px-1 py-2": size === "xs",
    "px-2 py-3": size === "sm",
    "px-3 py-4": size === "md",
    "px-4 py-5": size === "lg",
  });

export const alignmentStyles = (alignment: Alignment) =>
  cn({
    "text-left": alignment === "left",
    "text-center": alignment === "center",
    "text-right": alignment === "right",
  });

export const stickyStyles = (isSticky: boolean) =>
  cn({
    "sticky top-0 z-10": isSticky,
  });

export const colSpan = (isFullColSpan: boolean, colSpan?: number) =>
  colSpan ?? isFullColSpan === true ? 100 : undefined;
