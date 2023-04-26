import { Logo } from "../../BlobscanLogo";
import { DarkModeButton } from "../../DarkModeButton";
import { SearchInput } from "../../SearchInput";
import { TopBarSurface } from "./TopBarSurface";

export const DesktopNav: React.FC = () => {
  return (
    <TopBarSurface>
      <div className="flex h-full justify-between">
        <Logo size="md" />
        <div className="lg:w-1/4">
          <SearchInput />
        </div>
        <DarkModeButton />
      </div>
    </TopBarSurface>
  );
};
