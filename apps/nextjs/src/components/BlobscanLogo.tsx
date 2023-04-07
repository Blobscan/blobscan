/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Image from "next/image";
import Link from "next/link";
import { useColorMode } from "@chakra-ui/react";

import LogoDark from "~/../public/logo-dark.svg";
import LogoLight from "~/../public/logo-light.svg";

type LogoProps = {
  size: "sm" | "md";
};

export const Logo: React.FC<LogoProps> = ({ size }) => {
  const { colorMode } = useColorMode();

  const sizes = {
    md: {
      width: 257,
      height: 60,
    },
    sm: {
      width: 118,
      height: 27,
    },
  };

  return (
    <Link href="/">
      <Image
        src={colorMode === "light" ? LogoLight : LogoDark}
        {...sizes[size]}
        alt="blobscan-logo"
      />
    </Link>
  );
};
