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
        w-[${BLOCKIES_SQUARES * blockiesScale}px] 
        h-[${BLOCKIES_SQUARES * blockiesScale}px]
        ${RADIUS[size]}
        inline-flex 
        overflow-hidden
        align-middle 
      `}
    >
      <div
        className={`
          w-[${BLOCKIES_SQUARES * blockiesScale * PX_RATIO}px] 
          h-[${BLOCKIES_SQUARES * blockiesScale * PX_RATIO}px]
          flex
          origin-top-left
          bg-white
          scale-{${1 / PX_RATIO}}
        `}
      >
        <div className={`opacity-${(1 - soften) * 100}`}>
          <Blockies
            seed={address.toLowerCase()}
            size={BLOCKIES_SQUARES}
            scale={SCALES[size] * PX_RATIO}
          />
        </div>
      </div>
    </div>
  ) : null;
};
