import { useRef } from "react";
import type { FC, ReactNode } from "react";
import { useScroll, a, to } from "@react-spring/web";

import { useOverflow } from "~/hooks/useOverflow";

type ScrollableProps = {
  children: ReactNode;
};

export const Scrollable: FC<ScrollableProps> = function ({ children }) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const containerRef = useRef<HTMLDivElement>(null!);
  const { scrollYProgress, scrollXProgress } = useScroll({
    container: containerRef,
  });
  const { xOverflowing, yOverflowing } = useOverflow(containerRef);

  return (
    <a.div
      ref={containerRef}
      style={{
        width: "100%",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        overflow: "scroll",
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
