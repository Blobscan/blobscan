import { Logo } from "../../BlobscanLogo";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { NavMenusSection } from "./NavMenusSection";
import { TopBarSurface } from "./TopBarSurface";

export const DesktopNav: React.FC = () => {
  return (
    <TopBarSurface>
      <div className="flex h-full justify-between">
        <div className="flex grow  items-end gap-12">
          <Logo className="h-8 w-32 sm:h-9 sm:w-36" />
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
  );
};
