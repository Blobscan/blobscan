import Image from "next/image";
import { useColorMode } from "@chakra-ui/react";

import LogoLight from "../assests/logo-light.svg";
import LogoDark from "../assests/logo-dark.svg";

type LogoProps = {
  size: "sm" | "md";
};

export const Logo: React.FC<LogoProps> = ({ size }) => {
  const { colorMode } = useColorMode();

  const sizes = {
    md: {
      width: "257px",
      height: "60px",
    },
    sm: {
      width: "118px",
      height: "27px",
    },
  };

  return (
    <Image
      src={colorMode === "light" ? LogoLight : LogoDark}
      {...sizes[size]}
      alt="blobscan-logo"
    />
  );
};
