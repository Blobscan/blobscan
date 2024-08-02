import { NavItem } from "../Menu";
import { SidebarMenu } from "./SidebarMenu";
import { MENU_DATA } from "./data";

export const NavMenusSection: React.FC = () => {
  return (
    <div className="flex items-center justify-between">
      <SidebarMenu />

      <div className="hidden items-center gap-4 md:flex">
        {MENU_DATA.map((item) => (
          <NavItem {...item} key={item.label} />
        ))}
      </div>
    </div>
  );
};
