import { Logo } from "../../BlobscanLogo";
import { ExplorerDetails } from "../../ExplorerDetails";
import { NavMenusSection } from "../../NavMenusSection";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { TopBarSurface } from "./TopBarSurface";

export const DesktopNav: React.FC = () => {
  return (
    <div>
      <TopBarSurface>
        <div className="flex h-full justify-between">
          <div className="flex grow items-end gap-12">
            <Logo className="h-6 w-32 sm:h-6 sm:w-36" />
          </div>
          <div className="flex grow-[3] justify-end gap-5">
            <div className="self-end">
              <NavMenusSection />
            </div>
            <div className="w-full sm:max-w-xl">
              <SearchInput />
            </div>
            <ThemeModeButton />
          </div>
        </div>
      </TopBarSurface>
      <TopBarSurface>
        <div className="-my-1 flex items-center gap-2">
          <ExplorerDetails />
        </div>
      </TopBarSurface>
    </div>
  );
};
