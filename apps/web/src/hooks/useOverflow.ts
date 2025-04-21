import { useState } from "react";
import type { RefObject } from "react";
import { useResize } from "@react-spring/web";

export function useOverflow<T extends HTMLElement>(elementRef: RefObject<T>) {
  const [overflowing, setOverflowing] = useState({
    xOverflowing: false,
    yOverflowing: false,
  });

  useResize({
    container: elementRef,
    onChange: () => {
      const el = elementRef.current;
      if (!el) return;

      const { scrollWidth, clientWidth, scrollHeight, clientHeight } = el;

      setOverflowing({
        xOverflowing: scrollWidth > clientWidth,
        yOverflowing: scrollHeight > clientHeight,
      });
    },
  });

  return overflowing;
}
