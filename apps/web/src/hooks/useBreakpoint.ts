import { useEffect, useRef, useState } from "react";

import type { Size } from "~/types";

type AugmentedSize = Size | "default";

function getActiveBreakpoint(): AugmentedSize {
  if (window.matchMedia("(min-width: 1536px)").matches) {
    return "2xl";
  } else if (window.matchMedia("(min-width: 1280px)").matches) {
    return "xl";
  } else if (window.matchMedia("(min-width: 1024px)").matches) {
    return "lg";
  } else if (window.matchMedia("(min-width: 768px)").matches) {
    return "md";
  } else if (window.matchMedia("(min-width: 640px)").matches) {
    return "sm";
  }

  return "default";
}

export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<AugmentedSize>(
    getActiveBreakpoint()
  );
  const breakpointRef = useRef<AugmentedSize>();

  useEffect(() => {
    function trackResize() {
      breakpointRef.current = getActiveBreakpoint();
      if (breakpointRef.current !== currentBreakpoint) {
        setCurrentBreakpoint(breakpointRef.current);
      }
    }

    window.addEventListener("resize", trackResize);

    return () => {
      window.removeEventListener("resize", trackResize);
    };
  });

  return currentBreakpoint;
}
