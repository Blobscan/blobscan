import { useRef } from "react";
import type { FC, ReactNode } from "react";
import { useScroll, a } from "@react-spring/web";

import { useDimensions } from "~/hooks/useDimensions";

type FadeableProps = {
  children: ReactNode;
};

const OPACITY_THRESHOLD = 0.35;

export const Fadeable: FC<FadeableProps> = function ({ children }) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const containerRef = useRef<HTMLDivElement>(null!);
  const { scrollYProgress, scrollXProgress } = useScroll({
    container: containerRef,
  });
  const dimensions = useDimensions(containerRef);
  const isYOverflow = dimensions
    ? dimensions.height > dimensions.visibleHeight
    : false;
  const isXOverflow = dimensions
    ? dimensions.width > dimensions.visibleWidth
    : false;

  return (
    <div className="relative">
      {isXOverflow && (
        <>
          <a.div
            className="absolute -left-0.5 z-10 w-14 bg-gradient-to-l from-transparent to-surface-light dark:to-surface-dark"
            style={{
              height: dimensions ? `${dimensions.height}px` : 0,
              opacity: scrollXProgress.to(
                (v) => Math.pow(v, OPACITY_THRESHOLD) / OPACITY_THRESHOLD
              ),
            }}
          />
          <a.div
            className="absolute -right-0.5  z-10 w-14 bg-gradient-to-r from-transparent to-surface-light dark:to-surface-dark"
            style={{
              height: dimensions ? `${dimensions.height}px` : 0,
              opacity: scrollXProgress.to(
                (v) => Math.pow(1 - v, OPACITY_THRESHOLD) / OPACITY_THRESHOLD
              ),
            }}
          />
        </>
      )}
      {isYOverflow && (
        <>
          <a.div
            className="absolute top-0 z-10 h-3 w-full border border-white bg-gradient-to-t from-transparent to-surface-light dark:to-surface-dark"
            style={{
              height: dimensions
                ? `${Math.ceil(dimensions.height * 0.1)}px`
                : 0,
              opacity: scrollYProgress.to((v) => v / OPACITY_THRESHOLD),
            }}
          />
          <a.div
            className="absolute bottom-0 z-10 h-3 w-full bg-gradient-to-b from-transparent to-surface-light dark:to-surface-dark"
            style={{
              height: dimensions
                ? `${Math.ceil(dimensions.height * 0.1)}px`
                : 0,
              opacity: scrollYProgress.to((v) => (1 - v) / OPACITY_THRESHOLD),
            }}
          />
        </>
      )}
      <div ref={containerRef} className="overflow-scroll">
        {children}
      </div>
    </div>
  );
};
