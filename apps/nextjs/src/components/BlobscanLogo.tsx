import Image from "next/image";
import Link from "next/link";
import { useColorMode } from "@chakra-ui/react";

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
        src={colorMode === "light" ? "/logo-light.svg" : "/logo-dark.svg"}
        {...sizes[size]}
        alt="blobscan-logo"
      />
    </Link>
  );
};
