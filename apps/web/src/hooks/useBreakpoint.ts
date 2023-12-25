import { useEffect, useRef, useState } from "react";

export type Breakpoint = "2xl" | "xl" | "lg" | "md" | "sm" | "default";

function getActiveBreakpoint(): Breakpoint {
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
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>(
    getActiveBreakpoint()
  );
  const breakpointRef = useRef<Breakpoint>();

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
