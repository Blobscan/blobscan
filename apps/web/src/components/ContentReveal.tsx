import type { HTMLAttributes } from "react";
import cn from "classnames";

export function getContentRevealProps(index = 0) {
  return {
    className: "content-reveal",
    style: { animationDelay: `${Math.min(index * 30, 120)}ms` },
  };
}

type ContentRevealProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "span";
  isLoading?: boolean;
  index?: number;
};

export function ContentReveal({
  as: Element = "div",
  isLoading = false,
  index = 0,
  className,
  style,
  ...props
}: ContentRevealProps) {
  const reveal = getContentRevealProps(index);

  return (
    <Element
      className={cn(
        { "inline-block": Element === "span" },
        !isLoading && reveal.className,
        className
      )}
      style={{ ...(!isLoading && reveal.style), ...style }}
      {...props}
    />
  );
}
