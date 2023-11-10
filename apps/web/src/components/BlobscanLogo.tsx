import NextImage from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

import { useIsMounted } from "~/hooks/useIsMounted";

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { resolvedTheme } = useTheme();
  const isMounted = useIsMounted();
  const logoSrc =
    resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg";

  if (!isMounted) {
    return <div className={className} />;
  }

  return (
    <Link href="/">
      <NextImage
        className={className}
        src={logoSrc}
        width="0"
        height="0"
        sizes="100vw"
        priority
        alt="blobscan-logo"
      />
    </Link>
  );
};
