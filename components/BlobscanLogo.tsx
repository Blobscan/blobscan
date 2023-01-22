import Image from "next/image";
import { ImageProps } from "next/image";
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

  const imageProps: ImageProps =
    colorMode === "light"
      ? {
          src: LogoLight,
          alt: "blobscan-logo-light",
        }
      : {
          src: LogoDark,
          alt: "blobscan-logo-dark",
        };
  return <Image {...imageProps} {...sizes[size]} />;
};
