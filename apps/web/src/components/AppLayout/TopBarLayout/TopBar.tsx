import { SidebarNavigationMenu } from "~/components/SidebarNavigationMenu";
import { BlobscanLogo } from "../../BlobscanLogo";
import { NavigationMenus } from "../../NavigationMenus";
import { TopNetworkInfo } from "../../NetworkInfo";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { TopBarSurface } from "./TopBarSurface";

export const TopBar: React.FC = () => {
  return (
    <div>
      <TopBarSurface>
        <div className="flex h-full items-center justify-between">
          <div className="flex grow items-center gap-12">
            <BlobscanLogo className="w-40" />
          </div>
          <div className="flex grow-[3] items-center justify-end gap-5">
            <div className="hidden xl:block">
              <NavigationMenus />
            </div>
            <div className="w-full sm:max-w-xl">
              <SearchInput />
            </div>
            <div className="hidden xl:block">
              <ThemeModeButton />
            </div>
            <div className="block xl:hidden">
              <SidebarNavigationMenu />
            </div>
          </div>
        </div>
      </TopBarSurface>
      <TopBarSurface>
        <div className="-my-1 flex items-center gap-2">
          <TopNetworkInfo />
        </div>
      </TopBarSurface>
    </div>
  );
};
