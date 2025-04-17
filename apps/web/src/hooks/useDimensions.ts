import { useEffect, useState } from "react";
import type { RefObject } from "react";

type Dimensions = {
  height: number;
  width: number;
  visibleHeight: number;
  visibleWidth: number;
};

export const useDimensions = function <T extends HTMLElement>(
  elementRef: RefObject<T>
) {
  const [elementDimensions, setElementDimensions] = useState<
    Dimensions | undefined
  >();

  useEffect(() => {
    const el = elementRef.current;

    if (!el) {
      return;
    }

    setElementDimensions({
      height: el.scrollHeight,
      width: el.scrollWidth,
      visibleHeight: el.clientHeight,
      visibleWidth: el.clientWidth,
    });
  }, [elementRef]);

  return elementDimensions;
};
