import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type TooltipProps = {
  show: boolean;
  children: ReactNode;
};

type Position = "top" | "right" | "bottom" | "left";

function getOverflow(element: HTMLDivElement) {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top < 0,
    right: rect.right > window.innerWidth,
    bottom: rect.bottom > window.innerHeight,
    left: rect.left < 0,
  };
}

export function Tooltip({ show, children }: TooltipProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>("top");

  useEffect(() => {
    if (!divRef.current) {
      return;
    }

    const overflow = getOverflow(divRef.current);

    if (overflow.top) {
      setPosition("bottom");
    } else if (overflow.right) {
      setPosition("left");
    } else if (overflow.left) {
      setPosition("right");
    } else if (overflow.bottom) {
      setPosition("top");
    } else {
      setPosition("top");
    }
  }, [show]);

  return (
    <div
      ref={divRef}
      className={`pointer-events-none absolute z-10 font-normal ${
        show ? "opacity-100" : "opacity-0"
      } ${
        position === "top"
          ? "-top-2 left-[50%] -translate-x-[50%] translate-y-[-100%]"
          : ""
      } ${
        position === "bottom"
          ? "-bottom-2 left-[50%] -translate-x-[50%] translate-y-[100%]"
          : ""
      } ${
        position === "left"
          ? "-left-2 top-[50%] -translate-x-[100%] translate-y-[-50%]"
          : ""
      } ${
        position === "right"
          ? "-right-2 top-[50%] translate-x-[100%] translate-y-[-50%]"
          : ""
      }`}
    >
      <div className="rounded-lg bg-accent-light p-3 text-xs text-white dark:bg-primary-500">
        {children}
      </div>
      <div
        className={`absolute h-2 w-2 -translate-x-[50%] translate-y-[50%] rotate-45 bg-accent-light dark:bg-primary-500 ${
          position === "top" ? "bottom-[0%] left-[50%]" : ""
        } ${position === "bottom" ? "bottom-[100%] left-[50%]" : ""} ${
          position === "left" ? "bottom-[50%] left-[100%]" : ""
        } ${position === "right" ? "bottom-[50%] left-[0%]" : ""}`}
      />
    </div>
  );
}
