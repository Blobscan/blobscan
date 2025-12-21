import { useRef } from "react";
import type { FC, ReactNode } from "react";
import { useScroll, a, to } from "@react-spring/web";
import classNames from "classnames";

import { useOverflow } from "~/hooks/useOverflow";

type ScrollableProps = {
  children: ReactNode;
  displayScrollbar?: boolean;
};

export const Scrollable: FC<ScrollableProps> = function ({
  children,
  displayScrollbar = false,
}) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const containerRef = useRef<HTMLDivElement>(null!);
  const { scrollYProgress, scrollXProgress } = useScroll({
    container: containerRef,
  });
  const { xOverflowing, yOverflowing } = useOverflow(containerRef);

  return (
    <a.div
      ref={containerRef}
      className={classNames({
        "pr-1 transition-colors dark:[&::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-primary-800 dark:hover:[&::-webkit-scrollbar-thumb]:bg-accentHighlight-dark/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-surface-dark/60 [&::-webkit-scrollbar]:max-h-1.5 [&::-webkit-scrollbar]:max-w-1.5":
          displayScrollbar,
        "[&::-webkit-scrollbar]:hidden": !displayScrollbar,
      })}
      style={{
        width: "100%",
        overflowX: xOverflowing ? "scroll" : "hidden",
        overflowY: yOverflowing ? "scroll" : "hidden",
        maskImage: to([scrollXProgress, scrollYProgress], (x, y) => {
          const gradients = [];

          if (xOverflowing) {
            if (x < 0.99) {
              gradients.push(
                `linear-gradient(to right, rgba(0, 0, 0, 1) ${
                  x * 10 + 90
                }%, transparent 100%)`
              );
            }
            if (x > 0.01) {
              gradients.push(
                `linear-gradient(to left, rgba(0, 0, 0, 1) ${
                  (1 - x) * 10 + 90
                }%, transparent 100%)`
              );
            }
          }

          if (yOverflowing) {
            if (y < 0.99) {
              gradients.push(
                `linear-gradient(to bottom, rgba(0, 0, 0, 1) ${
                  y * 10 + 90
                }%, transparent 100%)`
              );
            }
            if (y > 0.01) {
              gradients.push(
                `linear-gradient(to top, rgba(0, 0, 0, 1) ${
                  (1 - y) * 10 + 90
                }%, transparent 100%)`
              );
            }
          }

          if (gradients.length === 0) return "";

          return gradients.join(", ");
        }),
        maskComposite: "intersect",
      }}
    >
      {children}
    </a.div>
  );
};
