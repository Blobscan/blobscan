import { useRef, useCallback, useEffect } from "react";
import type { FC, ReactNode } from "react";
import { animated, useSpring } from "@react-spring/web";

export type CollapsableProps = {
  children: ReactNode;
  rowMode?: boolean;
  opened: boolean;
};

export const Collapsable: FC<CollapsableProps> = function ({
  children,
  opened,
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentHeight = useRef<number>(0);
  const props = useSpring({
    from: { openProgress: 0 },
    to: { openProgress: Number(opened) },
  });

  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      contentHeight.current = contentRef.current.clientHeight;
    }
  }, []);

  const handleContentRef = useCallback(
    (element: HTMLDivElement) => {
      contentRef.current = element;
      updateHeight();
    },
    [updateHeight]
  );

  useEffect(updateHeight, [opened, updateHeight]);

  return (
    <div className="overflow-hidden">
      <animated.div
        style={{
          height: props.openProgress.to(
            (value) => `${value * contentHeight.current}px`
          ),
        }}
      >
        <div ref={handleContentRef}>{children}</div>
      </animated.div>
    </div>
  );
};
