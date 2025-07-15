import type { FC, ReactNode } from "react";
import { animated, useSpring } from "@react-spring/web";

export type RotableProps = {
  children: ReactNode;
  rotated: boolean;
  angle: number;
  onClick?: () => void;
};

export const Rotable: FC<RotableProps> = function ({
  children,
  angle,
  rotated,
  onClick,
}) {
  const props = useSpring({
    from: { rotate: 0 },
    to: { rotate: Number(rotated) * angle },
  });

  return (
    <button className="cursor-pointer" onClick={onClick}>
      <animated.div style={props}>{children}</animated.div>
    </button>
  );
};
