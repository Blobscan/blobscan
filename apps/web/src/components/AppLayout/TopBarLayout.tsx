import { useRouter } from "next/router";

import { DesktopNav } from "./DesktopTopBar";
import { MobileNav } from "./MobileTopBar";

export const TopBarLayout: React.FC = () => {
  const { pathname } = useRouter();
  const isHomePage = pathname === "/";

  // const [isDeskTop] = useMediaQuery("(min-width: 490px)", {
  //   ssr: true,
  //   fallback: false,
  // });

  return (
    <header
      // className={
      //   !isHomePage
      //     ? ""
      //     : "bg-surface-light dark:bg-surface-dark border-border-light  dark:border-border-dark mx-auto px-10"
      // }
      className="px-4 py-4 sm:px-6"
    >
      <DesktopNav isHomePage={isHomePage} />
    </header>
  );
};
