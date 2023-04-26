import React from "react";
import { utils } from "ethers";
import Blockies from "react-blockies";

const PX_RATIO = typeof devicePixelRatio === "undefined" ? 2 : devicePixelRatio;
const BLOCKIES_SQUARES = 8; // commonly used to represent Ethereum addresses
const BASE_SCALE = 3;

type EthIdenticonProps = {
  address: string;
  scale?: number;
  radius?: number;
  soften?: number;
};

export const EthIdenticon: React.FC<EthIdenticonProps> = ({
  address,
  scale = 1,
  // radius = 5,
  soften = 0.3,
}) => {
  const blockiesScale = scale * BASE_SCALE;

  return utils.isAddress(address) ? (
    <div
      className={`
        inline-flex 
        overflow-hidden
        align-middle 
        w-[${BLOCKIES_SQUARES * blockiesScale}px] 
        h-[${BLOCKIES_SQUARES * blockiesScale}px]
        rounded-[5px]
      `}
    >
      <div
        className={`
          flex
          bg-white
          w-[${BLOCKIES_SQUARES * blockiesScale * PX_RATIO}px] 
          h-[${BLOCKIES_SQUARES * blockiesScale * PX_RATIO}px]
          origin-top-left
          scale-{${1 / PX_RATIO}}
        `}
      >
        <div className={`opacity-${(1 - soften) * 100}`}>
          <Blockies
            seed={address.toLowerCase()}
            size={BLOCKIES_SQUARES}
            scale={blockiesScale * PX_RATIO}
          />
        </div>
      </div>
    </div>
  ) : null;
};
