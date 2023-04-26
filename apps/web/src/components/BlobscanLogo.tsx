import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

const SIZES = {
  lg: {
    width: 320,
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
  const { systemTheme, theme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <Link href="/">
      <Image
        src={currentTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
        {...SIZES[size]}
        alt="blobscan-logo"
      />
    </Link>
  );
};
