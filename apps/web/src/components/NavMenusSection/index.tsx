import { useEffect, useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/solid";

import { Button } from "../Button";
import { MobileMenu } from "./MobileMenu";
import { NavItem } from "./NavItem";
import { MENU_DATA } from "./data";

export const NavMenusSection: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [mobileMenuOpen]);

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="icon"
        className="md:hidden"
        onClick={() => setMobileMenuOpen(true)}
        icon={<Bars3Icon />}
      />

      <div className="hidden items-center gap-4 md:flex">
        {MENU_DATA.map((item) => (
          <NavItem {...item} key={item.label} />
        ))}
      </div>

      <MobileMenu
        data={MENU_DATA}
        open={mobileMenuOpen}
        closeMenu={() => setMobileMenuOpen(false)}
      />
    </div>
  );
};
