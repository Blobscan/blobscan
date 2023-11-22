import cn from "classnames";

import { useIsHomepage } from "~/hooks/useIsHomePage";
import Banner from "./Banner";
import { BottomBarLayout } from "./BottomBarLayout";
import { TopBarLayout } from "./TopBarLayout";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const isHomepage = useIsHomepage();

  return (
    <div className="flex min-h-screen flex-col">
      <Banner />
      <TopBarLayout />
      <main
        className={cn("container mx-auto mb-24 grow", {
          "mt-14": isHomepage,
          "mt-12 sm:my-14": !isHomepage,
        })}
      >
        <div className="mx-auto flex w-11/12 flex-col gap-8">{children}</div>
      </main>
      <BottomBarLayout />
    </div>
  );
};

export default AppLayout;
