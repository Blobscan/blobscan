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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="-p cursor-pointer" onClick={onClick}>
      <animated.div style={props} className="-mb-2">
        {children}
      </animated.div>
    </div>
  );
};
