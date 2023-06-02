import { Logo } from "../../BlobscanLogo";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { TopBarSurface } from "./TopBarSurface";

export const DesktopNav: React.FC = () => {
  return (
    <TopBarSurface>
      <div className="flex h-full justify-between">
        <Logo className="h-8 w-32 sm:h-9 sm:w-36" />
        <div className="w-1/2 sm:max-w-xl">
          <SearchInput />
        </div>
        <ThemeModeButton />
      </div>
    </TopBarSurface>
  );
};
