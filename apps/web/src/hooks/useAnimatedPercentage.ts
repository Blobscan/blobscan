import { useSpring } from "@react-spring/web";

import type { Numerish } from "~/utils";
import { calculatePercentage } from "~/utils";

export function useAnimatedPercentage(value: Numerish, total: Numerish) {
  const percentage = calculatePercentage(value, total, {
    asFraction: true,
  });

  return useSpring({
    value: percentage,
    from: { value: 0 },
    cancel: !percentage,
  });
}
