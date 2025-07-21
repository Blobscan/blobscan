import React from "react";
import Blockies from "react-blockies";

import { isAddress } from "~/utils";

const PX_RATIO = typeof devicePixelRatio === "undefined" ? 2 : devicePixelRatio;
const BLOCKIES_SQUARES = 8; // commonly used to represent Ethereum addresses
const BASE_SCALE = 3;

type EthIdenticonProps = {
  address: string;
  size?: "sm" | "md" | "lg" | "xlg";
  soften?: number;
};

const SCALES = {
  sm: 1,
  md: 2,
  lg: 3,
  xlg: 4,
};

const RADIUS = {
  sm: "rounded-[3px]",
  md: "rounded-[5px]",
  lg: "rounded-[5px]",
  xlg: "rounded-[5px]",
};

export const EthIdenticon: React.FC<EthIdenticonProps> = ({
  address,
  size = "md",
  soften = 0.3,
}) => {
  const blockiesScale = SCALES[size] * BASE_SCALE;

  return isAddress(address) ? (
    <div
      className={`
       
        inline-flex
        overflow-hidden 
        rounded-md
        align-middle 
      `}
    >
      <div
        className={`
          flex
          origin-top-left
          bg-white
          scale-{${1 / PX_RATIO}}
        `}
      >
        <Blockies seed={address.toLowerCase()} size={6} />
      </div>
    </div>
  ) : null;
};
