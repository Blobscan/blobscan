import { Logo } from "../../BlobscanLogo";
import { DarkModeButton } from "../../DarkModeButton";
import { SearchInput } from "../../SearchInput";
import { TopBarSurface } from "./TopBarSurface";

export const DesktopNav: React.FC = () => {
  return (
    <TopBarSurface>
      <div className="flex h-full justify-between">
        <Logo className="h-8 w-32 md:h-9 md:w-36" />
        <div className="w-1/2 md:w-1/2 lg:w-1/3">
          <SearchInput />
        </div>
        <DarkModeButton />
      </div>
    </TopBarSurface>
  );
};
