import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size: "sm" | "md";
};

export const Logo: React.FC<LogoProps> = ({ size }) => {
  const sizes = {
    md: {
      width: 330,
      height: 130,
    },
    sm: {
      width: 118,
      height: 27,
    },
  };

  return (
    <Link href="/">
      <Image
        src="/logo-dark.svg"
        // src={colorMode === "light" ? "/logo-light.svg" : "/logo-dark.svg"}
        {...sizes[size]}
        alt="blobscan-logo"
      />
    </Link>
  );
};
