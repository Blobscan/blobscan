import { useEffect, useRef, useState } from "react";

import type { Size } from "~/types";

function getActiveBreakpoint(): Size {
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
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Size>(
    getActiveBreakpoint()
  );
  const breakpointRef = useRef<Size>();

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
