// import { Logo } from "../BlobscanLogo";

import { DarkModeButton } from "../DarkModeButton";

type DesktopNavProps = {
  isHomePage: boolean;
};

export const DesktopNav: React.FC<DesktopNavProps> = ({ isHomePage }) => {
  return (
    <nav className="flex items-end justify-end" aria-label="Global">
      {isHomePage ? <DarkModeButton /> : "No home page top bar"}
    </nav>
  );
};
