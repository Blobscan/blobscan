import React from "react";
import cn from "classnames";
import Blockies from "react-blockies";

import type { Size } from "~/types";
import { isAddress } from "~/utils";

type EthIdenticonProps = {
  address: string;
  size?: Size;
  soften?: number;
  /** A square with rounded corners (the default), or a circle. */
  shape?: "rounded" | "circle";
};

const SCALES: Record<Size, number> = {
  xs: 2,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
  "2xl": 7,
};

export const EthIdenticon: React.FC<EthIdenticonProps> = ({
  address,
  size = "md",
  shape = "rounded",
}) => {
  return isAddress(address) ? (
    // `flex` removes the space under the inline canvas, so a circle is round.
    <div
      className={cn("flex shrink-0 overflow-hidden", {
        "rounded-md": shape === "rounded",
        "rounded-full": shape === "circle",
      })}
    >
      <Blockies seed={address} size={8} scale={SCALES[size]} />
    </div>
  ) : null;
};
