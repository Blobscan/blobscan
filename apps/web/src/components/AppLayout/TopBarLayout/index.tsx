import React, { useState } from "react";

import GitcoinBanner from "~/components/GitcoinBanner";
import { SidebarNavigationMenu } from "~/components/SidebarNavigationMenu";
import { ThemeModeButton } from "~/components/ThemeModeButton";
import { useIsHomepage } from "~/hooks/useIsHomePage";
import { ExplorerDetails } from "../../ExplorerDetails";
import { NavigationMenus } from "../../NavigationMenus";
import { CompactTopBar } from "./CompactTopBar";
import { TopBar } from "./TopBar";

export const TopBarLayout: React.FC = () => {
  const isHomepage = useIsHomepage();
  const [showBanner, setShowBanner] = useState(true);

  if (isHomepage) {
    return (
      <>
        {showBanner && <GitcoinBanner onClose={() => setShowBanner(false)} />}
        <nav className="z-10 flex h-16 w-full items-center justify-end px-4 md:justify-between">
          <div className="ml-5 w-full md:ml-0 md:flex">
            <ExplorerDetails placement="top" />
          </div>
          <div className="flex items-center gap-3">
            <div className="xl:hidden">
              <SidebarNavigationMenu />
            </div>
            <div className="hidden xl:flex">
              <NavigationMenus />
            </div>
            <div className="relative ml-2 hidden xl:block">
              <ThemeModeButton />
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      <div
        className={`z-10 hidden h-16 w-full items-center justify-between sm:block`}
      >
        {showBanner && <GitcoinBanner onClose={() => setShowBanner(false)} />}
        <TopBar />
      </div>
      <CompactTopBar />
    </>
  );
};
