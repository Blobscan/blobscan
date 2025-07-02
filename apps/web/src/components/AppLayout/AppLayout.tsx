import { useState } from "react";
import cn from "classnames";

import { useIsHomepage } from "~/hooks/useIsHomePage";
import { OctantBanner } from "../OctantBanner";
import { BottomBarLayout } from "./BottomBarLayout";
import { TopBarLayout } from "./TopBarLayout";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const isHomepage = useIsHomepage();
  const [bannerOpened, setBannerOpened] = useState(true);

  return (
    <div className="flex min-h-screen flex-col">
      {bannerOpened && (
        <OctantBanner
          onClose={() => setBannerOpened((prevOpened) => !prevOpened)}
        />
      )}
      <TopBarLayout />
      <main
        className={cn("container mx-auto grow", {
          "mt-14": isHomepage,
          "mt-8  sm:mb-16 sm:mt-20": !isHomepage,
        })}
      >
        <div className="mx-auto flex w-11/12 flex-col gap-8">{children}</div>
      </main>
      <BottomBarLayout />
    </div>
  );
};

export default AppLayout;
