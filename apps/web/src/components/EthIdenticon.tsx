import React from "react";
import Blockies from "react-blockies";

import type { Size } from "~/types";
import { isAddress } from "~/utils";

type EthIdenticonProps = {
  address: string;
  size?: Size;
  soften?: number;
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
}) => {
  return isAddress(address) ? (
    <div
      className={`
       
        overflow-hidden 
        rounded-md
      `}
    >
      <Blockies seed={address} size={8} scale={SCALES[size]} />
    </div>
  ) : null;
};
