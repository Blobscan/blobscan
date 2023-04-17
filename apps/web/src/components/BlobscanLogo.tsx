import Image from "next/image";
import Link from "next/link";

const SIZES = {
  lg: {
    width: 330,
    height: 130,
  },
  md: {
    width: 150,
    height: 32,
  },
  sm: {
    width: 130,
    height: 30,
  },
};

type LogoProps = {
  size: keyof typeof SIZES;
};

export const Logo: React.FC<LogoProps> = ({ size }) => {
  return (
    <Link href="/">
      <Image
        src="/logo-dark.svg"
        // src={colorMode === "light" ? "/logo-light.svg" : "/logo-dark.svg"}
        {...SIZES[size]}
        alt="blobscan-logo"
      />
    </Link>
  );
};
